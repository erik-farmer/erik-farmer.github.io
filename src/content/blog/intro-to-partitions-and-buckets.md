---
title: "Slice and Dice! (Partitioning and Bucketing with Spark)"
pubDate: 2025-07-22
tags: ["spark"]
---

**TL;DR on Partitioning and Bucketing**

* Partitioning splits your data into directories based on column values (useful when you’re filtering)
* Bucketing colocates column values into fixed files (good when you’re joining or aggregating)

> If it filters, **partition** it.
>
>If it collects, _bucket_ it.
>
> (If it does both...Godspeed?)

Not gonna lie...when I first saw that this chapter was all about file formats my eyes glazed over a bit. Like yeah, we’re
gonna read from a CSV, maybe load some stuff from a database, write to Parquet, move on with our lives. That’s not
something I need 20 pages of syntax for. This is the type of think I'll just look it up when I need it. Programming
content isn't always thrilling (there's an irony joke somewhere in there but I digress) and sometimes you land in the
dry stuff.

That's why I was pleasantly surprised toward the end when partitioning and bucketing came up. Finally, something that felt
more Spark-y. This is the kind of thing I don't really see my Pandas work and maybe only occasionally in something like
Polars. BUT! it _is_ one of those things I keep seeing is essential to getting performance right in Spark. So I figured
I'd grab that third cortado, fire up GoLand, dig in, try it out, and document what made sense (and what didn't) along
the way.

# The Setup

I grabbed a COVID dataset off GitHub that, at the time of writing, had ~429k rows. That felt like a nice size for
playing with these concepts, small enough to fit in `/tmp`, big enough to see some Spark behaviors.

I threw together a simple ETL pipeline.

## Extract

(some variables omitted to focus on the meat)

Nothing fancy here takes in our dataset but only selects the columns we want (ok so maybe there is _light_ transforming)

```python3
def extract(spark: SparkSession) -> DataFrame:
    url = "https://raw.githubusercontent.com/owid/covid-19-data/refs/heads/master/public/data/owid-covid-data.csv"
    columns_to_select = ["iso_code", "continent", "location", "date", "new_cases", "new_deaths", "population"]

    with tempfile.NamedTemporaryFile(delete=True, suffix=".csv") as tmp:
        r = requests.get(url)
        tmp.write(r.content)
        tmp.flush()

        # Now read from local file
        df = spark.read \
            .option("header", "true") \
            .option("inferSchema", "false") \
            .schema(COVID_SCHEMA) \
            .csv(tmp.name)

        # Force materialization before tmp file is deleted
        extracted_df = df.select(*columns_to_select).cache()
        extracted_df.count()

    return extracted_df
```

## Transform

Some basic manipulation:

* Parse the string date into an actual date
* Drop rows with nulls or empty strings for key columns

```python3
def transform(df: DataFrame) -> DataFrame:
    transformed_df = df \
        .withColumn("date", to_date(col("date"), "yyyy-MM-dd")) \
        .filter(col("iso_code").isNotNull()) \
        .filter(col("date").isNotNull()) \
        .filter(col("location").isNotNull()) \
        .filter(col("iso_code") != "") \
        .filter(col("location") != "")
    
    return transformed_df
```

## Load

Get that sweet, sweet data loaded into parquet with a few performance-flavored bells and whistles.

```python3
def load(df: DataFrame, output_path: str = "output/covid_partitioned_bucketed"):
    df_with_year_month = df.withColumn("year", year(col("date"))) \
                          .withColumn("month", month(col("date")))

    distinct_count = df_with_year_month.select("iso_code").distinct().count()
    num_buckets = min(32, max(4, distinct_count // 2))
    print(f"{num_buckets=}")

    df_with_year_month.write \
        .mode("overwrite") \
        .option("path", output_path) \
        .option("parquet.block.size", 67108864)  \
        .partitionBy("year", "month") \
        .bucketBy(num_buckets, "iso_code") \
        .sortBy("iso_code", "date") \
        .format("parquet") \
        .saveAsTable("covid_data_partitioned_bucketed")
```

The magic is in `.partitionBy("year", "month")` and `.bucketBy(num_buckets, "iso_code")`


## So what's this all actually do

Partitioning and bucketing shape the *layout* of your data on disk in ways that Spark can take advantage of. Here's what I learned from playing around with both:

### Partitioning

When you call `.partitionBy("year", "month")`, Spark writes your data into a nested folder structure based on those columns. For example, you'll get directories that look like:

```
output/covid_partitioned_bucketed/
└── year=2023/
    ├── month=1/
    ├── month=2/
    └── ...
```

This is helpful for humans (it's easier to eyeball data when it's organized), but more importantly, it's great for
performance. If you run a filter like `WHERE year = 2023`, Spark doesn't scan the entire dataset—it just jumps straight
to the relevant directories. That's called *partition pruning*, and it's one of the cheapest wins you can get when
reading large datasets.

Even on my local machine with the 429k rows, it made a difference. In a cluster setup, this would avoid pulling
unnecessary files across the network and hitting unrelated nodes.

### Bucketing

Bucketing is a bit different. When you call `.bucketBy(num_buckets, "iso_code")`, Spark hashes the `iso_code` and uses
modulo arithmetic to assign each record to a specific file—consistently. This means all records with the same `iso_code`
end up in the same bucket file every time.

That’s a huge win for joins and aggregations. If you join two bucketed tables on the same column and bucket spec, Spark
knows exactly which files to match up. It avoids a shuffle, which is expensive.

And yeah, Parquet files are already columnar and efficient but this helps Spark skip *entire files*, not just columns.

_Less I/O, less memory, less time._

So while partitioning helps with *filtering*, bucketing helps with *joining and grouping*. Together, they give Spark the
map and the shortcuts.


## A Peek Under the Hood

The satisfying part of this exercise was actually seeing the benefits show up in the query plan. When we filtered by
year, Spark used *partition pruning*, jumping straight to the right directories. When we filtered by `iso_code`, the
bucketed layout kicked in (though interestingly, the planner noted that bucketing was disabled for some queries and
enabled for others). And in the join example, Spark knew exactly how many buckets to match up.

In practice, I don't think most people routinely examine query plans unless something is slow. I imagine these kinds of
tuning decisions (like whether to add bucketing or sort columns) come up more often in code review than through deep query
plan analysis (though I could be wrong!). Still, it was reassuring to see that these options actually showed up in the
plan. I didn't run any benchmarks myself. If that's your thing, a quick Google search will turn up a handful.
Ultimately it was satisfying to know Spark was doing something different when I added these options to `write`.

I'll be keeping this in mind going forward, especially as I move toward bigger datasets and distributed runs. Seeing it
all click (even if only on a local setup) was a solid reminder that layout matters.
