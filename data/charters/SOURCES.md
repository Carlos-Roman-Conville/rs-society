# Reference charters: sources and vocabulary gaps

`reference.json` holds 24 historical charters decomposed into the components of DESIGN §1.2a, in the shapes of
`src/types.ts`. They are **reference compositions** (Rex, 2026-10-31): they supply component vocabulary, labelled
examples and validation baselines, and never bound what founders may compose. Every component is labelled
`researched`; `evidence` is 3 throughout.

## Reading the file

- Entry fields: `id`, `place`, `date`, `source {citation, url, pages}`, `kind` (observer label only), `components[]`,
  `unmapped[]`, `evidence`, `notes`.
- A component carries `section` (admission, obligation, benefit, decision_procedure, position, sanction, amendment),
  the `types.ts` fields for its `type`, `stated` (the source's own words or figures) and `label: "researched"`.
- Money is in English pence (12d = 1s, 240d = £1, 160d = 1 mark) unless the component carries its own `unit`
  (the Arnstadt entry is in groschen and pfennige). Every amount is as the source states it; a farthing is 0.25.
- `null` means the source is silent, or the figure is garbled in the scan. Schedules are always
  `{first: null, period: null}` with the source wording in `stated_schedule`, since the Kernel clock unit is the
  caller's. Terms stated in years are `null` with the wording in `stated`.
- A sanction's or admission's `procedure` is `null` where the source does not say who decides. Event names
  (`sickness`, `death_of_member`, …) are labels chosen for the file; no engine has been asked whether it emits them.
- A reading (an interpretation of ambiguous wording) is marked "reading" in `stated`.
- **Method caveat.** The texts were read through a summarising fetch of the archive.org OCR, not by hand from the
  scan. Page numbers are the OCR running heads and may be off by one; where the Toulmin Smith record numbers
  (CCCIX, CCCX, CCCVIII) were found but no page, `pages` says so. Figures marked garbled in an entry were garbled in
  the OCR. The keeper should check amounts against the scan before relying on any single figure.
- **OCR check (2996, round 2).** All 24 entries are marked `ocr_checked: true`: each amount and page was compared
  with the archive.org full-text OCR of `englishgildsorig00smit` (16 Toulmin Smith returns and the Arnstadt passage),
  `cu31924032474722` (5 Westlake entries) and `b28773135_0003` (2 Eden entries). The OCR was read in 100 KB windows
  through WebFetch with targeted questions and short OCR snippets; no file was downloaded, and contested figures were
  read twice. Corrected: Norwich Peltyers weekly benefit 0.25 → 14d; Norwich Tailors Holy Thursday wax fine ½ lb → 1 lb;
  Lynn Shipmen the 12d fine belongs to the dean, not the skeuyn. Set to null (garbled or not found, each noted
  `(2914) searched:`): Bishop's Lynn St Thomas ale-chamber fine, Holy Cross sleeping fine, North Lynn St James
  ale-chamber fine, Oxburgh hardship aid, Kendal Free Society admission fine; wax figures for refusing office at North
  Lynn and Bishop's Lynn St Thomas left out of the prose. Pages filled for the 7 "not extracted" entries (Norwich St
  George 17-18, Peltyers 28-32, Tailors 33-36, North Lynn St James 103-105, Wiggenhall 111-113, East Winch 119-120,
  Oxburgh 121) and for Arnstadt (Brentano pp. cliv-clv); page ranges corrected for St Katherine Aldersgate, Poor Men's,
  Holy Cross, Bury, Kirkby Lonsdale and Kendal Free Society (770-772 → 765-766). Still read from damaged OCR and flagged
  in the entries: the Garlekhith 20d feast payment, the Lynn St Thomas 1376 entry fee, the Wiggenhall obol fines, the
  Poor Men's founding year.

## Sources

