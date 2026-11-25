# World Daily Brief — 25 November 2026

An original, code-drawn picture-editor front page summarizing eight supplied world-news reports for Wednesday 25 November 2026. `main.ts` uses only Node.js built-in modules, draws its typography and pictograms into a raster buffer, and writes a deterministic PNG.

Run it with Node 22:

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

The output is `out/entry.png` (or `/output/entry.png` when the variable is unset).

## Sources

- AP News: https://apnews.com
- AP News in Brief, via WTHR: https://www.wthr.com/article/syndication/associatedpress/ap-news-in-brief-at-1204-am-est/616-19526d96-667d-445f-876e-53a856fcc037
- Reuters world news summary, via Devdiscourse: https://www.devdiscourse.com/article/international/4011704-reuters-world-news-summary
- The Guardian, Ukraine war briefing: https://www.theguardian.com/world/2026/nov/25/ukraine-war-briefing-zelenskyy-and-hungary-pm-hail-new-era-of-cooperation-after-orban
- ILKHA, Nepal flood: https://ilkha.com/english/world/nepal-flood-death-toll-tises-to-472-as-rescuers-race-to-find-missing-558031
- Al Jazeera, WFP food routes warning: https://www.aljazeera.com/news/2026/11/24/wars-choke-global-food-routes-threatening-aid-for-7-3-million-wfp-warns
- AP Iran report, via NewsNation: https://www.newsnationnow.com/world/international-headlines/ap-iran-insists-no-talks-with-the-us-until-its-7-conditions-are-met-and-other-mideast-news/amp/
