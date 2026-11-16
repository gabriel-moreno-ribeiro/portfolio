# Numbers audit: every stated fact, one value

Date 2026-11-16. Branch `feat/surreal-prod`. Request: "faça todos os números do site concordarem entre si".

**Scope read.** `src/content/**`, `src/data/*.json` + `news.ts`, `src/constants/**`, `public/llms.txt`,
`index.html`, `api/chat.ts`, copy in `src/components/**` and `src/pages/**`, `public/og-image.png`, and the
text of the nine linked PDFs (`public/files/*.pdf`, `public/research/*/paper.pdf`).

**Rules.** (a) owner-confirmed: SAT 1570/1600, 28 medals in 38 olympiads. (b) newest source wins
(`git blame --date=short`). (c) derived figures recomputed. (d) look-alike numbers checked against the text
and the PDFs before being called a conflict. (e) undecidable: not changed, listed in section 3.

## 1. Facts that had more than one value

| Fact | Values found | Canonical | Rule |
|---|---|---|---|
| Olympiads entered | 38 / 39 / "49 competitions" | 38 | a. Commit `fcb673d` already turned "49 competitions" into olympiads and missed `numbers.json` |
| International medals | 5 / 2 | 5 | b, c (`medals.ts` has 5 Mathématiques sans Frontières golds) |
| Projeto Candela period | 2022 to present / 2023 - 2024 | 2022 to present | b (résumé agrees) |
| Schools pitched | 60 / 60+ | 60+ | b |
| Colégio Militar applicants | 2,500 / 2,500+ | 2,500+ | b |
| Fundação Estudar fellows | about 70 / 70 | ~70 | c |
| Fundação Estudar period | to April 2026 / to March 2026 | April 2026 | b |
| Instituto Principia period | June 2023 to June 2025 / January 2023 to July 2025 | June 2023 to June 2025 | b |
| Fintech RCT effect | "130% more" / "52 pp" | 52 pp | b. The October 2026 monograph (175 pages) gives control 44.25% and tools 91.40%–101.07%: 52.0 pp. Its Appendix C says the first version's ">130%" was the hybrid arm from baseline to October |
| Candela students | 3,392 / "3,000" (blog) | 3,392 | b |
| Where the 28 schools are | "in Salvador" / "Bahia and Ceará" | Bahia and Ceará | b (the paper says 17 + 11) |

Different facts that only look alike (left as they are): the Candela paper's own period (2023-2024); the RCT
fellowship year (2025) vs the paper (2025-2026); the 150-page chemistry monograph vs the 175-page economics one.

## 2. Edits

| File | Before | After |
|---|---|---|
| `src/content/onePager.ts` | 39 science olympiads; 60 schools | 38; 60+ |
| `index.html` (meta + JSON-LD) | 39 olympiads; 2 international; +130% savings | 38; 5; 52 pp |
| `api/chat.ts` | across 39 olympiads | 38 |
| `src/data/numbers.json` | competitions 49 | olympiads 38 |
| `src/content/projects.ts` | period 2023 - 2024; schools "in Salvador" | 2022 to present; "in Bahia and Ceará" |
| `src/constants/terminal/portfolioData.ts` | March 2026; January 2023 - July 2025; 130% more | April 2026; June 2023 - June 2025; 52 pp |
| `src/components/Home/BackgroundGlobe.tsx` | 2,500 applicants | 2,500+ |
| `src/constants/work.ts` | 70 of 10,000+ | ~70 of 10,000+ |
| `src/data/experience.json`, `public/llms.txt` | treatment group saved 130% more | any of the three tools raised reported saving by 52 pp |
| `src/content/blog/drake-equation.md` | 3,000 students (twice) | 3,392 |
| `src/components/Home/FindMyWork.tsx` | 49 competitions | 38 olympiads |
| `PRODUCT.md` | 49 competitions | 38 olympiads |
| `functions/api/chat.js` | dead Cloudflare function: SAT 1510, 39/49, GSAT, CEO, St Andrews | deleted (the site runs `api/chat.ts` on Vercel) |

## 3. Needs the owner (not changed)

1. **Principia length.** `news.ts` says "three years" (the institute's caption); the dates give two.
2. **Olympic Club dates.** "August 2024 to May 2026" (`llms.txt`) vs Colégio Militar "2019 to 2024".
3. **Gold count.** 19 of 28 was also 19 when the total was 39; `medals.ts` states a colour for only 6.
4. **"14".** Site: "one of 14 students picked nationally" (Principia). Résumé and Candela paper: "1 of 14
   projects among 700+". Two facts, or one told two ways?
5. **Age.** Born 21 Dec 2007: "18" becomes 19 on 2026-12-21 (6 places + `og-image.png`).
6. **Candela wording.** Who paid: OBFEP prize money vs crowdfunding vs research scholarship + crowdfunding.
   The kit: "3D-printed" (`onePager.ts`) vs "a wooden box" (`projects.ts`).

## 4. PDFs that disagree with the site (owner regenerates)

- **Résumé** (`public/files/gabriel-moreno-ribeiro-resume.pdf`): SAT 1510; 39 medals across 49 competitions;
  2× Mathématiques sans Frontières gold; 59-page thesis at 97% accuracy; RCT "130%".
- **One-pager PDF** (`gabriel-moreno-ribeiro-hibeex.pdf`): 39 olympiads and 60 schools; re-export from `/one-pager`.
- **Candela paper**: does not report 30% → 10%, 140 kits or +40% grades; cover dated Nov 2024 but cites a
  search from Aug 2026; thanks Prof. Maria das Graças (UFBA) as mentor while the card names Coronel Iran.
- RCT and chemistry papers, SAT report, Duolingo certificate and school profiles agree with the site.
