# IHHS Study Guide Hub

A free, ad-free, no-account-needed library of deep-dive interactive study guides for IHHS students.

Built with [Astro](https://astro.build) + Tailwind + MDX. No backend, no database, no API costs ever, just static files you can host anywhere for free.

## What's inside

- **Deep-dive guides** with learning objectives, glossary, worked examples, practice, quizzes, flashcards, mnemonics, and a printable cheat sheet
- **Accounts** (no email needed) with personal dashboards, streak tracking, and per-user data
- **Spaced repetition system** (SM-2 algorithm), so flashcards reschedule based on how well you know them
- **Daily review queue** at `/review` showing every card due across all guides
- **Progress dashboard** at `/dashboard` with streak, mastered cards, quiz averages, 30-day activity heatmap
- **Interactive components**: multiple-choice quizzes with instant feedback and score tracking, flippable flashcards with SRS scheduling, collapsible Q&A
- **Full-text search** (⌘K / Ctrl K) across guide titles, descriptions, and bodies, with snippet previews
- **Beautiful rendering**: KaTeX math, Mermaid diagrams, syntax-highlighted code
- **Light + dark theme** with system preference detection
- **Smooth page transitions** via the View Transitions API
- **Reading progress bar** and sticky table of contents on every guide

## Run it locally

```bash
npm install
npm run dev
```

Then open <http://localhost:4321>.

## Build for production

```bash
npm run build
```

The output goes to `dist/`. Deploy that folder to:

- **Vercel**: `npm i -g vercel && vercel deploy` (free)
- **Netlify**: drag-and-drop `dist/` at app.netlify.com (free)
- **GitHub Pages**: push `dist/` to a `gh-pages` branch (free)
- **Cloudflare Pages**: connect the repo, build command `npm run build`, output `dist` (free)

Any of these will give you one URL you can share with classmates. No login, no API keys, no cost.

## Add a new guide

1. Create a new file in `src/content/guides/` with a `.mdx` extension. The filename (minus extension) becomes the URL slug. Example: `photosynthesis.mdx` becomes `/guides/photosynthesis`.
2. Start with this frontmatter:

```yaml
---
title: "Your Guide Title"
description: "One-sentence hook for the library card."
subject: "Biology"
estimatedTime: 15           # minutes
date: 2026-04-17
tags: ["topic", "exam-prep"]
authors: ["Your Name"]
---
```

3. Import the interactive components you want to use:

```mdx
import Callout from '../../components/Callout.astro';
import KeyTerm from '../../components/KeyTerm.astro';
import Collapsible from '../../components/Collapsible.astro';
import Quiz from '../../components/Quiz.astro';
import Flashcards from '../../components/Flashcards.astro';
```

4. Follow the standard guide skeleton (see `welcome.mdx` for the full template):

```
## Learning objectives
## TL;DR
## Glossary
## Core concepts
## Worked example
## Practice         (uses <Collapsible>)
## Self-quiz        (uses <Quiz>)
## Flashcards       (uses <Flashcards>)
## Mnemonics
## Common pitfalls
## Cheat sheet
```

The new guide appears in the library and search automatically. No other changes needed.

## Component reference

### `<Callout type="..." title="...">`

Highlighted boxes for emphasis. Types: `note`, `insight`, `warning`, `tip`, `theorem`, `definition`.

```mdx
<Callout type="insight" title="Why this matters">
The key intuition behind the concept.
</Callout>
```

### `<KeyTerm term="...">`

Inline tooltip definitions (hover to see).

```mdx
<KeyTerm term="Mitosis">Cell division producing two genetically identical daughter cells.</KeyTerm>
```

### `<Collapsible question="...">`

Click-to-reveal practice question.

```mdx
<Collapsible question="What's the answer to X?">
The full explanation goes here.
</Collapsible>
```

### `<Quiz questions={[...]}/>`

Interactive multiple-choice quiz.

```mdx
<Quiz questions={[
  {
    q: "Question text",
    choices: ["A", "B", "C", "D"],
    answer: 2,                    // 0-indexed
    explain: "Why C is correct."
  }
]} />
```

### `<Flashcards cards={[...]}/>`

Flippable flashcard deck.

```mdx
<Flashcards cards={[
  { front: "Front of card", back: "Back of card" },
  { front: "Q", back: "A" }
]} />
```

### Math (KaTeX)

Inline: `$E = mc^2$`. Block:

```
$$
\int_a^b f(x)\,dx = F(b) - F(a)
$$
```

### Diagrams (Mermaid)

```
\`\`\`mermaid
flowchart LR
  A --> B
  B --> C
\`\`\`
```

## Subject-specific interactive components

These load on demand only on guides that use them, so they don't slow down the rest of the site.

### `<MapView markers={[...]}/>`: Interactive maps (Leaflet)

```mdx
<MapView
  title="Major sites in Europe"
  center={[50, 10]}
  zoom={4}
  markers={[
    { lat: 48.86, lng: 2.35, label: "Paris", year: "1940", popup: "Captured June 14, 1940." }
  ]}
/>
```

### `<Timeline events={[...]}/>`: Scrollable interactive timeline (TimelineJS)

```mdx
<Timeline
  title={{ headline: "Causes of WWII", text: "1919-1939" }}
  events={[
    { date: "1919-06-28", headline: "Treaty of Versailles", text: "..." },
    { date: "1933-01-30", headline: "Hitler becomes Chancellor" }
  ]}
/>
```

### `<Molecule pdb="..."/>`: 3D molecule viewer (3Dmol.js)

```mdx
<Molecule pdb="1UBQ" style="cartoon" />     {/* PDB protein */}
<Molecule cid="2244" style="stick" />        {/* PubChem CID, e.g. aspirin */}
```

### `<Desmos expressions={[...]}/>`: Graphing calculator

```mdx
<Desmos expressions={["y = x^2", "y = 2x + 1"]} />
```

### `<GeoGebra appName="graphing"/>`

```mdx
<GeoGebra appName="graphing" />               {/* blank graphing calculator */}
<GeoGebra materialId="abcd1234" />            {/* embed a published GeoGebra material */}
```

### `<Graph setup={...}/>`: DIY interactive math/physics (JSXGraph)

```mdx
<Graph setup={`
  const board = JXG.JSXGraph.initBoard('CONTAINER_ID', { boundingbox: [-5,5,5,-5], axis: true });
  const a = board.create('slider', [[-4,4],[2,4],[-3,1,3]], { name: 'a' });
  board.create('functiongraph', [(x) => a.Value() * x * x]);
`} />
```

### `<Whiteboard />`: In-page drawing canvas

```mdx
<Whiteboard prompt="Sketch the cross-section of a leaf." />
```
Saves to `localStorage` so the sketch persists across visits.

### `<CodeEditor language="..."/>`: Monaco (VS Code) editor

```mdx
<CodeEditor language="python" initial={`def hello():\n    print("hi")`} />
```

### `<EquationEditor initial="..."/>`: Visual equation editor (MathLive)

```mdx
<EquationEditor initial="\\frac{a}{b} + c" />
```

Type with the keyboard or use the on-screen keypad. Copy the result as LaTeX with one click.

## Tier 3 component catalog

The full catalog with usage docs lives in [`LIBRARIES.md`](./LIBRARIES.md). Quick index of additional lazy-loaded components:

**Science**

| Component | Library | Use case |
|---|---|---|
| `<PhETSim sim="..." />` | PhET (iframe) | Embed any PhET simulation by id |
| `<PhysicsSandbox setup="..." />` | Matter.js | 2D rigid-body physics scene |
| `<ChemStructure smiles="..." />` | SmilesDrawer | Render molecules from SMILES |
| `<DNASequence sequence="..." features={[...]} />` | Custom | DNA/RNA/protein with codon-to-amino-acid hover tooltips |
| `<AITutor guideTitle="..." />` | Cloudflare Workers AI | Login-gated streaming chat tutor (see `worker/`) |
| `<Phylogeny newick="..." />` | phylotree.js | Evolutionary tree |
| `<CircuitSim starter="rc" />` | Falstad CircuitJS | Circuit simulator |

**Math and stats**

| Component | Library | Use case |
|---|---|---|
| `<Plotter fns={[{fn:"x^2"}]} />` | function-plot | Lightweight function graphs |
| `<DataChart type="bar" labels={[...]} datasets={[...]} />` | Chart.js | Quick charts from raw data |
| `<VegaChart spec={...} />` | Vega-Lite | Declarative grammar of graphics |
| `<P5Sketch code="..." />` | p5.js | Creative coding sandbox |
| `<Statistics data={[...]} />` | Chart.js | Histograms with summary stats |
| `<NumberLine min={0} max={10} marks={[...]} />` | Custom SVG | Inequalities, intervals, integers |

**Computer science**

| Component | Library | Use case |
|---|---|---|
| `<PyRunner initial="..." />` | Pyodide | Real Python in the browser (~10MB) |
| `<SandpackPlayground sandboxId="..." />` | CodeSandbox embed | Multi-file React/JS playgrounds |
| `<AlgoViz algorithm="quick" />` | Custom | Animated sorting algorithms |
| `<RegexTester pattern="..." />` | Native | Live regex match highlighter |
| `<SQLPlayground schema="..." />` | sql.js | SQLite in the browser |

**History and geography**

| Component | Library | Use case |
|---|---|---|
| `<StoryMap url="..." />` | StoryMapJS (iframe) | Geographic scrollytelling |
| `<Globe3D markers={[...]} arcs={[...]} />` | globe.gl | 3D Earth visualization |
| `<DocAnnotate text="..." annotations={[...]} />` | Custom | Pre-baked source-text highlights |
| `<CompareSlider before="..." after="..." />` | img-comparison-slider | Before/after photos |

**Languages and literature**

| Component | Library | Use case |
|---|---|---|
| `<HanziWriter character="字" />` | hanzi-writer | Chinese stroke-order tutor |
| `<Pronounce src="..." />` | wavesurfer.js | Audio waveform with click-to-play |
| `<IPAKeyboard />` | Custom | Type IPA symbols |
| `<TextAnnotate text="..." />` | Custom | Reader-side annotations (saved locally) |
| `<DiffView before="..." after="..." />` | diff2html | Compare drafts or translations |

**Music and arts**

| Component | Library | Use case |
|---|---|---|
| `<Score abc="..." />` | abcjs | Render and play sheet music |
| `<Synth />` | Tone.js | Play scales, chords, intervals |
| `<MidiPlayer src="..." />` | html-midi-player | Interactive MIDI playback |
| `<ColorWheel base="#b91c1c" />` | chroma.js | Color theory explorer |

**Universal study aids**

| Component | Library | Use case |
|---|---|---|
| `<MindMap markdown="..." />` | markmap | Auto-generate concept maps |
| `<DragSort items={[...]} answer={[...]} />` | SortableJS | Drag-to-order exercises |
| `<MatchPairs pairs={[...]} />` | Custom | Match terms to definitions |
| `<Crossword words={[...]} />` | crossword-layout-generator | Vocab crossword |
| `<Hotspots image="..." spots={[...]} />` | Custom | Click parts of a diagram |
| `<Tldraw />` | tldraw (iframe) | Collaborative whiteboard |
| `<Pomodoro />` | Custom | Built-in study timer |

> **For full prop docs and examples for each, see [`LIBRARIES.md`](./LIBRARIES.md).**

## Tier 4 component catalog (subject gap-fillers)

Added on top of Tier 3 for chem, bio, astronomy, extended CS, extended data viz, multimedia, music, presentations, and engagement.

**Chemistry**

| Component | Library | Use case |
|---|---|---|
| `<PeriodicTable element="..." />` | Ptable | Full interactive periodic table, optional deep-link to a specific element |
| `<ChemDoodle3D mol="..." editable />` | ChemDoodle Web | 2D reaction/mechanism sketcher |

**Biology / health**

| Component | Library | Use case |
|---|---|---|
| `<AnatomyViewer atlas="brain" />` | Open Anatomy Project | WebGL atlases for brain, knee, ear, head-and-neck, abdomen, larynx |
| `<BrainBrowser atlas="mni" />` | Brain Browser | MNI/CBrain surface viewer |
| `<CellSim setup="..." />` | Artistoo | Cellular Potts simulations (morphogenesis, chemotaxis) |
| `<NeuronSim />` | PhET | Action-potential sim, a preset wrapper |

**Astronomy**

| Component | Library | Use case |
|---|---|---|
| `<StarMap magLimit={5} />` | d3-celestial | Constellations, Milky Way, DSOs |
| `<VirtualSky latitude={40} />` | VirtualSky | Planetarium for a given lat/long/time |
| `<Aladin target="M31" />` | Aladin Lite 3 | Real astronomy imagery from CDS surveys |

**Computer science (extended)**

| Component | Library | Use case |
|---|---|---|
| `<LogicGate />` | CircuitVerse | Digital logic circuits, flip-flops, memory |
| `<ChessBoard fen="..." />` | Chessground (lichess) | Chess diagrams for game theory and AI |
| `<Sudoku difficulty="medium" />` | sudoku.js | Generate + solve puzzles interactively |
| `<Spreadsheet data={[...]} />` | Jspreadsheet CE | Excel-like data manipulation |

**Data viz (extended)**

| Component | Library | Use case |
|---|---|---|
| `<NetworkGraph nodes={[...]} edges={[...]} />` | Cytoscape.js | Concept graphs, food webs, alliances |
| `<WordCloud text="..." />` | d3-cloud | Vocabulary frequency, theme analysis |
| `<GanttChart tasks={[...]} />` | Frappe Gantt | Project or historical-event timelines |
| `<TimeSeries data={...} series={[...]} />` | uPlot | Large time-series datasets (~50KB, fast) |

**Multimedia**

| Component | Library | Use case |
|---|---|---|
| `<VideoAnnotate src="..." annotations={[...]} />` | Native video + custom | Click-to-jump timestamped notes |
| `<PDFViewer src="..." page={3} />` | Mozilla PDF.js | Embed textbook chapters |
| `<ThreeScene gltf="..." />` | three.js | Generic 3D model viewer |

**Music (extended)**

| Component | Library | Use case |
|---|---|---|
| `<MusicTheory mode="scale" />` | Tonal.js | Scale/chord explorer with keyboard highlight |
| `<EarTraining exercise="intervals" />` | ToneDear (iframe) | Intervals, chords, scales, progressions |

**Presentations and engagement**

| Component | Library | Use case |
|---|---|---|
| `<Slides slides={[...]} />` | reveal.js | Inline slide decks or embed an external deck |
| `<Poll src="..." />` | Particify / ClassQuiz / StrawPoll | Live classroom polls (iframe an instance) |

## Tier 5 component catalog (visual / data-viz)

Built specifically to make learning more visual.

**Animations and motion**

| Component | Library | Use case |
|---|---|---|
| `<Lottie src="..." />` | lottie-web | Embed After-Effects animations from .json |
| `<Rive src="..." stateMachine="..." />` | Rive | Interactive state-machine animations |
| `<RevealOnScroll>` | IntersectionObserver | Wrap children to fade/slide in as they scroll into view |
| `<StepThrough steps={[...]} />` | Custom | Click-next walkthrough for derivations and mechanisms |

**Sketch / hand-drawn**

| Component | Library | Use case |
|---|---|---|
| `<Excalidraw scene="..." />` | Excalidraw | Hand-drawn whiteboard |
| `<RoughNotation type="underline">` | rough-notation | Hand-drawn highlights / underlines / boxes on inline content |

**Deep-zoom + image gallery**

| Component | Library | Use case |
|---|---|---|
| `<DeepZoom src="..." />` | OpenSeadragon | Infinite zoom on a high-res image |
| `<DeepZoomAnnotated markers={[...]} />` | OpenSeadragon | Clickable annotations on top of deep-zoom |
| `<Lightbox images={[...]} />` | PhotoSwipe | Click thumbnails for fullscreen pan/zoom viewer |

**3D models**

| Component | Library | Use case |
|---|---|---|
| `<Sketchfab uid="..." />` | Sketchfab embed | Embed any 3D model from Sketchfab's library |
| `<ModelViewer src="..." />` | Google `<model-viewer>` | glTF embed with rotate, zoom, AR mode |
| `<Babylon setup="..." />` | Babylon.js | 3D scene engine with physics |

**Hierarchy and flow**

| Component | Library | Use case |
|---|---|---|
| `<Sankey nodes={[...]} links={[...]} />` | d3-sankey | Flows with magnitude (energy, blood, money) |
| `<TreeMap data={...} />` | d3-hierarchy | Nested rectangles sized by value |
| `<SunburstChart data={...} />` | d3-hierarchy | Radial hierarchical viz |
| `<Chord labels={[...]} matrix={...} />` | d3-chord | Relationships between groups |
| `<Dendrogram data={...} layout="radial" />` | d3-hierarchy | Tree diagrams (evolution, taxonomy) |

**Geographic data**

| Component | Library | Use case |
|---|---|---|
| `<Choropleth data={...} />` | d3-geo + topojson | Color regions by data value |
| `<Cartogram data={...} />` | d3-force | Dorling cartogram (regions as sized circles) |
| `<HeatMap rows={...} cols={...} values={...} />` | d3 | 2D color grid |
| `<CalHeatmap data={...} />` | Custom SVG | GitHub-style 90-day calendar heatmap |

**Scientific charts**

| Component | Library | Use case |
|---|---|---|
| `<Plotly data={[...]} layout={...} />` | Plotly.js | 3D scatter, contour, surface, parallel coords |
| `<ECharts option={...} />` | Apache ECharts | Funnels, gauges, polar, sankey, treemap |
| `<MathBox setup="..." />` | MathBox | Vector calculus, parametric surfaces (3Blue1Brown style) |

**Interactive 2D canvases**

| Component | Library | Use case |
|---|---|---|
| `<Konva setup="..." />` | Konva.js | Drag shapes, animate, event listeners |
| `<Fabric setup="..." />` | Fabric.js | Same idea (used inside Canva) |
| `<RoughViz type="bar" />` | rough-viz | Hand-drawn-aesthetic bar/line/pie charts |

**UX widgets**

| Component | Library | Use case |
|---|---|---|
| `<Confetti preset="cannons" />` | canvas-confetti | Burst on click or scroll. Auto-fires from Quiz on 100% and Flashcards on full deck rated good/easy. |
| `<Tooltip content="..." />` | Tippy.js | Animated hover tooltips |
| `<ColorPicker />` | Pickr | Color theory exercises with HEX/RGB/HSL output |
| `<ProgressRing value={75} />` | Custom SVG | Animated ring for scores, progress |

## Project structure

```
src/
  components/        # Astro components (UI + interactive)
  content/
    config.ts        # Schema for guide frontmatter
    guides/          # All guide .mdx files
  layouts/
    BaseLayout.astro
    GuideLayout.astro
  pages/
    index.astro      # Home
    library.astro    # All guides
    about.astro
    guides/[...slug].astro
    subjects/index.astro
    subjects/[subject].astro
  styles/
    global.css
public/
  ihhs-logo.png
```

## Accounts and data

Accounts are **local-first**: usernames live in `localStorage`, no email or password required. Per-user progress, flashcard schedules, and quiz scores are namespaced by user id, so multiple classmates can share a browser.

Trade-off: data lives on one device. To enable cross-device sync (so a classmate can log in on phone + laptop and see the same streak), swap the storage backend for Supabase. The app is structured to make this drop-in.

### Optional: enable cross-device accounts via Supabase

1. Sign up at <https://supabase.com> (free tier covers ~50k users).
2. Create a new project, then in the SQL editor run:

   ```sql
   create table profiles (
     id uuid references auth.users primary key,
     username text unique not null,
     display_name text not null,
     created_at timestamptz default now()
   );
   create table user_data (
     user_id uuid references auth.users,
     key text not null,
     value jsonb not null,
     updated_at timestamptz default now(),
     primary key (user_id, key)
   );
   alter table profiles enable row level security;
   alter table user_data enable row level security;
   create policy "users read own profile"   on profiles   for select using (auth.uid() = id);
   create policy "users insert own profile" on profiles   for insert with check (auth.uid() = id);
   create policy "users update own profile" on profiles   for update using (auth.uid() = id);
   create policy "users read own data"      on user_data  for select using (auth.uid() = user_id);
   create policy "users write own data"     on user_data  for all    using (auth.uid() = user_id);
   ```

3. Add Supabase client: `npm install @supabase/supabase-js`
4. Create `.env`:

   ```
   PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
   ```

5. Replace the bodies of `src/lib/auth.ts` and `src/lib/storage.ts` with Supabase calls (the function signatures are designed to match, so every consumer keeps working).

The localStorage version is the perfect starting point: zero infrastructure, instant, private. Move to Supabase only when classmates start asking for cross-device sync.

## Optional: enable the AI tutor

`<AITutor>` is a login-gated chat component backed by a standalone Cloudflare Worker in `worker/` that proxies Workers AI. The free tier is about 10k Llama 3.1 8B requests per day.

1. Deploy the Worker (see `worker/README.md`):
   ```
   cd worker && npm install && npx wrangler deploy
   ```
2. Copy the Worker URL Wrangler prints (e.g. `https://ihhs-ai-tutor.<you>.workers.dev`).
3. In Vercel project settings, add:
   ```
   PUBLIC_AI_TUTOR_URL=https://ihhs-ai-tutor.<you>.workers.dev
   ```
4. Drop `<AITutor guideTitle={frontmatter.title} />` into any guide.

Without the env var, the component renders a clear "not configured" notice instead of a broken chat box.

## License

Built by IHHS student for IHHS students. Free to fork and adapt.
