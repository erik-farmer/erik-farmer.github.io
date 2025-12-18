---
title: "Regex is Fun? PostgreSQL Pattern Matching Adventures"
pubDate: 2025-12-17
tags: ["db"]
---
## The Problem: Matching Whole Words Only

Let's say you're searching for mentions of "bull" or "bear" in article contents. You want the actual words, not partial matches.

The naive approach:

```sql
WHERE contents LIKE '%bull%' OR contents LIKE '%bear%'
```

This catches everything: "bull", "bullet", "bulletin", "bearings", "unbearable"... not ideal.

Enter PostgreSQL's regex operator and word boundaries:

```sql
WHERE contents ~* '\m(bull|bear)\M'
```

What this is:

- `~*` is the case-insensitive regex match operator
- `\m` marks the start of a word boundary
- `\M` marks the end of a word boundary
- `(bull|bear)` matches either "bull" or "bear"

So this expression means: **match whole words "bull" or "bear" (case-insensitive)**.

---

## Real-World Example

Say you're analyzing café reviews and want to find mentions of beverages:

```sql
SELECT name, review
FROM establishments
WHERE review ~* '\m(cafe|tea|juice)\M';
```

This will match "I love their tea" but not "I love their teacher" (even though "tea" is in "teacher").

The word boundaries `\m` and `\M` ensure we're matching complete words, not substrings.

---

## Bonus: String Manipulation with Regex

PostgreSQL also has `regexp_replace()` for pattern-based string manipulation.

Want to remove all vowels from text? (For... reasons?)

```sql
SELECT regexp_replace(words, '[aeiouAEIOU]', '', 'g');
```

Breaking this down:
- First argument: the source string
- Second argument: pattern to match (any vowel)
- Third argument: replacement string (empty string = remove)
- Fourth argument: `'g'` flag for "global" (replace all occurrences)

---

## Why This Matters

PostgreSQL's regex support means you can:

- **Match patterns precisely** without complex nested `LIKE` statements
- **Extract data** using `regexp_matches()`
- **Transform strings** with `regexp_replace()`
- **Split strings** using `regexp_split_to_array()`

All without leaving SQL or writing application-layer code.

---

## Final Thoughts

Word boundaries (`\m` and `\M`) are one of those features that seem niche until you need them. Then they become essential.

Next time you're reaching for multiple `LIKE` clauses or thinking about pulling data into application code for string processing, consider whether PostgreSQL's regex operators can handle it directly.

Your database is more powerful than you think.

Until next time: keep your patterns precise and your boundaries clear.
