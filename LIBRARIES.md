# Library Catalog

Master reference for **every** library, CDN, and external service used in the IHHS Study Guide Hub. Read this **before** building a new component or recommending one to a guide author. If you're about to install or import something, check first that it's not already here.

Conventions:

- "npm" = installed via `package.json`. Bundled into the app.
- "CDN" = loaded lazily at runtime. Only downloaded when a guide uses the component.
- "iframe" = embedded as an iframe. Zero JS cost; the third party serves everything.
- All Tier 2 and Tier 3 components live in `src/components/` and follow the red/white/black palette.

---

## 1. Build and framework (npm, always loaded)

| Package | Version | Purpose |
|---|---|---|
| `astro` | ^5.1.1 | Meta-framework. Pages, layouts, content collections, View Transitions, MDX. |
| `@astrojs/mdx` | ^4.0.3 | MDX support so guide authors can use `<Component />` inside markdown. |
| `@astrojs/sitemap` | ^3.2.1 | Auto-generates `sitemap-index.xml` at build time. |
| `@astrojs/tailwind` | ^5.1.4 | Tailwind v3 integration for Astro. |
| `@astrojs/check` | ^0.9.4 (dev) | Astro type-checker (run via `astro check`). |
| `tailwindcss` | ^3.4.17 | Utility-first CSS. Custom theme in `tailwind.config.mjs`. |
| `@tailwindcss/typography` | ^0.5.15 (dev) | Adds `.prose` for nicely styled long-form guide bodies. |
| `typescript` | ^5.7.2 (dev) | Static type checking across `.astro`, `.ts`, and `.tsx`. |
| `pagefind` | ^1.3.0 (dev) | Static-site full-text search index. Built post-`astro build`; serves `dist/pagefind/`. |

## 2. Content rendering pipeline (npm, always loaded)

| Package | Version | Purpose |
|---|---|---|
| `katex` | ^0.16.11 | Math typesetting. CSS imported in `src/styles/global.css`. |
| `rehype-katex` | ^7.0.1 | Rehype plugin: turn math AST into KaTeX HTML during MDX compile. |
| `remark-math` | ^6.0.0 | Remark plugin: parse `$inline$` and `$$block$$` math syntax in MDX. |
| `mermaid` | ^11.4.1 | Renders Mermaid diagrams from fenced code blocks in `GuideLayout.astro`. |

Wired up in `astro.config.mjs` (`integrations` and `markdown` keys).

## 3. Maps (npm)

| Package | Version | Purpose |
|---|---|---|
| `leaflet` | ^1.9.4 | Used by `<MapView>`. CSS is imported inside the component, so it's tree-shaken from non-map pages. |

Tile provider: **OpenStreetMap** (free, no key, attribution required by the component).

## 3b. Backend (npm, conditional)

| Package | Version | Purpose |
|---|---|---|
| `@supabase/supabase-js` | latest | Supabase auth + Postgres client. Only used when `PUBLIC_SUPABASE_URL` + `PUBLIC_SUPABASE_ANON_KEY` env vars are set. Powers cross-device account sync, `/request` submissions, and the `/admin/requests` inbox. Falls back to local-only mode when env vars are missing. See `SUPABASE_SETUP.md`. |
| `ihhs-ai-tutor` Worker | n/a | Standalone Cloudflare Worker in `worker/` that proxies to Workers AI (Llama 3.1 8B). The `<AITutor>` component calls `${PUBLIC_AI_TUTOR_URL}/tutor` and streams the reply. Falls back to an "unconfigured" notice when env var is missing. See `worker/README.md`. |

## 4. Internal infrastructure (`src/lib/`)

| Module | Purpose |
|---|---|
| `loadScript.ts` | Dedupe-safe lazy CDN loader. Exports `loadScript`, `loadStyle`, `waitForGlobal`, `importGlobal`. Used by every Tier 3 component. |
| `supabase.ts` | Supabase client singleton. Returns `null` when `PUBLIC_SUPABASE_URL` + `PUBLIC_SUPABASE_ANON_KEY` env vars aren't set. `isCloudMode()` tells you which regime you're in. |
| `auth.ts` | **Hybrid** cloud/local auth. Cloud mode: Supabase Auth (email + password) + a `profiles` table. Local mode: username-only localStorage accounts. `currentUser()` is sync in both modes (via cache). `signup()` and `login()` may return a Promise; always `await` them. |
| `storage.ts` | Per-user namespaced key-value store. Writes to localStorage first (sync), then fire-and-forget upsert to Supabase `user_data` in cloud mode. |
| `progress.ts` | Per-user dashboard data: streaks, quiz history, guides opened. Uses `storage.ts` (so cloud sync is free). |
| `srs.ts` | SM-2 spaced repetition scheduler. `registerCard`, `review`, `loadDeck`, `Rating`. Drives `<Flashcards>` review mode. Uses `storage.ts`. |

These are reused everywhere. Don't duplicate. If you need a new key in storage, namespace through `storage.ts` and it will cloud-sync automatically.

## 5. External fonts (CDN, always loaded)

| Family | Source | Used as |
|---|---|---|
| Fraunces (400, 500, 600, 700) | Google Fonts | Serif headings (`font-serif`) |
| Inter (400, 500, 600, 700) | Google Fonts | Sans body (`font-sans`) |
| JetBrains Mono (400, 500) | Google Fonts | Code/mono (`font-mono`) |

Loaded once in `src/layouts/BaseLayout.astro` with `preconnect` hints for performance.

---

## 6. Tier 1 components (built-in, always loaded)

In every guide author's toolbox by default.

| Component | Subject | Brief |
|---|---|---|
| `<Callout type="..." title="...">` | Any | Highlighted insight/warning/tip/theorem/definition boxes. 6 styles. |
| `<KeyTerm term="...">def</KeyTerm>` | Any | Inline tooltip definitions. Hover to reveal. |
| `<Collapsible question="...">` | Any | Click-to-reveal practice answers. |
| `<Quiz questions={[...]} />` | Any | Multiple-choice with instant feedback. Persists scores per user when signed in. |
| `<Flashcards cards={[...]} />` | Any | Flippable deck with shuffle. Switches to SM-2 SRS mode when signed in. |

