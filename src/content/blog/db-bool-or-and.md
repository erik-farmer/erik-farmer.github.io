---
title: "All I want is BOOL_AND love"
pubDate: 2025-06-25
tags: ["db"]
---

In a recent [SQL challenge](https://platform.stratascratch.com/coding/2002-submission-types?code_type=1), I was asked to
write a query that returns all users from a table that had two particular values for one of the columns. In this case it
was a loan related question so the type of loans we were looking for were at least one `Refinance` and at least one 
`InSchool` submission (users could appear in multiple rows).

At first glance, the problem seems straightforward and I implemented a working solution:

```postgresql
SELECT
  user_id
FROM loans
WHERE type IN ('Refinance', 'InSchool')
GROUP BY user_id
HAVING COUNT(DISTINCT type) = 2;
```

This totally works (and honestly, it’s a solid approach in a lot of cases)! It filters for the two loan types, groups by
user, and ensures the user has submitted both types using a `COUNT(DISTINCT type) = 2`.

But then I glanced at my own cheat sheet of cool built-ins I’ve collected over time and saw `bool_or`. It just felt like
a more expressive, and maybe even clearer, way to write it, especially when you want to be explicit about what you're
checking for:

```postgresql
SELECT
  user_id
FROM loans
GROUP BY user_id
HAVING
  BOOL_OR(type = 'Refinance') AND
  BOOL_OR(type = 'InSchool');
```

## Why BOOL_OR?

 * It kind of reads like natural language
 > "Give me users who have any rows where type = Refinance AND any rows where type = InSchool."
 * It scales better when you’re checking for presence of specific flags rather than relying on count tricks.
 * It’s robust against data surprises, like duplicate rows, or rows with non-normalized values like 'refinance ' or 'Inschool'.

This function returns true if any value in the group meets the condition, making it perfect for presence checks across
categories or flags.

## Is there a BOOL_AND?

Yes, there is!

BOOL_AND(condition) returns:
 * TRUE if all non-null rows satisfy the condition.
 * FALSE if any row fails the condition.
 * NULL if all are NULL.

The original solution wasn’t wrong at all. It was concise and totally gets the job done. However, by reaching for
BOOL_OR, we can improve both the readability and intent of our query.

## Possible rule of thumb?

`BOOL_OR` is awesome when you’re just checking, "Hey, did this happen at least once?" Whereas `COUNT(DISTINCT ...)`
comes in handy when you care about *how many different things* happened.