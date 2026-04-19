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
| `<DNASequence sequence="..." />` | none (custom SVG/HTML) | n/a | DNA/RNA/protein with feature highlights. |
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
| `<TremorCard label="..." value="..." progress={...} />` | Tremor 3 | `@tremor/react` | Dashboard KPI card with delta badge and progress bar. |
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
