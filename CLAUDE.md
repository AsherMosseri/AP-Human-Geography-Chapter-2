# AP Human Geography study site

Static study site served by GitHub Pages from `main` at aphumangeo.thejunkdrawerapp.com.
Work directly on `main`.

```
/                          hub
/quiz/                     reading-quiz study guides   e.g. /quiz/reading-2.1-2.2/
/test/                     chapter-test study guides   e.g. /test/chapter-2/
assets/style.css           one stylesheet for every page
assets/notes.js            click-to-explain panel, chart tooltips, checklist
assets/calc.js             natural increase calculator
assets/js/turbo.min.js     Turbo Drive (copied from the main site)
tools/version-assets.py    stamps ?v=<hash> on every local .css/.js link
```

## Content rules

**Connect only to what has already been read.** Every "Connects to", "Apply it", AP tip and
explanation links back to material the reader has covered: Chapter 1, or earlier in the current
chapter up to the end of the page's assigned reading. Never point ahead (later sections, chapters or
AP units) and never lean on outside theories the book does not cover (Boserup, world-systems theory,
the Columbian Exchange, demographic dividend...). If an AP term is useful but not in the reading,
name it only while explaining it through an example the reader has already seen. When a new page is
added, widen "already read" to include it for pages that come after it, never before.

**Charts use the book's data.** Numbers come from the reading's text and figures. When a figure's
values are not printed, measure them from the figure (the pyramids were measured from bar lengths)
or use the dataset the figure cites and confirm it lands in the same bins. Say which figure each
chart comes from. Conceptual models (the DTM) are drawn fresh but pinned to the book's numbers.

**Never copy the textbook.** The reading and its photos and maps are copyrighted (Wiley, H. J. de
Blij, Elsbeth Robson). Retell every fact in original wording, and describe book figures in figure
cards with their page number instead of reproducing them. Free-licensed images (Wikimedia Commons,
NASA) are fine with a credit.

**Every fact from the reading stays in.** The teacher can quiz on anything, so each section ends
with a checklist covering every quizzable fact. Out-of-date numbers keep the book's figure and add
an "Update" box; book errors get a short note saying which value to use on the quiz.

**Apply it.** Every chart has an "Apply it" box and every key-concept note (`class="term key"`) has
an "Apply it" section that uses an example from the reading to show the concept at work.

## Code rules

- **After editing anything in `assets/`, run `python3 tools/version-assets.py`.** Cloudflare and
  browsers cache CSS/JS for hours; the hash in `?v=` is what makes them fetch the new file.
- **Asset paths are root-absolute (`/assets/...`)** so each `<head>` tag is identical on every page.
  Turbo compares head tags exactly; a relative path would look new and run the script again.
- **Scripts live in `<head>` with `defer`** and set up the page on `turbo:load` as well as on first
  load. Look elements up fresh each time; never cache them across pages.
- **"Already bound" guards are JS properties (`el._bound`), never `data-` attributes.** Back/Forward
  restores a cloned snapshot that keeps attributes but drops listeners.
- The theme toggle, pre-paint theme script and scroll-restoration script are copied from the main
  site (thejunkdrawer-website). Keep the scroll-restoration script byte-identical to the main site's.
- Dark mode: every new color needs a dark value in both dark blocks of `style.css`
  (`@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` and `:root[data-theme="dark"]`).
- Hover styles go inside `@media (hover: hover)`; give every button `:active` and `:focus-visible` too.
- Charts must stay readable at 390px wide: prefer HTML/CSS bars and positioned elements; SVG text
  needs a larger size under `@media (max-width: 480px)`.

Before pushing, serve the repo root (`python3 -m http.server`) and check the page in a real browser
(Playwright is installed) at desktop and phone widths, light and dark, including a Turbo visit and a
Back-button restore.
