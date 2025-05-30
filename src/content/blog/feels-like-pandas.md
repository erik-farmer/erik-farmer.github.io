---
title: "It's giving...Pandas"
pubDate: 2025-05-29
tags: ["spark"]
---
One of the first questions I literally asked ChatGPT was: _"Is this just Pandas with partitioning?"_

At the time, I was working through Spark: The Definitive Guide and by chapter six, it all felt… oddly familiar. Column
selection, filtering, aliases, grouping, the usual suspects were there. Aside from some high-level architecture and history, nothing
really stood out as wildly different from Pandas, Polars, or even SQL.

I couldn't help the feeling: If this is all Spark is so far, how does this book have _sooo_ many chapters?

Learning Spark wasn't just academic. I wanted to understand why it shows up in so many production environments. What makes
it worth using? What does it do better than the tools I already know? And most importantly: how do I start using it in ways that actually matter for my work??

## Familiarity Can Be Deceiving

While I was writing my Spark job it felt like Pandas cousin, but under the hood,
a lot more was happening: distributed computation, lazy execution, physical planning, task scheduling, etc

So while Spark _felt_ like Pandas, I wanted to dig into the why more than the how. I wanted the real learning to start!

Here's a quick example that shows the similarity between Pandas and PySpark when filtering and aggregating data:

### Pandas

```python
import pandas as pd

df = pd.read_csv("ratings.csv")
filtered = (
    df[df["rating"] >= 4.5]
    .groupby("movieId")
    .size()
    .reset_index(name="count")
    .sort_values("count", ascending=False)
)
```

### Pyspark

```python
from pyspark.sql.functions import col

filtered = (
    df.filter(col("rating") >= 4.5)
      .groupBy("movieId")
      .count()
      .orderBy(col("count").desc())
)
```

In both cases, we’re filtering for high-rated movies, grouping by movie ID, and sorting by frequency. The syntax is noticabely parallel.

**And that was the problem.**

If writing Spark code feels like writing Pandas code, how do you know you’re actually using Spark for what it’s good at?
Catalyst Optimizer? Analyzed Logical Plan vs Optimized Logical Plan? Partitioning? I wasn’t sure if I was leveraging it all (let alone well),
or just writing expensive Pandas at scale.

You can absolutely write valid Spark code that generates terrible execution plans.

Here's what I mean. For the pyspark example above Spark produced a solid physical plan: distributed hash partitioning,
a two-stage aggregation (partial then final), and a nice parallel sort at the end. Beautiful. No Notes.

But I needed to introduce a foot gun. With an LLM assisted modification I added a `coalesce(1)` too early (before the filtering and aggregation).

```python
compacted = coalesce_df(ratings_df, 1)  # now only 1 partition via a helper function I wrote
filtered = filter_by_rating(compacted)
filtered.explain(True)
```

Rerunning .explain(True) revealed the damage. One out-of-order operation completely destroyed parallelism. One partition.
One thread. One sad little node doing all the heavy lifting. My distributed pipeline had become a bottlenecked monolith _and Spark **never** complained_.

Ok...so now I know there's a definite order I need to layer in but how many partitions should I start with in the first place?
I went from basic syntax to "here's what not to do" into "now what?". Spark's default behavior seemingly depends on the input.
That means loading one massive CSV might start you off with a single partition, or you could end up with thousands of tiny JSON files each taking a node which also doesn't seem great.
But I knew from my poking arond that your starting partition count is also a config option.

It felt like part art and part science (based on cluster resources, data size, stage behavior).
Something you feel out by running `.explain(True)`, watching where the shuffles are, checking task skew, and slowly building intuition.

This was the turning point. Spark stopped being "just another DataFrame library" and started becoming a tool I could sink my teeth into.

There's a long road ahead, but I'm excited to keep learning. My goal here is to leave a breadcrumb trail of best practices and big data lessons.