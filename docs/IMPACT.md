# Impact: cost, capacity and savings model

The numbers behind the in-app Impact page (`#/impact`). Reference numbers in square brackets point
to [`docs/research/sources.md`](./research/sources.md). Figures marked *estimate* rest on the
assumptions listed next to them and have not been measured.

## 1. The problem (cited)

| Fact | Value | Source |
|---|---|---|
| UAE residents who have encountered a scam | 7 in 10 | GASA / Trend Micro survey of 1,000 residents, Jan 2026 [24] |
| UAE residents who lost money to a scam in the last year | 1 in 3 | same survey [24] |
| Average loss per victim | US$2,194 | 2024 State of Scams in UAE survey [26] |
| Returned to victims by Abu Dhabi Police | Dh140 million over two years | announced Oct 2025 [30][31] |
| Online fraud cases handled by Abu Dhabi Police | 15,642 over the same two years | [30][31] |
| Individuals using internet banking | 81.75% (2025) | TDRA open data [1] |
| Population of Abu Dhabi emirate | 4,135,985 (2024) | SCAD [11] |

Survey figures are self-reported and come from different years. Cite each with its own wording.

## 2. Accuracy (measured by us)

Blind holdout of 141 addresses, address-analysis layer only: 91.5% accuracy, 100% precision,
81.5% recall, 0 false alarms on 76 real sites. Method, misses and limits:
[`docs/eval/address-layer.md`](./eval/address-layer.md). The full pipeline (page rendering plus AI)
has not been measured.

## 3. Cost per scan (estimate)

List prices for Gemini 3.5 Flash-Lite: $0.30 per 1M input tokens, $2.50 per 1M output tokens [61].

| Item | Assumption | Cost |
|---|---|---|
| Input | about 5,000 tokens (instructions, telemetry, up to 7,500 characters of page text) | $0.0015 |
| Output | about 900 tokens (bilingual JSON verdict) | $0.00225 |
| **AI per scan** | | **about $0.004 (AED 0.014)** |
| Live Google Search lookup | $14 per 1,000 after 5,000 free a month, paid tier only [61] | + $0.014 |
| **AI per scan with live lookup** | | **about $0.018** |

The token counts are our estimate from the prompt size, not a measurement from billing.

## 4. Monthly running cost (estimate)

| Scans per day | Server (Render list prices [63]) | AI | Live lookups | Total without lookups | Total with lookups |
|---:|---|---:|---:|---:|---:|
| 500 (today) | Free tier | free tier | not on free tier | $0 | n/a |
| 1,000 | one 2 GB instance, $25 | $113 | $350 | about $140 | about $490 |
| 10,000 | two 4 GB instances, $170 | $1,125 | $4,130 | about $1,300 | about $5,400 |
| 100,000 | twelve 4 GB instances, $1,020 | $11,250 | $41,930 | about $12,300 | about $54,200 |

Assumptions:
- 30-day month. Server counts are rough: one scan holds a headless browser for 10 to 20 seconds.
- "Today" is the free allowance our key shows in Google AI Studio. Google does not publish
  free-tier request limits [62].
- Google's default cap on Search lookups is 1,500 a day per project [61][62]; above that a quota
  increase is needed.
- Caching repeat links would cut these figures, because one scam campaign sends the same link to
  many people. Link caching is not built yet.
- The self-hosted fallback (Jais 2) costs hardware and electricity, not per-scan fees.

## 5. How many people it serves (estimate)

Assuming an active user checks two links a week: weekly users = scans per day × 7 ÷ 2.
1,000 scans a day is about 3,500 weekly users; 10,000 is about 35,000; 100,000 is about 350,000.
The two-a-week figure is an assumption, not a measurement.

## 6. What it could save (illustration)

```
10,000 residents × 1 in 3 losing money in a year [24]   = about 3,300 victims
                 × US$2,194 average loss [26]            = about US$7.3 million at risk
                 × 1% of losses prevented                = about US$73,000 (AED 270,000) a year
```

For 35,000 weekly users, 1% prevented is about US$256,000 a year, against a running cost of
US$16,000 to US$65,000 a year from section 4.

This is an illustration, not a forecast:
- The share of losses a link checker prevents has not been measured by anyone we could cite.
- The "1 in 3" and "US$2,194" figures come from two different survey years.
- Not every scam involves a link the tool could check.

## 7. Things to say carefully

- **Abu Dhabi Police already offer an AI check.** The Aman portal has a "Smart assessment" section
  with message analysis and a link risk check [15]. Present ScamHisn as going further (job posts,
  map listings, screenshots, an evidence report, a browser extension), not as the first.
- **Aman takes information, not formal complaints** [13]. Say "report it to Aman", and tell victims
  who lost money to also file a police report and call their bank.
- **Live Google lookups may not run on the free tier** for `gemini-3.5-flash-lite` [61]. Check a
  scan's `coverage.liveSourcesChecked` before claiming live verification on stage.
- **Daily cyberattack counts differ between official statements** [36][37][38]. If one is quoted,
  say which statement it is from.