| Source | Supplied | Entries |
|---|---|---|
| Toulmin Smith, J. and Smith, L. T. (eds), *English Gilds* (EETS o.s. 40, 1870), Part I, the returns of 1388-89. archive.org `englishgildsorig00smit` | London (Garlickhithe, Aldersgate ×2), Norwich (St George, Peltyers, Tailors, Poor Men's), Lynn and Bishop's Lynn (Shipmen, St Thomas, St George the Martyr, Holy Cross, St James), Wiggenhall, East Winch, Oxburgh; the writ of 1 Nov 1388 | 16 |
| Westlake, H. F., *The Parish Gilds of Mediaeval England* (1919). archive.org `cu31924032474722` | Ludlow Palmers 1284, St Peter Cornhill 1406, Holy Trinity Aldersgate Gild Book c. 1450, Bury Dulse 1282, Abbotsbury (Canute) | 5 |
| Eden, F. M., *The State of the Poor* (1797), vol. III. archive.org `b28773135_0003` | Kirkby Lonsdale Union Friendly Society (rules to March 1795), Kendal Free Society; summaries of other societies (Southam, Kendal Friendly Society, Epsom, Esher, Farnham) | 2 |
| Brentano, L., preliminary essay in Toulmin Smith (ed.), *English Gilds* (1870), citing Berlepsch's *Chronik der Gewerke* | Arnstadt journeymen shoemakers' fraternity 1628; mentions of German and Danish gilds (Flensburg, Mensburg, Rothschild) used only as context | 1 |

**Sought but not reached.** Rosser 2015, Barron 1985, Gosden 1961 (the archive.org record `bwb_S0-AIG-848` exists but
was not opened), van Leeuwen 2016 (Palgrave, subscription; the search found no open copy) and Ogilvie 2019 were not
accessible without a download, and Rex's rule is to ask before downloading anything new. Riley's *Memorials of London*
(1868) was opened but the 1350-75 craft ordinances (e.g. the Braelers of 1355, which Brentano cites for sickness
support by the trade) were not located in three 100 KB windows. Dutch and other continental guild rules are
therefore represented only by the Arnstadt entry. A follow-up unit can add them; the gaps below are the
vocabulary the existing 24 already show.

Also left out, deliberately: the Epsom friendly society of 1765 (its rules were not found in vol. III before time ran
out), and Lynn's other 1389 returns (Young Scholars, Nativity of St John, Purification, St Peter, St Mary, St
Katherine, St James), which repeat patterns already covered.

## Vocabulary gaps (the `unmapped` entries, grouped)

Each is a rule the sources show and no current component expresses. They are design items for the keeper, not
decisions. The count is the number of entries whose `unmapped` list contains an instance.

1. **Rites for the dead and acts of worship** (about 17 entries): masses sung for a dead member (a fixed number: 9,
   12, 13, 15, 24, 30, 40, 60), dirige, requiem, candles, torches, tapers, lights before an image, and a hired
   priest or chaplain. §1.10 makes a religious community an organisation, so the rite is a service the organisation
   buys on an event, not a periodic `meeting`. Needs an event-triggered service benefit (perhaps with a payee other
   than the member).
2. **Goods-denominated fines, offerings and levies** (about 14): wax by the pound or stone, ale, bread, barley.
   `Sanction.fine` and `Obligation.dues` carry money only; `Benefit.goods` exists but there is no goods fine or
   goods due. The Lynn returns are dominated by wax fines.
3. **Qualifying periods and claim conditions on benefits** (about 6): seven years' standing for weekly aid;
   nine or twelve months' membership before sick pay (by age at entry); poverty aid only after a public hearing of the
   claim at a quarterly meeting; aid withheld for the member's own folly, wretchedness or theft; a cap of three claims
   per lifetime (Ludlow). Needs a benefit-conditions component (standing, waiting period, fault exclusion, claim cap,
   hearing by a decision procedure).