Plus inline KaTeX math (`$x^2$`), block KaTeX (`$$...$$`), and Mermaid diagrams (` ```mermaid ` fenced blocks). All zero-import.

---

## 7. Tier 2 components (existing, lazy-loaded)

Pre-existing subject-specific components. CDN script loads only when the component appears in a guide.

| Component | Library / source | Subject | Brief |
|---|---|---|---|
| `<MapView markers={[...]} />` | `leaflet` (npm) + OpenStreetMap tiles | Geography, history | Custom markers and popups. |
| `<Timeline events={[...]} />` | TimelineJS (`cdn.knightlab.com/libs/timeline3/latest`) | History | Scrollable horizontal timeline. |
| `<Molecule pdb=".." cid=".." />` | 3Dmol.js (`3Dmol.org/build/3Dmol-min.js`) | Chem, bio | Loads from RCSB PDB or PubChem CID. |
| `<Desmos expressions={[...]} />` | Desmos API v1.10 (`www.desmos.com/api/v1.10/calculator.js`) | Math | Graphing calculator. Free tier API key embedded. |
| `<GeoGebra appName=".." />` | GeoGebra deployggb (`www.geogebra.org/apps/deployggb.js`) | Math | Geometry, algebra, calculus playground. |
| `<Graph setup={...} />` | JSXGraph 1.10.1 (`cdn.jsdelivr.net/npm/jsxgraph`) | Math, physics | DIY interactive constructions. |
| `<Whiteboard prompt=".." />` | Native canvas | Any | In-page sketching, persists to `localStorage`. |
| `<CodeEditor language=".." />` | Monaco 0.45.0 (`cdn.jsdelivr.net/npm/monaco-editor`) | CS | Full VS Code editor. |
| `<EquationEditor initial=".." />` | MathLive 0.101.0 (`unpkg.com/mathlive`) | Math | Visual equation editor with LaTeX export. |

---

## 8. Tier 3 components (catalog, lazy-loaded)

### Science

| Component | Library | CDN | Brief |
|---|---|---|---|
| `<PhETSim sim="..." />` | PhET sims | iframe `phet.colorado.edu/sims/html/...` | Hundreds of pre-built simulations. |
| `<PhysicsSandbox setup="..." />` | Matter.js 0.20.0 | `cdn.jsdelivr.net/npm/matter-js` | 2D rigid body physics. |
| `<ChemStructure smiles="..." />` | SmilesDrawer 2.1.7 | `cdn.jsdelivr.net/npm/smiles-drawer` | Render molecules from SMILES strings. |
| `<DNASequence sequence="..." />` | none (custom SVG/HTML) | n/a | DNA/RNA/protein with feature highlights and codon-to-amino-acid hover tooltips. |
| `<AITutor guideTitle="..." />` | Cloudflare Workers AI (server-side) | n/a | Login-gated chat tutor. Streams SSE from `${PUBLIC_AI_TUTOR_URL}/tutor`. Shows a setup notice when env var is missing. |
| `<Phylogeny newick="..." />` | phylotree.js 1.5.0 + d3 v7 + underscore 1.13.6 | `cdn.jsdelivr.net/npm/phylotree`, `d3js.org/d3.v7.min.js`, `cdn.jsdelivr.net/npm/underscore` | Evolutionary trees. |
| `<CircuitSim starter="rc" />` | Falstad CircuitJS | iframe `www.falstad.com/circuit/circuitjs.html` | Drag-drop circuit simulator. |

### Math and stats

| Component | Library | CDN | Brief |
|---|---|---|---|
| `<Plotter fns={[...]} />` | function-plot 1.25.1 + d3 v5 | `unpkg.com/function-plot`, `d3js.org/d3.v5.min.js` | Lightweight function graphs. |
| `<DataChart type="..." />` | Chart.js 4.4.6 | `cdn.jsdelivr.net/npm/chart.js` | Bar/line/scatter/pie/doughnut/radar. |
| `<VegaChart spec={...} />` | Vega 5.30.0 + Vega-Lite 5.21.0 + vega-embed 6.26.0 | `cdn.jsdelivr.net/npm/vega`, `vega-lite`, `vega-embed` | Declarative grammar of graphics. |
| `<P5Sketch code="..." />` | p5.js 1.11.2 | `cdn.jsdelivr.net/npm/p5` | Creative coding sandbox. |
| `<Statistics data={[...]} />` | Chart.js 4.4.6 (custom stats) | `cdn.jsdelivr.net/npm/chart.js` | Histograms with summary stats. |
| `<NumberLine min=".." />` | none (custom SVG) | n/a | Inequalities, intervals, integers, fractions. |

### Computer science

| Component | Library | CDN | Brief |
|---|---|---|---|
| `<PyRunner initial="..." />` | Pyodide v0.26.4 (~10MB on first run) | `cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js` | Real Python in the browser. |
| `<SandpackPlayground sandboxId="..." />` | CodeSandbox embed | iframe `codesandbox.io/embed/...` | Multi-file React/JS playgrounds. |
| `<AlgoViz algorithm="..." />` | none (custom + Tailwind) | n/a | Bubble/insertion/selection/merge/quick sort animations. |
| `<RegexTester pattern="..." />` | native `RegExp` | n/a | Live regex match highlighter. |
| `<SQLPlayground schema="..." />` | sql.js 1.11.0 (SQLite WASM) | `cdn.jsdelivr.net/npm/sql.js` | Run real SQL against an in-browser database. |

### History and geography

| Component | Library | CDN | Brief |
|---|---|---|---|
| `<StoryMap url="..." />` | Knight Lab StoryMapJS | iframe `uploads.knightlab.com/storymapjs/...` | Geographic scrollytelling. |
| `<Globe3D markers={[...]} />` | globe.gl 2.32.4 + three-globe earth texture | `cdn.jsdelivr.net/npm/globe.gl`, `unpkg.com/three-globe/example/img/earth-night.jpg` | 3D Earth with markers and arcs. |
| `<DocAnnotate text="..." />` | none (custom) | n/a | Pre-baked highlight spans on a source text. |
| `<CompareSlider before="..." />` | img-comparison-slider 8.0.6 (web component) | `unpkg.com/img-comparison-slider` | Before/after image slider. |

### Languages and literature

| Component | Library | CDN | Brief |
|---|---|---|---|
| `<HanziWriter character="字" />` | hanzi-writer 3.7.2 | `cdn.jsdelivr.net/npm/hanzi-writer` | Chinese stroke-order tutor. |
| `<Pronounce src="..." />` | wavesurfer.js 7.8.6 | `unpkg.com/wavesurfer.js` | Audio waveform with click-to-play. |
| `<IPAKeyboard />` | none (custom) | n/a | Type IPA symbols by category. |
| `<TextAnnotate text="..." />` | none (custom + localStorage) | n/a | Reader-side annotations, saved per browser. |
| `<DiffView before="..." after="..." />` | diff2html 3.4.48 | `cdn.jsdelivr.net/npm/diff2html` | Side-by-side or line-by-line diff. |

### Music and arts

| Component | Library | CDN | Brief |
|---|---|---|---|
| `<Score abc="..." />` | abcjs 6.4.4 | `cdn.jsdelivr.net/npm/abcjs` | Render and play sheet music from ABC notation. |
| `<Synth />` | Tone.js 15.0.4 | `cdn.jsdelivr.net/npm/tone` | Web Audio synthesis. |
| `<MidiPlayer src="..." />` | html-midi-player 1.5.0 + Tone 14.7.58 + @magenta/music 1.23.1 + focus-visible 5 | `cdn.jsdelivr.net/combine/...` | Interactive MIDI playback. |
| `<ColorWheel base="#b91c1c" />` | chroma.js 3.1.2 | `cdn.jsdelivr.net/npm/chroma-js` | Color theory explorer. |

### Universal study aids

| Component | Library | CDN | Brief |
|---|---|---|---|
| `<MindMap markdown="..." />` | markmap-view 0.18.10 + markmap-lib 0.18.11 + d3 v7 | `cdn.jsdelivr.net/npm/markmap-*` | Auto-generate mind map from indented markdown. |
| `<DragSort items={[...]} />` | SortableJS 1.15.6 | `cdn.jsdelivr.net/npm/sortablejs` | Drag-to-order exercises. |
| `<MatchPairs pairs={[...]} />` | none (custom) | n/a | Click-to-match terms and definitions. |
| `<Crossword words={[...]} />` | crossword-layout-generator 1.0.7 | `unpkg.com/crossword-layout-generator` | Vocab crossword from word/clue pairs. |
| `<Hotspots image="..." spots={[...]} />` | none (custom) | n/a | Click parts of an image. Reveal or quiz mode. |
| `<Tldraw />` | tldraw | iframe `tldraw.com` | Collaborative whiteboard. |
| `<Pomodoro />` | none (custom) | n/a | Built-in study timer with break tracking. |

---

## 8b. Tier 4 components (subject gaps, lazy-loaded)

Added on top of Tier 3 to close gaps in chemistry, biology, astronomy, CS, data viz, multimedia, music, presentations, and engagement.

### Chemistry

| Component | Library | CDN / source | Brief |
|---|---|---|---|
| `<PeriodicTable element="..." />` | Ptable | iframe `ptable.com` | Full interactive periodic table, optional deep-link to a specific element. |
| `<ChemDoodle3D mol="..." editable />` | ChemDoodle Web Components 10.4 | `hub.chemdoodle.com/cwc/10.4.1` | 2D reaction/mechanism sketcher (complements the existing 3D `<Molecule>`). |

### Biology / health

| Component | Library | CDN / source | Brief |
|---|---|---|---|
| `<AnatomyViewer atlas="brain" />` | Open Anatomy Project | iframe `openanatomy.org` | Free WebGL atlases: brain, knee, ear, head-and-neck, abdomen, larynx. |
| `<BrainBrowser atlas="mni" />` | McGill Brain Browser | iframe `brainbrowser.cbrain.mcgill.ca` | MNI/CBrain surface viewer for neuro guides. |
| `<CellSim setup="..." />` | Artistoo 2.2 | `cdn.jsdelivr.net/npm/artistoo` | Cellular Potts model simulations (tissue, chemotaxis, cell sorting). |
| `<NeuronSim />` | PhET (thin wrapper) | iframe to PhET | Convenience wrapper over `<PhETSim sim="neuron" />`. |

### Astronomy

| Component | Library | CDN / source | Brief |
|---|---|---|---|
| `<StarMap magLimit={5} />` | d3-celestial | `ofrohn.github.io/celestial` + d3 v3 | Interactive celestial map with constellations, Milky Way, DSOs. |
| `<VirtualSky latitude={40} />` | VirtualSky | `slowe.github.io/VirtualSky` + jQuery | Planetarium-style sky for a given lat/long/time. |
| `<Aladin target="M31" />` | Aladin Lite 3 | `aladin.cds.unistra.fr/AladinLite/api/v3/latest` | Real astronomy data surveys from CDS, deep-sky target lookup. |

### Computer science

| Component | Library | CDN / source | Brief |
|---|---|---|---|
| `<LogicGate />` | CircuitVerse | iframe `circuitverse.org` | Digital logic (AND/OR/NAND/XOR, flip-flops, memory). |
| `<ChessBoard fen="..." />` | Chessground 9.2 | `cdn.jsdelivr.net/npm/chessground` | Lichess's chess board UI for game theory and strategy. |
| `<Sudoku difficulty="medium" />` | sudoku 0.1.3 | `cdn.jsdelivr.net/npm/sudoku` | Sudoku generator/solver with interactive grid. |
| `<Spreadsheet data={[...]} />` | Jspreadsheet CE 5.0 | `cdn.jsdelivr.net/npm/jspreadsheet-ce` | Excel-like sheet with formulas, pivot, sort (MIT license). |

### Data viz (extended)

| Component | Library | CDN / source | Brief |
|---|---|---|---|
| `<NetworkGraph nodes={[...]} edges={[...]} />` | Cytoscape.js 3.30 | `cdn.jsdelivr.net/npm/cytoscape` | Force-directed / tree / circle concept graphs. Different from `<MindMap>` (hierarchical). |
| `<WordCloud text="..." />` | d3-cloud 1.2 | `cdn.jsdelivr.net/npm/d3-cloud` + d3 v5 | Weighted word cloud with automatic stopword filtering. |
| `<GanttChart tasks={[...]} />` | Frappe Gantt 0.9 | `cdn.jsdelivr.net/npm/frappe-gantt` | Project / historical-event timelines with dependencies. |
| `<TimeSeries data={[...]} series={[...]} />` | uPlot 1.6 | `cdn.jsdelivr.net/npm/uplot` | ~50 KB canvas chart, plots 166k points in 25ms. |

### Multimedia

| Component | Library | CDN / source | Brief |
|---|---|---|---|
| `<VideoAnnotate src="..." annotations={[...]} />` | Native `<video>` + custom UI | none | Lecture video with click-to-jump timestamped markers and notes. |
| `<PDFViewer src="..." page={3} />` | PDF.js viewer | iframe `mozilla.github.io/pdf.js/web/viewer.html` | Embed textbook PDFs with zoom, pagination, selection. |
| `<ThreeScene gltf="..." />` | three.js 0.169 | `cdn.jsdelivr.net/npm/three` | Generic 3D scene viewer; supports glTF model loading or custom setup code. |

### Music

| Component | Library | CDN / source | Brief |
|---|---|---|---|
| `<MusicTheory mode="scale" />` | Tonal.js 6.2 | `cdn.jsdelivr.net/npm/@tonaljs/tonal` | Live scale/chord explorer with keyboard highlight. |
| `<EarTraining exercise="intervals" />` | ToneDear | iframe `tonedear.com/ear-training/...` | Intervals, chords, scales, progressions. |

### Presentations

| Component | Library | CDN / source | Brief |
|---|---|---|---|
| `<Slides slides={[...]} />` | reveal.js 5.2 | `cdn.jsdelivr.net/npm/reveal.js` | Inline slide decks from markdown, or embed an external deck by URL. |

### Engagement

| Component | Library | CDN / source | Brief |
|---|---|---|---|
| `<Poll src="..." provider="particify" />` | Particify / ClassQuiz / StrawPoll (iframe) | external | Live polls/quizzes via a self-hosted or third-party instance. |

---

## 8c. Tier 5 components (visual / data-viz, lazy-loaded)

Built specifically to make learning more visual: animations, hand-drawn aesthetics, deep-zoom, 3D models, hierarchical and flow charts, geographic data, scientific plots, interactive 2D canvases, and small UX wins.

### Animations and motion

| Component | Library | CDN | Brief |
|---|---|---|---|
| `<Lottie src="..." />` | lottie-web 5.12 | `cdn.jsdelivr.net/npm/lottie-web` | Embed After Effects animations from .json. |
| `<Rive src="..." stateMachine="..." />` | @rive-app/canvas 2.21 | `cdn.jsdelivr.net/npm/@rive-app/canvas/+esm` | Interactive state-machine animations. |
| `<RevealOnScroll>` | Native + IntersectionObserver | none | Stagger fade/slide each child in as it enters the viewport. |
| `<StepThrough steps={[...]} />` | Custom | none | Click "next" to advance through a multi-step diagram. |

### Sketch / hand-drawn aesthetic

| Component | Library | CDN | Brief |
|---|---|---|---|
| `<Excalidraw scene="..." />` | Excalidraw (iframe) | iframe `excalidraw.com` | Whiteboard with a hand-drawn aesthetic. |
| `<RoughNotation type="underline">` | rough-notation 0.5 | `cdn.jsdelivr.net/npm/rough-notation/+esm` | Hand-drawn underlines, boxes, circles, highlights on inline content. |

### Deep-zoom + image gallery

| Component | Library | CDN | Brief |
|---|---|---|---|
| `<DeepZoom src="..." />` | OpenSeadragon 5.0 | `cdn.jsdelivr.net/npm/openseadragon` | Zoom infinitely into a high-res image. |
| `<DeepZoomAnnotated markers={[...]}>` | OpenSeadragon | same | Add clickable annotation markers on top of the deep-zoom. |
| `<Lightbox images={[...]}>` | PhotoSwipe 5.4 | `cdn.jsdelivr.net/npm/photoswipe/+esm` | Click any thumbnail to expand fullscreen with pan/zoom. |

### 3D models and scenes

| Component | Library | CDN | Brief |
|---|---|---|---|
| `<Sketchfab uid="..." />` | Sketchfab embed | iframe | Embed any 3D model from Sketchfab's library of millions. |
| `<ModelViewer src="..." />` | `<model-viewer>` 4.0 (Google) | `cdn.jsdelivr.net/npm/@google/model-viewer` | glTF embed with rotate/zoom + AR mode on phones. |
| `<Babylon setup="..." />` | Babylon.js 7.39 | `cdn.jsdelivr.net/npm/babylonjs` + loaders | 3D scene engine with built-in physics, WebGL renderer. |

### Hierarchy and flow

| Component | Library | CDN | Brief |
|---|---|---|---|
| `<Sankey nodes={[...]} links={[...]}>` | d3 + d3-sankey | `cdn.jsdelivr.net/npm/d3-sankey/+esm` | Flow magnitudes between nodes (energy, blood, money, voters). |
| `<TreeMap data={...} />` | d3-hierarchy | `cdn.jsdelivr.net/npm/d3/+esm` | Nested rectangles sized by value. |
| `<SunburstChart data={...} />` | d3-hierarchy partition | same | Radial hierarchical viz. |
| `<Chord labels={[...]} matrix={...} />` | d3-chord | same | Relationships between groups (trade, friendships, gene interactions). |
| `<Dendrogram data={...} layout="..." />` | d3-hierarchy tree/cluster | same | Tree diagrams (evolution, taxonomy, decision trees). |

### Geographic data

| Component | Library | CDN | Brief |
|---|---|---|---|
| `<Choropleth data={...} />` | d3-geo + topojson-client | `cdn.jsdelivr.net/npm/topojson-client/+esm` | Color regions by data value (states, countries, counties). |
| `<Cartogram data={...} />` | d3 force + topojson | same | Dorling cartogram (regions as circles sized by data). |
| `<HeatMap rows={...} cols={...} values={...} />` | d3 | d3 ESM | 2D color grid for correlation matrices, schedules, attention maps. |
| `<CalHeatmap data={...} />` | Custom SVG | none | GitHub-style 90-day calendar heatmap. |

### Scientific charts

| Component | Library | CDN | Brief |
|---|---|---|---|
| `<Plotly data={[...]} layout={...} />` | Plotly.js 2.35 | `cdn.jsdelivr.net/npm/plotly.js-dist-min` | 3D scatter, contour, surface, statistical, parallel coordinates. |
| `<ECharts option={...} />` | Apache ECharts 5.5 | `cdn.jsdelivr.net/npm/echarts` | Funnels, gauges, polar charts, sankey, treemap, parallel coords. |
| `<MathBox setup="..." />` | MathBox bundle | `cdn.jsdelivr.net/gh/unconed/mathbox-bundle` | The library 3Blue1Brown's web demos use. Vector calculus, parametric surfaces. |

### Interactive 2D canvases

| Component | Library | CDN | Brief |
|---|---|---|---|
| `<Konva setup="..." />` | Konva.js 9.3 | `cdn.jsdelivr.net/npm/konva` | High-level 2D canvas: drag shapes, animate, listen to events. |
| `<Fabric setup="..." />` | Fabric.js 5.3 | `cdn.jsdelivr.net/npm/fabric` | Same idea as Konva, used inside Canva. |
| `<RoughViz type="bar" labels={[...]} values={[...]} />` | rough-viz 2.0 | `unpkg.com/rough-viz` | Hand-drawn-aesthetic charts. |

### Typed-answer drilling

| Component | Library | CDN | Brief |
|---|---|---|---|
| `<TypingQuiz pairs={[{en, es, alt?}, ...]} accents={[...]} />` | Custom | none | Prompt to typed-answer quiz. Per-question grading with character-level diff (matches green, wrong red). Quick-insert buttons for accented characters (default Spanish set: á é í ó ú ñ ü ¿ ¡). Accepts answers with or without articles, lenient on missing diacritics, repeatable infinitely with a "drill the misses only" mode. Used by `spanish-unit-7-vocab` for production-direction practice (English prompt → Spanish typed answer). Generic enough for any language. |

### UX widgets

| Component | Library | CDN | Brief |
|---|---|---|---|
| `<Confetti preset="cannons" />` | canvas-confetti 1.9 | `cdn.jsdelivr.net/npm/canvas-confetti` | Burst confetti on click or scroll-into-view. Auto-fires from Quiz on 100% score and Flashcards when full deck rated good/easy. |
| `<Tooltip content="..." />` | Tippy.js 6.6 | `cdn.jsdelivr.net/npm/tippy.js` | Rich animated hover tooltips on inline content. |
| `<ColorPicker />` | Pickr 1.9 | `cdn.jsdelivr.net/npm/@simonwep/pickr` | Color picker with HEX/RGB/HSL output. |
| `<ProgressRing value={75} />` | Custom SVG | none | Animated SVG ring for scores, progress, stats. |

### Helper module

`src/lib/confetti.ts` exports `fireConfetti(preset)` which any component can import. Three presets: `'burst'`, `'cannons'`, `'fireworks'`. Quiz uses `cannons`, Flashcards uses `fireworks`.

---

## 8g. Tier 9 components (proposed additions, not yet installed)

Added 2026-04 from a cross-site research pass. Two parts:

- **Part 1 — Universal Enhancements** apply to every guide regardless of subject.
- **Part 2 — Advanced Subject-Specific Additions** push specific subjects into research-grade territory.

All entries cross-checked against the catalog above to avoid duplicates. AI, AR, and VR libraries intentionally excluded per project direction.

### Part 1A — Universal: highest-leverage wins

| Library | npm / CDN | License | Brief |
|---|---|---|---|
| **tocbot** | `tocbot` | MIT | Auto-generates a floating table of contents from any guide's `<h2>`/`<h3>` headings with live scrollspy highlighting. Every long guide becomes navigable. |
| **reading-time** | `reading-time` | MIT | Accurate "6 min read" badge on every guide. Tiny (~2KB), works on any markdown/MDX input. |
| **medium-zoom** | `medium-zoom` | MIT | Click any `<img>` for a smooth Medium-style fullscreen zoom with escape/click-outside to dismiss. |
| **cmdk** | `cmdk` | MIT | Cmd/Ctrl+K command palette (Vercel / Linear / Raycast style). Jump to any guide, quiz, flashcard deck, or setting from anywhere. |
| **react-wrap-balancer** | `react-wrap-balancer` | MIT | Auto-balances multi-line headlines so they never leave a one-word widow on the last line. |
| **Sonner** | `sonner` | MIT | Modern toast notifications. Use for quiz-saved, card-rated, guide-bookmarked, login-successful. |
| **react-hotkeys-hook** | `react-hotkeys-hook` | MIT | Keyboard shortcuts: J/K to navigate quiz questions, Space to flip flashcards, / to focus search, ? for shortcut help. |
| **jsPDF + html2canvas** | `jspdf`, `html2canvas` | MIT | Client-side "Export this guide as PDF". Works on anything in the DOM. No server needed. |
| **html-to-image** | `html-to-image` | MIT | "Save this quiz result as PNG" alternative to jsPDF/html2canvas. |

### Part 1B — Universal: visual polish

| Library | npm / CDN | License | Brief |
|---|---|---|---|
| **Atropos** | `atropos` | MIT | 3D parallax hover effect for cards. Guide index, flashcards, callout cards gain Apple-product-page depth on tilt. |
| **vanilla-tilt.js** | `vanilla-tilt` | MIT | Lighter alternative — subtle 3D tilt on any element. |
| **Splitting.js** | `splitting` | MIT | Splits text into per-character/word/line spans so GSAP, motion, or Typed.js can animate each piece. |
| **SplitType** | `split-type` | MIT | Lighter alternative to Splitting.js from the Webflow team. |
| **blurhash** | `blurhash`, `react-blurhash` | MIT | Tiny (~20-char) hash → blurred placeholder while the full image loads. Images on slow Chromebooks stop popping in. |
| **Embla Carousel** | `embla-carousel`, `embla-carousel-react` | MIT | Touch/drag carousel with perfect physics. Image galleries, step-by-step sequences. |
| **Swiper** | `swiper` | MIT | Carousel alternative with more built-in effects (cards, cube, coverflow, parallax). |
| **fitty** | `fitty` | MIT | Auto-scales text to fill its container. Hero titles, callout quotes, responsive headlines. |
| **party.js** | `party-js` | MIT | Particle burst effects beyond confetti — sparkles, coins, stars, hearts, custom shapes. |
| **mo.js (mojs)** | `@mojs/core`, `@mojs/player`, `@mojs/timeline` | MIT | Motion-graphics library for burst shapes, ripples, swirls. Production-grade microinteractions. |
| **anime.js** | `animejs` | MIT | 6KB timeline animation library. Lighter than GSAP for simple cases. |
| **VFX-JS** | `@vfx-js/core` | MIT | WebGL filter effects on `<img>`, `<video>`, even `<h1>` text. Liquid displacement, hero effects. |
| **fluid-canvas** | `fluid-canvas` | MIT | Drop-in React component using the Pavel Dobryakov fluid sim as a page background. |

### Part 1C — Universal: interaction and feedback

| Library | npm / CDN | License | Brief |
|---|---|---|---|
| **howler.js** | `howler` | MIT | Cross-browser audio with preloading, sprite support, Web Audio fallback. Correct/incorrect sounds, page-turn whoosh, flip click. |
| **use-sound** | `use-sound` | MIT | React hook wrapper around Howler. One-liner sound effects. |
| **@use-gesture/react** | `@use-gesture/react` | MIT | Drag, pinch, scroll, wheel, hover, move gestures with one unified React hook API. |
| **react-spring** | `@react-spring/web` | MIT | Spring-physics animation. Bouncy, damped, physically-natural motion. |
| **interact.js** | `interactjs` | MIT | Multi-touch drag, resize, rotate with inertia, snapping, restrictions. |
| **Moveable** | `react-moveable`, `moveable` | MIT | Drag, resize, warp, rotate, scale, origin, pinch on any element with visual handles. |
| **Shepherd.js** | `shepherd.js` | MIT | Guided tours for first-time onboarding. |
| **driver.js** | `driver.js` | MIT | Lighter alternative to Shepherd — pure JS, no framework dependency. |

### Part 1D — Universal: accessibility and component foundations

| Library | npm / CDN | License | Brief |
|---|---|---|---|
| **Radix UI primitives** | `@radix-ui/react-*` | MIT | Unstyled, accessible headless components (Dialog, Dropdown, Popover, Tabs, Accordion, Toast, Tooltip, Toggle). Industry standard. |
| **Ariakit** | `@ariakit/react` | MIT | Alternative to Radix — smaller bundle, covers Combobox, Menubar. |
| **Headless UI** | `@headlessui/react` | MIT | Tailwind-native alternative to Radix. Smaller surface area. |
| **vaul** | `vaul` | MIT | Native-feeling drawer (bottom sheet on mobile, side drawer on desktop). For footnotes, references, settings, help panels. |
| **focus-trap** | `focus-trap`, `focus-trap-react` | MIT | Lock keyboard focus inside modals and drawers. Accessibility requirement. |
| **Downshift** | `downshift` | MIT | Accessible combobox/autocomplete primitive. Search suggestions, term lookup, tag filters. |
| **Floating UI** | `@floating-ui/dom`, `@floating-ui/react` | MIT | The positioning engine under Tippy. Custom popovers, range-sliders-with-bubbles, smart anchored positioning. |

### Part 1E — Universal: navigation and reading experience

| Library | npm / CDN | License | Brief |
|---|---|---|---|
| **nprogress** | `nprogress` | MIT | YouTube-style thin progress bar at the top during Astro view transitions. |
| **react-top-loading-bar** | `react-top-loading-bar` | MIT | React-native alternative to nprogress with customizable color/height. |
| **Quicklink** | `quicklink` | Apache-2.0 | From Google Chrome Labs. Prefetches in-viewport links during idle time. |

### Part 1F — Universal: export, share, capture

| Library | npm / CDN | License | Brief |
|---|---|---|---|
| **qr-code-styling** | `qr-code-styling` | MIT | Fancy stylized QR codes (logo inside, rounded dots, gradient colors). "Scan to continue on your phone" button. |
| **qrcode** | `qrcode` | MIT | Minimal, no-frills QR alternative. |
| **file-saver** | `file-saver` | MIT | Trigger file downloads from blobs. Pair with jsPDF / html-to-image for export buttons. |
| **clipboard-copy** | `clipboard-copy` | MIT | One-liner "copy" buttons. |
| **copy-to-clipboard** | `copy-to-clipboard` | MIT | Alternative one-liner copy library. |
| **satori** | `satori` | MPL-2.0 | JSX → SVG renderer from Vercel. Generate open-graph social share images for every guide at build time. |

### Part 1G — Universal: content formatting

| Library | npm / CDN | License | Brief |
|---|---|---|---|
| **linkifyjs** | `linkifyjs`, `linkify-react` | MIT | Auto-detect URLs, emails, @mentions, #hashtags in any text and turn them into real links. |
| **remark-gfm** | `remark-gfm` | MIT | GitHub Flavored Markdown: task lists, autolinks, strikethrough, tables, footnotes. |
| **rehype-pretty-code** | `rehype-pretty-code` | MIT | VS Code–quality syntax highlighting in MDX code blocks using Shiki. Line numbers, line highlights, diffs. |
| **shiki** | `shiki` | MIT | TextMate-grammar syntax highlighter. Engine behind rehype-pretty-code. |
| **date-fns** | `date-fns` | MIT | Tree-shakeable date formatting. Timelines, "last updated," event dates, streaks. |
| **dayjs** | `dayjs` | MIT | 2KB alternative with moment-compatible API. |

### Part 1H — Universal: extra animation options

| Library | npm / CDN | License | Brief |
|---|---|---|---|
| **@motionone/dom** | `@motionone/dom` | MIT | Motion One — vanilla JS core behind motion's React integration. Tiny (3.8KB), Web Animations API. |
| **Lax.js** | `lax.js` | MIT | Scroll-driven CSS transformations with a different API from GSAP ScrollTrigger. |
| **@formkit/auto-animate** | `@formkit/auto-animate` | MIT | 2.5KB hook that animates any list on add/remove/reorder with zero config. |

### Part 1I — Universal: pen input and sketch

| Library | npm / CDN | License | Brief |
|---|---|---|---|
| **perfect-freehand** | `perfect-freehand` | MIT | 3KB pressure-sensitive freehand stroke algorithm (used by tldraw). Calligraphy, handwriting, sketching. |
| **signature_pad** | `signature_pad` | MIT | Simpler variable-width bezier pen tool. Lightweight alternative to perfect-freehand. |
| **rough.js** | `roughjs` | MIT | Hand-drawn-look SVG/Canvas primitives. Underlying library for arbitrary sketchy diagrams. |

### Part 2A — Advanced: graphics and 3D (next-generation rendering)

| Library | npm / CDN | License | Brief |
|---|---|---|---|
| **three.js WebGPU renderer + TSL** | `three` (subpaths `three/webgpu`, `three/tsl`) | MIT | New WebGPU backend. TSL (Three Shading Language) lets authors write shaders as JS graph nodes that auto-compile to WGSL/GLSL. |
| **@react-three/postprocessing** | `postprocessing`, `@react-three/postprocessing` | zlib | Bloom, depth of field, SSAO, god rays, film grain, vignette. Biggest aesthetic upgrade to every R3F scene. |
| **Rapier 3D** | `@dimforge/rapier3d-compat`, `@dimforge/rapier3d-simd` | Apache-2.0 | Rust 3D physics compiled to WASM. Rigid bodies, collisions, joints, springs, ragdolls. Fills the 3D gap left by Matter.js. |
| **WebGPU-Ocean** | iframe `matsuoka-601/WebGPU-Ocean` | MIT | Real-time 3D fluid simulation, 100k–300k particles on the GPU. Drag spheres through water. |
| **WebGL Fluid Simulation** | `PavelDoGreat/WebGL-Fluid-Simulation`, `react-webgl-fluid` | MIT | The famous 2D fluid sim. Swipe-interactive, parameter-tweakable. Navier–Stokes intuition. |
| **Luma Web** | `@lumaai/luma-web` | MIT (renderer); Luma TOS for captures | Photoreal Gaussian Splat renderer inside three.js. Walk through real phone-captured places. |
| **Gaussian Splats 3D** | `@mkkellogg/gaussian-splats-3d`, `gsplat` | MIT | Pure-JS three.js / WebGL2 Gaussian Splatting. Loads `.ply`, `.splat`, `.ksplat`. Self-hostable alternative to Luma. |
| **PixiJS v8** | `pixi.js` | MIT | 2D rendering engine that auto-picks WebGPU/WebGL2/Canvas. Tens of thousands of sprites at 60fps. |
| **Phaser 4** | `phaser` | MIT | Full 2D game framework on PixiJS-class rendering. Vocab games, algorithm games, interactive fiction. |
| **three-mesh-bvh** | `three-mesh-bvh` | MIT | BVH acceleration for three.js raycasting. Hundreds of times faster. Required for 1M-triangle interactive picking. |
| **LYGIA** | CDN `https://lygia.xyz/resolve.js` | Prosperity / Patron dual | Massive GLSL/WGSL/HLSL shader library — noise, SDFs, lighting, color. License fine for IHHS (noncommercial OK). |
| **Theatre.js** | `@theatre/core`, `@theatre/studio` | Apache-2.0 (core), AGPL-3.0 (studio) | After Effects in the browser. Visual timeline editor that animates any property on any 3D or DOM element. |
| **Saharan / Oimo.io demos** | iframes from `oimo.io` | MIT | WebGPU physics showcases: water droplets, cloth, fluffy balls, MLS-MPM. |

### Part 2B — Advanced: scientific computing

| Library | npm / CDN | License | Brief |
|---|---|---|---|
| **Mol\*** | `molstar`, `pdbe-molstar`, `rcsb-molstar` | MIT | Modern successor to 3Dmol.js. Used by RCSB PDB and AlphaFold DB. Mesoscale Explorer handles tens of millions of atoms. |
| **Niivue** | `@niivue/niivue` | BSD-2 | WebGL2/WebGPU medical image viewer. NIfTI, DICOM, GIfTI, tractography. 30+ formats. |
| **brainchop** | `neuroneural/brainchop` | MIT | Browser-based neural network for brain MRI segmentation. Pair with Niivue. |
| **brain2print** | `niivue/brain2print` | MIT | Segment and export a 3D-printable brain mesh from an MRI — all in the browser. |
| **igv.js** | `igv` | MIT | Embeddable Integrative Genomics Viewer. Loads BAM/CRAM/BigWig/VCF. |
| **JBrowse 2** | `@jbrowse/react-linear-genome-view2` | Apache-2.0 | Modern genome browser with synteny views and a wider plugin ecosystem than igv.js. |
| **Cornerstone3D** | `@cornerstonejs/core`, `@cornerstonejs/tools` | MIT | DICOM rendering, multi-planar reconstruction, 3D volumes, segmentation. The library behind OHIF. |
| **VTK.js** | `@kitware/vtk.js` | BSD-3 | Scientific visualization: marching cubes, volume rendering, vector fields. WebGL and WebGPU. |
| **Quirk** | iframe `algassert.com/quirk`; source `Strilanc/Quirk` | Apache-2.0 | Drag-and-drop quantum circuit simulator. Build entanglement, run Grover's. |
| **NetLogo Web** | iframe `netlogoweb.org` | BSD-2 | Browser-only agent-based modeling. Wolf-Sheep, Schelling segregation, traffic. |
| **CesiumJS** | `cesium` | Apache-2.0 | Production-grade WGS84 3D globe. Real terrain, 3D city tiles, time-dynamic data. |
| **CindyJS** | CDN `https://cindyjs.org/dist/latest/Cindy.js` | Apache-2.0 | Browser port of Cinderella. CindyLab: electrostatics, springs, orbits. CindyGL: GPU wave interference, electromagnetic fields. |
| **Ray-Optics Simulation** | iframe `phydemo.app/ray-optics`; source `ricktu288/ray-optics` | Apache-2.0 | 2D geometric optics: mirrors, lenses, gratings, custom equation surfaces. |

### Part 2C — Advanced: math

| Library | npm / CDN | License | Brief |
|---|---|---|---|
| **Penrose + Bloom** | CDN `https://penrose.cs.cmu.edu/bloom.min.js` | MIT | CMU research project. Declarative math → publication-grade diagrams. Bloom adds interactivity (drag a point, optimizer re-solves). |
| **Algebrite** | `algebrite` | MIT | Computer algebra in TS: simplify, expand, factor, integrate, differentiate, matrices, tensors. |
| **nerdamer** | `nerdamer` | MIT | Alternative CAS with a cleaner API. Pair with Algebrite for edge-case coverage. |
| **@mathigon/fermat** | `@mathigon/fermat` | MIT | Number theory, combinatorics, complex numbers, matrices, regression, statistics. |
| **@mathigon/euclid** | `@mathigon/euclid` | MIT | Geometry primitives from the Mathigon team. |
| **Manim.js** | `JazonJiao/Manim.js` | MIT | JS port of 3Blue1Brown's Manim. Declarative animation of math concepts. |
| **p5.teach** | Processing Foundation library | MIT | Animated LaTeX (MathJax + anime.js) on top of p5.js. |
| **Blockly** | `blockly` | Apache-2.0 | Google's visual programming library — Scratch-style blocks emit real JS or Python. |
| **JFLAP Web** | iframe `memoalv/jflapweb` | Freeware (educational use OK) | Build finite automata, PDAs, Turing machines in the browser. |
| **flapjs** | `flapjs/FLAPJS-WebApp` | MIT | MIT-licensed JFLAP successor. |
| **Polypad (Mathigon)** | CDN `https://static.mathigon.org/api/polypad-en-v5.x.x.js` | Non-commercial educational only | Virtual manipulatives: algebra tiles, fraction bars, balance scales, polyhedra, geoboards. |
| **WebGL Mandelbrot/Julia explorers** | `michurin/fast-online-mandelbrot-set-explorer` | MIT | Real-time fragment-shader fractal zooms with Julia-from-Mandelbrot mode. |

### Part 2D — Advanced: literature, language, annotation

| Library | npm / CDN | License | Brief |
|---|---|---|---|
| **Annotorious v3** | `@annotorious/annotorious` | BSD-3 | Modern W3C Web Annotation library. Draw polygons on images. Integrates with OpenSeadragon. |
| **@recogito/text-annotator-js** | `@recogito/text-annotator-js` | BSD-3 | Hover-to-annotate inline text. Standards-compliant annotation data. |
| **compromise** | `compromise` | MIT | 250KB browser NLP: POS tagging, NER, conjugation, pluralization, dates, contractions, sentiment. `compromise/two` adds Spanish/French/German. |
| **wink-nlp** | `wink-nlp`, `wink-eng-lite-web-model` | MIT | 650KB NLP with stronger POS tagger and pattern support. |
| **wtf_wikipedia** | `wtf_wikipedia` | MIT | Parse any Wikipedia article from the browser — text, infoboxes, categories. |
| **wikipedia** | `wikipedia` | MIT | Cleaner REST wrapper for Wikipedia summaries, "on this day," geo-search. |
| **inkjs** | `inkjs` | MIT | JS port of Inkle's Ink scripting language. Branching-narrative interactive fiction (engine behind *80 Days*). |

### Part 2E — Advanced: code, CS, theory

| Library | npm / CDN | License | Brief |
|---|---|---|---|
| **v86** | `v86` | BSD-2 | Full x86 PC emulator with x86-to-WASM JIT. Boots Linux, Windows 95/98/2000, MS-DOS, FreeDOS, ReactOS, Haiku. |
| **JSLinux** | iframe `bellard.org/jslinux` | Freeware (not OSI) | Fabrice Bellard's 64-bit x86 and RISC-V emulator. Runs Fedora and Windows NT 4. |

### Part 2F — Advanced: music

| Library | npm / CDN | License | Brief |
|---|---|---|---|
| **Strudel** | `@strudel.cycles/core`, `@strudel.cycles/web` | MIT | Browser TidalCycles. Live-coded pattern music. Music theory as code. |
| **Hydra-synth** | `hydra-synth` | AGPL-3.0 | Live-codable WebGL video synth with mic, webcam, MIDI inputs. AGPL flagged. |
| **WEBMIDI.js** | `webmidi` | Apache-2.0 | Friendly wrapper around the Web MIDI API. Plug in a physical keyboard, have AlphaTab's cursor follow. |

### Tier 9 — top picks

If you only add 10 libraries from this tier, prioritize these (cross-site impact):

1. **tocbot** — every long guide becomes navigable
2. **medium-zoom** — every image becomes interactive
3. **Sonner** — every async action gets delightful feedback
4. **cmdk** — global jump-anywhere shortcut
5. **@react-three/postprocessing** — instant visual upgrade across every 3D scene
6. **Mol\*** — transforms bio and chem guides
7. **CesiumJS** — transforms history and geography guides
8. **Penrose + Bloom** — nothing like it exists on the web
9. **Rapier 3D** — unlocks real 3D physics
10. **jsPDF + html-to-image** — "save this as PDF" on every page

### Tier 9 — licensing flags summary

| Library | Flag |
|---|---|
| Theatre.js (`@theatre/studio`) | AGPL-3.0 |
| Hydra-synth | AGPL-3.0 |
| satori | MPL-2.0 (file-level copyleft only) |
| LYGIA | Prosperity / Patron (noncommercial OK) |
| Polypad | Non-commercial educational only |
| JFLAP Web | Freeware, not OSI (iframe only) |
| JSLinux | Freeware, not OSI (iframe only) |
| Luma captures | Luma TOS (renderer itself MIT) |
| Cesium ion streaming | Free tier 5GB / 100GB monthly (CesiumJS itself Apache-2.0) |

All other Tier 9 libraries: MIT, Apache-2.0, BSD-2, BSD-3, or zlib. Fully permissive.

### Tier 9 — deliberately excluded

Considered but not recommended because the existing catalog already covers them: AOS / ScrollReveal (GSAP + scrollama), Barba.js (Astro View Transitions + Lenis), Fuse.js / MiniSearch / FlexSearch (Pagefind), Yet-another-react-lightbox / Fancybox / GLightbox (PhotoSwipe), react-hot-toast (Sonner is the modern choice), Locomotive Scroll (Lenis), Plyr / Video.js (react-player + Mux), Tilt.js (vanilla-tilt is the maintained version), Popper.js (Floating UI is the successor).

---

## 9. External services and data sources

These are accessed by the above components but worth listing separately.

| Service | Used by | Notes |
|---|---|---|
| OpenStreetMap tiles | `<MapView>` | Free; attribution shown automatically. |
| RCSB PDB | `<Molecule pdb="...">` | `pdb:` lookup served by 3Dmol. |
| PubChem | `<Molecule cid="...">` | `cid:` lookup served by 3Dmol. |
| Google Fonts | `BaseLayout` | Fraunces, Inter, JetBrains Mono. |
| Knight Lab StoryMapJS host | `<StoryMap>` | User-published maps. |
| Knight Lab TimelineJS CDN | `<Timeline>` | `cdn.knightlab.com/libs/timeline3/latest` |
| Falstad CircuitJS | `<CircuitSim>` | `www.falstad.com/circuit/circuitjs.html` |
| Desmos calculator API | `<Desmos>` | Free tier API key embedded in component. |
| GeoGebra API | `<GeoGebra>` | Embeds `deployggb.js`. |
| PhET HTML5 sims | `<PhETSim>` | `phet.colorado.edu/sims/html/...` |
| CodeSandbox embed | `<SandpackPlayground>` | `codesandbox.io/embed/...` |
| tldraw web app | `<Tldraw>` | `tldraw.com` |
| Pyodide CDN | `<PyRunner>` | jsdelivr serves the Python WASM runtime + stdlib. |

---

## 8d. Tier 6 components (research-report additions)

Added in 2026-04 after auditing the latest "futuristic toolkit" research report. These libraries close gaps the existing tiers didn't fill: cinematic scroll storytelling, interactive React-based flowcharts and charts, modern SRS, free Mapbox-grade mapping, and universal video.

### Scroll storytelling and animation

| Component | Library | npm | Brief |
|---|---|---|---|
| `<Scrollytelling steps={[...]} graphic="..." onStep="..." />` | scrollama 3.2 | `scrollama` | Newsroom-standard pinned graphic with scroll-triggered text steps. Different from `<RevealOnScroll>` (just stagger fade). |
| `<GSAPScroll setup="..." />` | GSAP 3 + ScrollTrigger | `gsap`, `@gsap/react` | Cinematic pinning, scrubbing, complex sequences. **Now 100% free for commercial use** (Webflow stewardship, 2024). |
| `<SmoothScroll />` (drop in BaseLayout) | Lenis | `lenis` | Site-wide buttery smooth scroll. Preserves keyboard accessibility and Cmd-F. |

### Interactive diagrams

| Component | Library | npm | Brief |
|---|---|---|---|
| `<FlowDiagram nodes={[...]} edges={[...]} />` | React Flow (`@xyflow/react`) v12 | `@xyflow/react`, `@dagrejs/dagre`, `elkjs` | Drag-and-zoom flowcharts with clickable React-component nodes. Different from `<Mermaid>` code blocks (static SVG). |

### Polished React charts

| Component | Library | npm | Brief |
|---|---|---|---|
| `<RechartsBar data={[...]} xKey="..." bars={[...]} />` | Recharts 3 | `recharts` | shadcn-style bar chart, default red palette. |
| `<RechartsLine data={[...]} xKey="..." lines={[...]} />` | Recharts 3 | `recharts` | Smooth line chart, default red palette. |
| `<NivoSankey data={...} />` | `@nivo/sankey` | `@nivo/core`, `@nivo/sankey` | Animated Sankey with gradient links. Different aesthetic from existing `<Sankey>` (d3-sankey). |
| `<NivoCalendar data={[...]} from="..." to="..." />` | `@nivo/calendar` | same | Polished multi-year calendar heatmap. Different from `<CalHeatmap>` (90-day fixed). |
| `<NivoChord keys={[...]} matrix={...} />` | `@nivo/chord` | same | Animated chord diagram. Polished alternative to existing d3-based `<Chord>`. |
| `<NivoSunburst data={...} />` | `@nivo/sunburst` | same | Radial hierarchy. Animated alternative to existing `<SunburstChart>`. |
| `<NivoStream keys={[...]} data={[...]} />` | `@nivo/stream` | same | Stacked stream graph. Show category share-over-time. |
| `<TremorCard label="..." value="..." progress={...} />` | Tremor 3 | `@tremor/react` | Dashboard KPI card with delta badge and progress bar. |
| `<VisxScatter data={[...]} />` | Visx | `@visx/visx` | Bespoke scatter plot. Escape hatch when Recharts/Nivo are too rigid. |
| `<ObservablePlot spec="..." />` | Observable Plot | `@observablehq/plot` | Terse declarative plotting from D3's creators. 3-line statistical plots. |

### Modern spaced repetition

| Module | Library | npm | Brief |
|---|---|---|---|
| `import { fsrsReview } from '../lib/fsrs'` | ts-fsrs | `ts-fsrs` | FSRS algorithm (powers modern Anki). ~81% better retention than SM-2 in benchmarks. Coexists with the SM-2 implementation in `srs.ts`. |

### Modern drag-and-drop

| Component | Library | npm | Brief |
|---|---|---|---|
| `<DragMatch pairs={[{left, right}, ...]} />` | `@dnd-kit/core` | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` | Accessible matching exercise. Modern replacement for react-beautiful-dnd. |

### Maps (free, commercial)

| Component | Library | npm | Brief |
|---|---|---|---|
| `<MapLibreView center={[...]} zoom={...} markers={[...]} />` | MapLibre GL | `maplibre-gl`, `react-map-gl` | Open-source vector map (Mapbox GL fork). Zero billing. |
| `<DeckMap arcs={[...]} points={[...]} />` | deck.gl 9 + react-map-gl | `deck.gl`, `@deck.gl/layers`, `@deck.gl/react`, `@deck.gl/geo-layers`, `@deck.gl/aggregation-layers` | GPU-accelerated map overlays: animated arcs, point clusters, heatmaps. |

### Globes

| Component | Library | npm | Brief |
|---|---|---|---|
| `<CobeGlobe markers={[...]} />` | cobe | `cobe` | 5KB WebGL globe shader. Lightweight pinpoint-only alternative to `<Globe3D>` (full globe.gl). |

### Rich timelines

| Component | Library | npm | Brief |
|---|---|---|---|
| `<ChronoTimeline items={[...]} mode="VERTICAL_ALTERNATING" />` | react-chrono 3 | `react-chrono` | Vertical/horizontal/alternating modes with cards, search, nested support. |
| `<VisTimeline items={[...]} groups={[...]} />` | vis-timeline | `vis-timeline`, `vis-data` | Draggable, zoomable timeline with parallel-lane groups. |
| `<VerticalTimeline items={[...]} />` | react-vertical-timeline-component | `react-vertical-timeline-component` | Scroll-reveal alternating timeline ideal for narrative storytelling. |

### Universal media players

| Component | Library | npm | Brief |
|---|---|---|---|
| `<VideoPlayer url="..." />` | react-player | `react-player` | One API for YouTube, Vimeo, Twitch, SoundCloud, MP4, HLS, DASH. |
| `<MuxPlayer playbackId="..." src="..." />` | Mux Player web component | `@mux/mux-player`, `@mux/mux-player-react` | Adaptive bitrate, low latency, real-time analytics. |

### Rich text editing

| Component | Library | npm | Brief |
|---|---|---|---|
| `<RichTextEditor placeholder="..." storageKey="..." />` | TipTap | `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit` | Bold/italic/headings/lists/quotes/code rich text editor. Saves to localStorage. |

### Image annotation

| Component | Library | npm | Brief |
|---|---|---|---|
| `<ImageAnnotate src="..." />` | marker.js 2 | `markerjs2` | Draw arrows, callouts, freehand notes on top of any image. |

### Memorization

| Component | Library | npm | Brief |
|---|---|---|---|
| `<Memorize text="..." title="..." />` | Custom | none | Progressive recall practice for poems, soliloquies, vocab paragraphs. Four modes: read, cloze (random blanks), first-letter hint, cold recall (line-by-line reveal). Tracks best % per device in localStorage. |

### Subject-specific simulations

| Component | Library | npm | Brief |
|---|---|---|---|
| `<PunnettSquare parent1="Bb" parent2="Bb" dominant="B" traits={{...}} />` | Custom | none | Interactive monohybrid genetic cross widget. Dropdowns let students change parent genotypes; offspring genotype + phenotype ratios update live. Color-codes dominant vs recessive cells. Used in the Biology EOC guide. |
| `<EvolutionSim populationSize={60} selectionPressure={0.35} environmentColor="#7f1d1d" />` | Custom canvas | none | Live natural-selection simulator. Population of 3D-shaded colored organisms wanders an environment; a hunting predator (with eyes) chases the worst-fit prey; culled organisms fade with a death-puff. Twin live graphs (mean trait + population size). Smooth wandering motion with predator-flee behavior. |
| `<FinchSim populationSize={32} />` | Custom canvas | none | Galápagos finch evolution sim. Hand-drawn finches with size-varying beaks forage on a beach for small (any beak) and big (beak ≥ 10 mm) seeds. Click ☀ Trigger drought to remove small seeds and watch mean beak depth shift right within a few years. Live histogram of beak depth, mean-over-time line, and population graph. The textbook example, playable. |
| `<DichotomousKey tree={{ question, yes, no, result, note }} />` | Custom | none | Branching identification tree. Each node is a yes/no question that leads to either another question or a final identification. Breadcrumb shows path taken. Reset to try again. |

### Test-day timing

| Component | Library | npm | Brief |
|---|---|---|---|
| `<TestTimer minutes={60} title="..." />` | Custom (uses lib/confetti) | none | Countdown timer for timed quizzes/mock tests. Color-coded progress bar (green to amber to red). Pause/resume. Fires confetti when time runs out. Different from the always-on Pomodoro. |

---

## 8e. Tier 7 components (AI, immersive 3D, collab, sensors, music, code playgrounds)

Added 2026-04. Closes the gaps surfaced in the "futuristic toolkit" research pass: in-browser LLMs, declarative 3D, real-time collab, camera-based sensors, MusicXML/tab notation, full-Node sandboxes, and React-based math.

### AI tutor

See `<AITutor>` in section 8 (Tier 3). Backed by a standalone Cloudflare Worker (`worker/`) that proxies to Workers AI (Llama 3.1 8B). The previous WebLLM/WebGPU implementation was removed in favor of a server-side path so the tutor works on iPads and weak Chromebooks without a multi-GB model download.

### Declarative 3D (React Three Fiber)

| Component | Library | npm | Brief |
|---|---|---|---|
| `<R3FScene gltf="..." demo="knot" />` | React Three Fiber + drei + three | `@react-three/fiber`, `@react-three/drei`, `three`, `@types/three` | Declarative 3D in MDX. drei adds OrbitControls, environment maps, GLTF loader, Float wrapper, Stage, Bounds. Pass `gltf=` URL or pick a primitive (`cube`/`sphere`/`torus`/`knot`). Auto-rotate, contact shadows. |

### Camera-based sensors (TensorFlow.js)

| Component | Library | npm | Brief |
|---|---|---|---|
| `<PoseMatch reference="warrior-2" />` | tfjs + pose-detection | `@tensorflow/tfjs`, `@tensorflow-models/pose-detection` | MoveNet 17-keypoint body skeleton overlay. Optional reference poses (`t-pose`, `warrior-2`, `arms-up`, `squat`) score live match % via joint angles. |
| `<HandSign target="thumbs-up" />` | tfjs + hand-pose-detection | `@tensorflow-models/hand-pose-detection` | MediaPipe Hands 21-keypoint hand skeleton. Built-in gesture detection: `open`, `fist`, `thumbs-up`, `peace`, `point`. |

### Real-time collab (Yjs)

| Component | Library | npm | Brief |
|---|---|---|---|
| `<StudyRoom roomId="..." />` | Yjs + y-webrtc | `yjs`, `y-webrtc` | Peer-to-peer shared notes textarea + chat + live participant counter. Auto-derives roomId from guide slug. Zero backend (uses Yjs's public WebRTC signaling servers). One-click invite copy. |

### Music notation

| Component | Library | npm | Brief |
|---|---|---|---|
| `<SheetMusic xml="..." />` or `<SheetMusic xmlString="..." />` | OpenSheetMusicDisplay | `opensheetmusicdisplay` | Render any MusicXML file (the format MuseScore, Finale, Sibelius, IMSLP all use). Built-in zoom in/out. Major upgrade over abcjs. |
| `<MiniScore notes={[...]} clef="treble" timeSignature="4/4" />` | VexFlow | `vexflow` | Programmatic notation for tiny inline examples. Note format: `"c#/4/q"`. Chords: `"(c/4 e/4 g/4)/h"`. |
| `<Tab src="..." />` or `<Tab tex="..." />` | AlphaTab | `@coderline/alphatab` | Guitar/bass tablature + standard notation. Reads Guitar Pro files (.gp/.gp3-7) or AlphaTex. Built-in playback (▶ Play). |

### Code playgrounds

| Component | Library | npm | Brief |
|---|---|---|---|
| `<NodeSandbox template="node" files={...} />` | Sandpack 2 (Nodebox) | `@codesandbox/sandpack-react` | Multi-file dev environment in-browser. Templates: `node`, `react`, `react-ts`, `vue`, `vite`, `astro`, `nextjs`, etc. Console + inline errors + hot reload. |

### React math viz

| Component | Library | npm | Brief |
|---|---|---|---|
| `<MafsPlot fns={["x*x"]} movable />` | Mafs | `mafs` | Plot function expressions. Optional draggable point demo. Vectors, points, labels via props. Easier than raw D3 for math guides. |

### Hardware simulation

| Component | Library | source | Brief |
|---|---|---|---|
| `<Wokwi project="123456789" />` | Wokwi | iframe `wokwi.com/projects/<id>` | Embed an Arduino, ESP32, ESP8266, Raspberry Pi Pico, or STM32 simulation with peripherals (sensors, displays, motors). |

### Scrollytelling

| Component | Library | npm | Brief |
|---|---|---|---|
| `<Scrollytell steps={[...]} graphics={{...}} />` | scrollama (already installed) | `scrollama` | Pinned graphic on the right, scroll-triggered text steps on the left. Each step swaps the graphic (typically an image URL keyed by step id). Uses already-installed `scrollama`. |

### Markdown sanitization (used by Tier 7 AI components)

| Module | Library | npm | Brief |
|---|---|---|---|
| `import { marked } from 'marked'` | marked | `marked` | Streaming markdown to HTML. Used to render LLM output. |
| `import DOMPurify from 'dompurify'` | DOMPurify | `dompurify`, `@types/dompurify` (dev) | XSS sanitizer. ALL LLM output passes through this before going into innerHTML. |

---

## 8f. Tier 8 components (atmospheric / wow-factor, lazy-loaded)

Added 2026-04 alongside the Romeo and Juliet Act 2 quiz-prep guide. All four are programmatic (zero asset files needed) and CDN-loaded so they cost nothing on guides that don't import them.

### Atmospheric backgrounds

| Component | Library | CDN | Brief |
|---|---|---|---|
| `<VantaBackground type="..." >slot</VantaBackground>` | Vanta.js 0.5.24 + three.js r134 | `cdnjs.cloudflare.com/.../three.min.js`, `cdn.jsdelivr.net/npm/vanta@0.5.24/dist/vanta.<type>.min.js` | Animated WebGL atmospheric background wrapping any slot content. Types: `net`, `fog`, `waves`, `globe`, `halo`, `topology`, `dots`, `birds`, `clouds`, `rings`, `ripple`, `cells`. Auto-swaps colors on theme toggle. Loads only the requested effect file. |

### Text reveal animations

| Component | Library | CDN | Brief |
|---|---|---|---|
| `<Typewriter text="..." />` or `<Typewriter texts={[...]} loop />` | Typed.js 2.1.0 | `cdn.jsdelivr.net/npm/typed.js@2.1.0/dist/typed.umd.js` | Character-by-character typewriter reveal with blinking cursor. Single line or cycling array. Reveal triggers when scrolled into view (IntersectionObserver). Variants: `h1`/`h2`/`h3`/`p`/`span`. Pause syntax: `"text^800"`. |

### Particle fields

| Component | Library | CDN | Brief |
|---|---|---|---|
| `<Particles preset="..." >slot</Particles>` | tsparticles 3.7.1 (all bundle) | `cdn.jsdelivr.net/npm/@tsparticles/all@3.7.1/tsparticles.all.bundle.min.js` | Animated particle background. Built-in presets: `stars`, `snow`, `petals`, `fire`, `fireworks`, `links`, `bubbles`, `triangles`, `confetti`. The `petals` preset uses pentagon shapes drifting bottom-right (themed for the balcony scene). Wraps slot content with a dark gradient backdrop. |

### Pseudo-3D pictograms

| Component | Library | CDN | Brief |
|---|---|---|---|
| `<Zdog shape="..." />` | Zdog 1.1.3 | `unpkg.com/zdog@1.1.3/dist/zdog.dist.min.js` | Hand-built pseudo-3D vector icons that auto-rotate (drag to interact). Built-in shapes: `rose`, `sun`, `moon`, `dagger`, `heart`, `hourglass`, `star`, `cup`, `mask`. Colors: `red` (default), `black`, `gold`. Optional caption renders in italic serif. No model files needed. |

---

## 9b. React integration

Added 2026-04 to support React-only libraries (Recharts, Nivo, React Flow, Tremor, react-chrono, TipTap, etc.).

| Package | Purpose |
|---|---|
| `@astrojs/react` | Astro integration so `client:only="react"` works in `.astro` files. |
| `react`, `react-dom` (v18) | React runtime, pinned to v18 due to Vidstack peer constraints. |
| `motion` | Smooth React animations (replaces deprecated framer-motion). |

React components live in `src/components/react/` and are imported by their Astro wrappers (which add the surface card and the `client:only="react"` directive).

---

## 10. Reserved / planned (not yet installed)

Nothing is currently reserved. Everything that was planned is now active. Drop future placeholders here as they come up.

---

## 11. Patterns and conventions

### Lazy-loading external scripts

Always use the shared helper `src/lib/loadScript.ts`:

```ts
import { loadScript, loadStyle, importGlobal, waitForGlobal } from '../lib/loadScript';

// Plain script (no global expected)
await loadScript('https://cdn.example.com/lib.js');

// Stylesheet (deduped)
loadStyle('https://cdn.example.com/lib.css');

// Script that attaches `window.MyLib`, returned typed
const MyLib: any = await importGlobal('https://cdn.example.com/mylib.js', 'MyLib');

// Module script (`<script type="module">`)
await loadScript('https://cdn.example.com/lib.mjs', { module: true });
```

The helper:

- Dedupes by URL (no script downloads twice in a session).
- Resolves only after the script's `load` event fires.
- Times out at 8 s when waiting on a global.

### Color palette

- Accent (red): `accent-50` through `accent-950`. Use `accent-700` for solid red, `accent-600` in dark mode.
- Ink (neutrals): `ink-50` (near-white) through `ink-950` (near-black).
- For embedded SVG/canvas/WebGL libraries that accept colors, pass `#b91c1c` (light) or `#f87171` (dark).
- Detect dark mode in JS: `document.documentElement.classList.contains('dark')`.

### House rules

- **No em dashes.** Replace with commas, periods, colons, or "and" depending on context.
- **No "difficulty" field on guides.** It was removed from the schema.
- **Logo is `/ihhs-logo.png`** (referenced in `Header.astro` and `BaseLayout.astro`).
- **Authoring guides:** standard skeleton in `welcome.mdx`. Frontmatter schema in `src/content/config.ts`.

### Bundle size budget

- Tier 3 components must NOT be statically imported in `BaseLayout.astro` or `GuideLayout.astro`.
- They load only when the MDX guide imports them.
- Warn the author in the component description when a library is huge (Pyodide ~10MB, Monaco ~3MB).

### Accessibility

- `aria-label` on every interactive root.
- Keyboard-operable controls (no click-only patterns).
- Don't autoplay audio.
- Provide a textual fallback or summary near visualizations.

---

## 12. How to add a new library

1. Check this catalog. The library may already be loaded by another component.
2. If genuinely new:
   - **CDN preferred** for component-specific libs (use `loadScript` helper).
   - **npm install** only if it must run during build (e.g., remark/rehype plugin) or is universally needed (e.g., framework integration).
3. Build the Astro component in `src/components/YourComponent.astro`. Follow the lazy-load pattern.
4. Add a row to the appropriate Tier 3 section above with: component name, library + version, CDN URL, brief.
5. Add an entry to `README.md` under "Tier 3 component catalog".
6. Optional: extend `welcome.mdx` to demo the new component.
