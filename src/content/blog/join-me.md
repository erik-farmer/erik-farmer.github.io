---
title: "Now I'm bummed `SEMI JOIN` isn't ANSI SQL"
pubDate: 2025-06-01
tags: ["spark"]
---
I've been doing data engineering for over 5 years now so when I hit the Spark chapter on joins in *Spark: The Definitive Guide*,
I figured it'd be smooth sailing.

And it mostly was! Inner joins, outer joins, Cartesian joins...they're all there, and they behave exactly like you'd
expect if you've ever written SQL. One surprise was the concept of a left semi join. Spark treats this as a first-class
key word, even though I don't recall seeing it in other SQL dialects by name.

I did a little digging and turns out Postgres and Snowflake don't have a native `left semi` keyword, but they do support the
concept through subqueries and WHERE EXISTS. Still, there's something satisfying about Spark giving it a name and making
it easy to use.

Where Spark really diverges is in how it executes joins. That's where the rabbit hole opens. You've got two big options:
shuffle joins and broadcast joins. **Shuffle joins** involve moving data across the network, which is as expensive as it sounds.
If you've got 10 partitions, Spark might be rebalancing data across all of them just to complete the join.

**Broadcast joins**, on the other hand, are more surgical. If Spark detects a small-enough table (or you hint it with a 
`broadcast()`), it'll just send that table to all executors. It's a huge performance gain as long as your small table
actually fits in memory.

What clicked for me was the realization that tuning joins isn't about just getting the right rows but it's also about
minimizing movement. Partitioning matters! Filters matter! Schema pruning matters! Joins add logistics to a problem
category that is typically just logical.

This wasn't a deep dive into all the tuning knobs (that's for another time with flight/cab/etc data), but it was a good
reminder that my existing SQL knowledge transfers well into the Spark world and that there is a new focus on
*when it will cost more*.