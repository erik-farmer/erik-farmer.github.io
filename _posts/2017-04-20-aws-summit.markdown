---
layout: posts
title: "AWS Summit SF"
date:  2017-04-20 00:00:00
---

<p>I was able to sneak away to San Francisco this week and attend the AWS summit.</p>

<p>
  One of the hot topics was serverless architecture and there were a lot of great talks on AWS lambda (some talks can be found <a href="https://www.youtube.com/watch?v=RpPf38L0HHU&list=PLhr1KZpdzukfioHV-_WT28YCcV9_gXb1-&index=1">here</a>). Additionally there were some cool deep dives into EC2 performance. The biggest takeaways were some of the most obvious; 1) keep your OS and packages up to date. 2) Pick the right instance for your workload (compute/memory/io/etc optimized).
</p>

<p>
  The last thing I was exposed to that I need to look into are EC2 <a href="http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/spot-fleet.html">spot fleets</a>. I did some napkin math and a 12+ cluster of t2.nanos could cost ~$5 which would be fun to play with. Essentially you set a bid price for unused EC2 instances to get deep (up to 90%) discounts. Spot instances combined with Lambda APIs could be the base for cheeeeap infrastructure.
</p>