4. **Recurring and scaled benefits** (about 7): weekly payments for as long as the condition lasts or for life;
   sick pay cut to 3s 6d after nine months; pay reduced when earnings exceed half the former wage; relapse joins
   the periods; repayable sick support (Arnstadt). `Benefit.transfer` is a single amount on a single event.
5. **Admission conditions beyond the six types** (about 9): oath on the book, the kiss of peace, admission only on
   assembly days, good repute, sureties or pledges, health (smallpox survived), age bounds (under 36; 18-30),
   occupation bars (miners, soldiers, seamen), a size cap on membership, and two tiers of membership
   (full brethren and others, Abbotsbury).
6. **Exclusivity toward a class of bodies** (1): "no one may belong to another benefit society" (Kirkby Lonsdale).
   `exclusivity` names organisations by id; the rule names a category.
7. **Office and election mechanics** (about 9): officers chosen by "four picked men" (electors themselves chosen);
   rotation by turn or seniority; a committee of the five oldest and five youngest; a constituency split between
   two bodies (fishmongers and parishioners); a tie broken by a named office (the parson); veto by office holders;
   a bar on re-election for five years; salaries and house fees paid to the dean, clerk and alderman.
8. **Internal dispute settlement** (about 5): quarrels go to the wardens or to arbitrators before any lawsuit, a suit
   needs the alderman's leave, and wardens who fail to reconcile must testify in court. Related to §1.3 but a
   precondition on members' conduct, not an organisation act.
9. **Dress and livery** (4): members buy and wear a livery suit or hood, sometimes for a set period.
10. **Property, stock and the organisation as employer** (about 8): endowment rents, a tenement held by feoffees,
    barley stock lent or held, a school, an almshouse and a chantry priest (Ludlow).
    §1.2 says an organisation owns no money in Society's state; these are Economy and Settlement holdings but the
    charter names the purpose they serve.
11. **Search, fetch and cost-shifting duties** (5): members search six miles for a drowned member; wardens fetch a
    body within five, seven or ten miles; costs fall on the box, or on the executors if the deceased could pay.
12. **Conduct at meetings, reputational sanctions and informal aid** (about 8): rules against noise, sleeping, taking
    the ale cup, entering the ale chamber; secrecy of the gild's counsel as an offence; a black list; voluntary gifts
    to the box; mutual help by individual gifts with no fixed amount.
13. **Claims procedure with deadlines** (1): declare to the landlord, who tells the stewards in 12 hours, who visit
    in 24 hours and may advance up to 3s.
14. **Approval and revision of rules by outside parties, and rules revised in the record** (3): articles confirmed on
    the masters' request (Arnstadt); ordinances added in 1381-82 (Lynn Shipmen); a rule cancelled in the margin (Holy
    Trinity Gild Book). §1.2a's amendment component covers only the procedure inside the organisation.
15. **Beneficiary designation** (1): the death benefit goes to a person named by will or before two witnesses, else to
    widow, children, relations in order. The benefit's payee is not the member.

## For the keeper

- Gaps 1-4 and 5 recur across the unrelated sources and are the first candidates for a component-vocabulary review
  (§1.2a: extending the vocabulary is a design change reviewed like any mechanism).
- Only 7 of the 24 entries record any decision procedure (an amendment rule, an admission vote, or a stated way of
  filling a position), and none has a standing `decision_procedure` component: the sources say who decides and what
  they may not do, never a general rule for the organisation's acts. None states a quorum, so quorum is `null`
  wherever a vote appears. The sources give procedures by role (who may veto, who decides) far more than by tally.
- Unit 2840's schema tests should accept `null` parameters, `procedure: null`, and the extra descriptive fields
  (`stated`, `stated_schedule`, `unit`, `label`) on components.
- Coverage is English gilds (16 of 24 from the 1388-89 returns), with one German and no Dutch charter. If the keeper wants
  the Dutch and other continental baselines the task names, a further unit needs a source that can be read without a
  download or a paywall.
