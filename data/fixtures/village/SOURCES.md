# Fixture village: reference values, sources

`reference.json` holds the reference values for DESIGN §3's fixture village (D-SOC-1; development-only analogue of
late-fourteenth-century England, H1). `value: null` means no readable source gave the key; nothing is estimated.

## Sources used

| Citation | URL | Gives | Evidence |
|---|---|---|---|
| Schurer, Garrett, Jaadla and Reid, 'Household and family structure in England and Wales, 1851-1911', Continuity and Change (Table 3, citing Wall 1983, Family Forms in Historic Europe, Table 16.2) | https://api.repository.cam.ac.uk/server/api/core/bitstreams/3fce6076-c37a-4001-95e6-1292ce090952/content | mean household size 4.17 (1650-1749), 4.57 (1750-1821); not the 1380s | 3 |

## Searched, not usable

(2982) searched: households_per_parish — 1377 poll-tax studies (Northamptonshire paper, Ongar Hundred VCH, Wiltshire VCH, Fenwick edition reviews): all count taxpayers over 14 per vill, not households, and no readable conversion; Laslett and Wall via search snippets only.
(2982) searched: household_size_distribution — Laslett 1972 *Household and Family in Past Time* (archive.org householdfamilyi00lasl, householdfamilyi0000lasl): lending-only, full text returns the interface or HTTP 401; secondary papers give shares of individuals, not households.
(2982) searched: complex_household_share — Laslett 1972 (lending-only); Schurer et al. give 1851-1911 only; no readable pre-industrial figure.
(2982) searched: age_structure_five_year — Wrigley and Schofield 1981 (Google Books and Cambridge landing pages only, no table), Razi on Halesowen (no readable text found).
(2982) searched: sex_ratio — Wall 1983 and Razi/Smith/Goldberg poll-tax studies: only prose mentions, no values in a readable text.
(2991) searched: households_per_parish — second pass: Warwick/LSE 'English medieval population' paper, Cambridgeshire population appendix, Cumbria poll-tax table, Hertfordshire poll-tax pdfs (search results only; they give multipliers of 3.5 to 5.0 for taxpayers, which are contested and not households per parish). Razi and Goldberg poll-tax tables: no open full text found. No value.
(2991) searched: household_size_distribution — Laslett 1972 Table 4.3 and the 1969 Population Studies article: only prose mentions of the 4.75 mean found, no distribution table in a readable text. Hajnal 1982 not readable. No value.
(2991) searched: complex_household_share — Hajnal 1982 (Population and Development Review 8), Laslett's 100-community table: no readable full text found; no pre-industrial share available. No value.
(2991) searched: age_structure_five_year — Wrigley and Schofield 1981: only library catalogue and review landing pages, no open paper quoting the five-year table. No value.
(2991) searched: sex_ratio — Wall 1983 and Razi/Goldberg poll-tax studies: no readable text giving values. No value.

## economy.json: household budget, illness, mortality, harvest (unit 5241; DESIGN §1.16 ruling 1)

`economy.json` holds the values the D-SOC-1 bench needs from the absent Economy and Life engines, for an English
village c.1370–1400. It is five arrays (`income_by_occupation`, `subsistence`, `illness`, `mortality`, `harvest`) of rows
`{id, value, unit, period, source{citation, url, pages}, stated, read_via, note}`. Money is in English pence (12d = 1s).
`value: null` with `source_silent: true` means no readable source gave the figure; nothing is estimated, and per
codex/RULES.md 7 the bench refuses to run on a null it needs. Where a source gives a range and no central figure the row's
`value_basis` says the value is the midpoint (or the middle of three); the range is always in `stated`. `read_via` says
whether the row was read from a full page or only from a search-result or news summary.

The fixture village has no occupation field (`village.json` persons carry id, sex and age; posts link a person to a work
parcel), so rows are by occupation class: casual day labourer, craftsman (carpenter, thatcher), woman's day work,
servant in husbandry (ploughman, carter, swineherd). The keeper assigns classes to posts.

### Sources used

