---
title: "RANGE vs. ROWS: The Rolling Revelation"
pubDate: 2025-07-08
tags: ["db"]
---
_Context: I was working through a practice problem with an `Orders` table with each order having a date and a purchase
amount. I needed to get a 3-month rolling average to see how sales are trending over time._

Like any reasonable person, I wrote a solution that worked. It used a window function with `ROWS BETWEEN`, and I felt
good about it (you know...because it passed the test cases until .01 seconds).

But then... I saw someone else solve the same problem using `RANGE BETWEEN`, and when I see new syntax I hit the docs.

---

## The First Attempt: `ROWS BETWEEN`

Here’s the initial solution I came up with:

```sql
WITH confirmed_purchases AS (
  SELECT
    date_trunc('month', created_at) AS month,
    SUM(purchase_amt) AS total_purchase_amt
  FROM amazon_purchases
  WHERE purchase_amt > 0
  GROUP BY date_trunc('month', created_at)
)
SELECT
  TO_CHAR(month, 'YYYY-MM') AS month,
  AVG(total_purchase_amt) OVER (
    ORDER BY month
    ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
  ) AS rolling_avg
FROM confirmed_purchases;
```

This says: "For each row, give me the average of the current and previous two rows, ordered by month." It works because
we have one row per month.

---

## The Twist: `RANGE BETWEEN` + `INTERVAL`

Then I saw someone use this:

```sql
WITH confirmed_purchases AS (
  SELECT
    date_trunc('month', created_at) AS month,
    SUM(purchase_amt) AS total_purchase_amt
  FROM amazon_purchases
  WHERE purchase_amt > 0
  GROUP BY date_trunc('month', created_at)
)
SELECT
  TO_CHAR(month, 'YYYY-MM') AS month,
  AVG(total_purchase_amt) OVER (
    ORDER BY month
    RANGE BETWEEN INTERVAL '2 MONTH' PRECEDING AND CURRENT ROW
  ) AS rolling_avg
FROM confirmed_purchases;
```

Instead of counting rows, this version says: "Give me all rows where the `month` is within the last 2 months of the
current row." And it does so using actual time logic. _Very human-readable. Very elegant._

---

## So What’s the Difference?

Let’s break it down:

| Concept                      | `ROWS BETWEEN`                             | `RANGE BETWEEN`                                    |
| ---------------------------- |--------------------------------------------|----------------------------------------------------|
| How it works                 | Counts a fixed number of rows before/after | Considers rows based on a range of values          |
| Use case                     | Works well for sorted, dense data          | Best for time-based or value-based sliding windows |
| Sensitive to duplicates/gaps | Yes                                        | No                                                 |
| Intervals                    | Not supported                              | Uses `INTERVAL` for time-based ranges              |

---

## Why This Matters

In a clean dataset where you have one row per month, either approach will work.

But in real-world data:

* You might have **missing months** (no sales that month)
* You might have **duplicate rows**
* You might eventually switch to **daily granularity**

When any of those things happen, `RANGE` is the safer and more flexible option. It respects actual time, not just row position.

Also, can we talk about how nice INTERVAL '2 MONTH' reads? It’s like talking to SQL in plain English.

## Final Thoughts

This is one of those little moments that made me go: "Wait... you can do that?"

I didn't know RANGE existed let alone the partitioning supported by time intervals like that. Now that I do **it's 100%
going in the toolbox**.

Shoutout to whoever wrote that version of the query!

Until next time: keep it windowed, keep it rolling.