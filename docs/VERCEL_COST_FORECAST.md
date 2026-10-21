# Vercel cost forecast

Estimated 3 October 2026. Scenario model based on code inspection, not production measurements. USD/month before tax. One deploying developer, Pro, Fluid Compute, Frankfurt pricing, Flat Rate CDN enabled and eligible. Excludes database, email, map provider, domain, paid analytics, and other add-ons. No application code changes.

| MAU | Monthly page views | Baseline | Scenario range |
| ---: | ---: | ---: | ---: |
| 1,000 | 30,000 | $20 | $20–$20 |
| 5,000 | 150,000 | $40 | $40–$55 |
| 10,000 | 300,000 | $46 | $40–$86 |
| 25,000 | 750,000 | $160 | $145–$261 |
| 50,000 | 1,500,000 | $217 | $188–$420 |
| 100,000 | 3,000,000 | $531 | $472–$936 |
| 250,000 | 7,500,000 | $873 | $726–$1886 |

The range varies image cache misses and compute durations, not browsing volume. It is not a maximum bill or confidence interval.

## Code observations

- Search results show up to 24 listing cards, optimized cover images at quality 85, and optional avatars.
- Galleries show a hero plus up to four image tiles, with a lightbox.
- Uploads preserve submitted originals, permit 10 MiB per photo and up to 12 photos per listing; no compression was found in the upload helper.
- Navbar resolves sessions through request headers. Search pages query PostgreSQL and resolve user-specific data. Model page loads as dynamic.
- Open chat threads poll every three seconds without a visibility-based pause.
- Map tiles come from an external provider and are outside this estimate.

## Assumptions

- 30 page views per MAU per month; 1.5 MB average delivered page weight.
- 15 CDN requests per page view, including assets, image requests, and navigation.
- 1.3 dynamic page requests per page view for navigation/prefetch overhead, plus three API actions per MAU.
- 20% of users keep chat open 30 minutes/month: 120 polls per MAU averaged across all users.
- Page/API requests: 60 ms active CPU, 500 ms elapsed time. Polls: 8 ms active CPU, 120 ms elapsed time. These have NOT been benchmarked.
- 2 GB allocated memory; sum elapsed request times for a conservative memory estimate. Fluid concurrency may reduce actual memory costs.
- 12 optimized images/page, 100 KB per derivative (13 cache units at 8 KB/unit).
- Baseline: 1% transformation/cache-write rate, 20% shared-cache read rate. Low: 0.5% misses and 0.7x compute duration. High: 5% misses and 2x compute duration.
- Originals average 2 MB. Budget one original fetch per transformation, 120 KB origin output per page/API request, and 1 KB per poll. Original-fetch origin accounting is a conservative allowance, to replace with actual optimizer/Blob counters.
- Stored listings equal 5% of MAU, six 2 MB photos each. Storage actually varies independently and accumulates with historic uploads.
- $3/month miscellaneous build/usage allowance. Heavy deployment activity needs separate budgeting.
- No substantial bot traffic or unusually long abandoned chat sessions.

## Rates

Pro: $20 platform fee, including one deploying developer and $20 metered resource credit. Another deploying developer adds $20/month without another resource credit.

Flat Rate CDN adds $0 for 1M requests/1 TB; $20 for 10M/50 TB; $100 for 50M/50 TB; $300 for 150M/50 TB. Use the smallest sufficient tier for sustained usage; transition-month handling differs. Treat CDN subscriptions separately from metered credit. Verify activation and eligibility.

Frankfurt: CPU $0.184/hour; memory $0.0152/GB-hour; invocations $0.60/million; transformations $0.0601/thousand; image cache reads $0.52/million units; writes $5.20/million units; origin transfer $0.06/GB; Blob storage $0.025/GB-month; simple operations $0.43/million; advanced operations $5.40/million. Image delivery geography may differ from compute region.

Total = $20 platform + CDN tier + max(0, metered resource charges − $20 credit).

## Baseline example: 50,000 MAU

1.5M page views; 6M polls; about 28.65M CDN requests; 2.62 TB modeled transfer. $100 CDN tier.

| Metered item | Monthly cost |
| --- | ---: |
| Active CPU | $8.89 |
| Memory | $14.95 |
| Invocations | $4.86 |
| Image transformations/cache | $47.32 |
| Origin transfer allowance | $37.08 |
| Blob storage | $0.75 |
| Blob operations | $0.16 |
| Miscellaneous allowance | $3.00 |
| Total before credit | $117.01 |

$20 platform + $100 CDN + $97.01 metered excess = $217.01/month.

## Sources and next validation

- [Pro](https://vercel.com/docs/plans/pro-plan)
- [Flat Rate CDN](https://vercel.com/docs/pricing/flat-rate-cdn)
- [Compute](https://vercel.com/docs/functions/usage-and-pricing)
- [Frankfurt rates](https://vercel.com/docs/pricing/regional-pricing/fra1)
- [Images](https://vercel.com/docs/image-optimization/limits-and-pricing)
- [Blob](https://vercel.com/docs/vercel-blob/usage-and-pricing)

Replace assumptions after seven days of production usage: bytes/page, requests/page, CPU/memory, chat polling hours, image cache behavior, origin transfer, stored GB, and build activity. More browsing, worse caching, slower queries, retained originals, and bots can exceed these ranges. These user levels do not automatically require Enterprise.