| Citation | URL | Gives | Read |
|---|---|---|---|
| Page, W. (ed.), *A History of the County of Middlesex*, vol. 2 (VCH, 1911), 'Social and economic history: Appendix 2' | https://www.british-history.ac.uk/node/15304 | day wages 1384–86 (labourer, workman, helps, carpenter, thatcher) and annual cash wages 1384–89 (bailiff, ploughman, carter, swineherd) | full page |
| Owen, Brown and Skinner, 'Sick Leave of Customary Tenants in Late Medieval England', *Journal of British Studies* 64 (2025), e92 | https://www.cambridge.org/core/journals/journal-of-british-studies/article/sick-leave-of-customary-tenants-in-late-medieval-england/9B28EA48C8926957665D526DF414F50C | 229 sick-leave incidences in 62 Ramsey Abbey accounts, durations, deaths, the lord's value of a day's work, the 3d post-plague day wage, the 14s / 84-day Battle Abbey replacement | first 100,000 of 124,504 characters |
| Brown, Owen and Sloane, 'Surviving the Black Death in medieval England: … Warboys', *Historical Research* 99(285) (2026) | https://www.medievalists.net/2026/08/medieval-records-reveal-how-long-black-death-survivors-needed-to-recover/ | summer 1349 sickness spike (22 cases, about 10% of services) | news summary only |
| Humphries and Weisdorf, 'The Wages of Women in England, 1260–1850', *Journal of Economic History* 75(2) (2015), pp. 405–447 | https://www.cambridge.org/core/product/80FBE8313B63D174E2F71DCEAE6D7EBE/core-reader | the 260-day working-year convention; women's rates track men's | text; Table A1 (decade wages) was an image |
| Humphries and Weisdorf, 'Unreal wages?', *Economic Journal* 129 (2019), pp. 2867–2887 | https://research.uniroma1.it/node/55270 | break-even days of casual work against an annual income (about 100 around 1350) | search-result summary only |
| Rogers, *Six Centuries of Work and Wages* (1884), archive.org `cu31924030096733` | https://archive.org/stream/cu31924030096733/cu31924030096733_djvu.txt | women's day wages before and after 1349; board cost 6–8d a week (1408); corn cheap 1380–1400 | OCR text, characters 600,000–900,000 |
| DeWitte, 'Mortality risk and survival in the aftermath of the medieval Black Death', *PLoS ONE* 9(5) (2014) e96513 | https://pmc.ncbi.nlm.nih.gov/articles/PMC4013036/ | Black Death 30–50%; London plague years 1361, 1368, 1375, 1382, 1390 | full page |
| Mullan, 'Mortality, gender, and the plague of 1361–2 on the estate of the bishop of Winchester', *Cardiff Historical Papers* (2007) | https://www.medievalists.net/2010/05/mortality-gender-and-the-plague-of-1361%e2%80%932-on-the-estate-of-the-bishop-of-winchester/ | Black Death one-third to one-half; later epidemic years | abstract page only |
| Wikipedia, 'Great Famine of 1315–1317' (citing Ruiz, Teaching Company; Fordham Medieval Sourcebook) | https://en.wikipedia.org/wiki/Great_Famine_of_1315%E2%80%931317 | yield ratios 7:1 and 2:1; 1315 price doubling; English dearths 1351, 1369 | full page; low evidence |
| Bailey, extreme weather in the 1430s, *Economic History Review* (2026), via Medievalists.net | https://www.medievalists.net/2026/05/extreme-weather-pushed-medieval-england-into-crisis-study-finds/ | wheat three times normal in 1438–39 | news summary only |
| Campbell's London grain figure and Dyer's family-of-five energy estimate, as reported in two *Journal of Medieval History* (2023) articles (doi 10.1080/03044181.2023.2250947 and .2250952) | tandfonline.com (403 to the fetch) | 1.65 quarters a head; 11,000 kcal a day for five | search-result summary only |

### Caveats

- **The standard sources were not reachable.** Dyer (*Standards of Living*), Allen (2001), Clark (2007), Munro, Razi (1980),
  Hatcher (1986; Hatcher, Piper and Stone 2006), Campbell and Ó Gráda (2011) and Horrell (2023) were paywalled (403 or
  chapter summaries only) or PDF-only: the fetch tool returns compressed PDF streams it cannot read as text. No file was
  downloaded for this unit. The fetch tool caches the PDFs it retrieves in the session's results folder; an attempt to
  read those copies was refused by the sandbox, so they were not opened. The rows are built from readable pages and are
  thinner than a library visit would give. A follow-up with PDF access would fill most of the nulls.
- **Wages are southern-English and cash-only.** The VCH Middlesex table is from manors near London (Isleworth), where wages
  ran high; most entries name no manor; the table's units are partly inferred by the summarising fetch (shillings as annual,
  pence as daily). Whether livery grain or clothing was extra for the annual servants is not stated; the figures are cash.
- **Day rates are not incomes.** The 260-day year is a convention; the 2019 Humphries–Weisdorf finding (about 100
  break-even days around 1350) says labourers probably did not find that much casual work. No household income is
  computed in the file; the bench's keeper must choose a day count and label it.
- **Illness rows are tenants' sick leave on Ramsey Abbey manors** (Huntingdonshire), not a population rate. The article gives
  no tenant denominator, so the incidence per person-year is null. The 1349 row is a plague spike.
- **Mortality is almost all null.** The only readable figures are the Black Death share and the list of later epidemic
  years. The non-plague crude death rate and adult life expectancy need Razi, Hatcher or Ecclestone.
- **Harvest is thin.** The depth rows are pre-plague (1315) or after the period (1438–39); the 1370–1400 frequency is null.
  Rogers (1884, p. 274) says corn was cheap in the last twenty years of the century.
- **Nineteenth-century and news sources** (Rogers 1884; the 2026 news summaries) are used because they were readable and
  are marked in `read_via`. Rogers's OCR page numbers may be off by one and several of his figures are garbled in the scan.
- **Conflict flagged, not resolved:** the DeWitte (2022) Conversation piece's 31.3-year life expectancy cites a DOI that
  resolves to an unrelated paper; the figure is not used.

### Searched, not usable

(5241) searched: household annual subsistence cost — Horrell 2023 (EHS blog gives text only, figures are images; Wiley 403), Allen 2001 (restricted), Dyer 1989 chs 7–8 (summary only); no pence figure read.
(5241) searched: rent — no cottage or holding rent for 1370–1400 in a readable text.
(5241) searched: crude death rate, adult life expectancy — Razi 1980, Hatcher 1986 (scanned), Hatcher–Piper–Stone 2006 (login), Ecclestone 1999 (certificate error), Kelly (compressed PDF); none readable.
(5241) searched: bad-harvest frequency 1370–1400 — Campbell and Ó Gráda 2011 (abstract only), Titow (ends 1349); none readable.
(5241) searched: statutory wages of 1388 (12 Ric. II c. 4) — Wikipedia, Fordham and Yale Avalon give 1351 only; a masonic periodical transcription was blocked by a bot check; not used.
