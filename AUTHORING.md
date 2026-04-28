# Guide authoring playbook (for Claude)

This file is for me, future Claude. It exists because I default to the same ten components every time (`<Callout>`, `<KeyTerm>`, `<Collapsible>`, `<Quiz>`, `<Flashcards>`, `<TypingQuiz>`, `<RoughNotation>`, `<MindMap>`, `<DragSort>`, `<StepThrough>`) and ignore the ~150 others that already exist in `src/components/`.

**Before authoring or revising any guide, read this file first.** Then check `LIBRARIES.md` for the full catalog. The decoder below maps teaching goals to components, so I stop thinking "what component fits here?" and start thinking "what do I want students to *do*?"

House rules (also in CLAUDE.md): no em dashes; red, white, black palette only; no `difficulty` field on guides; logo is `/ihhs-logo.png`.

---

## 1. The teaching-goal decoder

Look up the row whose verb matches what students need to do, pick the component that best fits the subject and depth.

### "I want students to memorize..."

| What | Use |
|---|---|
| Vocabulary words and definitions | `<Flashcards>` (auto-SRS when signed in), `<MatchPairs>`, `<Crossword>` |
| Foreign-language vocab, production direction | `<TypingQuiz>` (use it for any subject with terms students must produce) |
| Pronunciation, spoken recall | `<SpeechQuiz>` |
| Long passages (poems, soliloquies, definitions) | `<Memorize>` (read → cloze → first-letter → cold recall) |
| A specific labeled diagram | `<Hotspots>` in `mode="quiz"` |

### "I want students to visualize a process..."

| What | Use |
|---|---|
| A linear, click-through process | `<StepThrough>` |
| A branching algorithm or decision flow | `<FlowDiagram>` (interactive) or fenced `mermaid` (static) |
| Sorting / searching algorithms in motion | `<AlgoViz>` |
| Population genetics over time | `<EvolutionSim>`, `<FinchSim>` |
| Cell or tissue dynamics | `<CellSim>`, `<NeuronSim>` |
| Identification by branching question | `<DichotomousKey>` |

### "I want students to see relationships in data..."

| What | Use |
|---|---|
| Magnitudes flowing between things (energy, money, voters) | `<Sankey>` (d3) or `<NivoSankey>` (animated) |
| Hierarchy (taxonomy, file tree, decision tree) | `<Dendrogram>`, `<TreeMap>`, `<NivoSunburst>` |
| Networks (concept maps, food webs, citation graphs) | `<NetworkGraph>` (Cytoscape) |
| Concept maps from indented markdown | `<MindMap>` |
| Periodic relationships between groups | `<Chord>`, `<NivoChord>` |
| Stream / share-over-time | `<NivoStream>` |
| Geographic distribution | `<Choropleth>`, `<Cartogram>`, `<HeatMap>` |
| Generic chart from raw data | `<DataChart>`, `<RechartsLine>`, `<RechartsBar>`, `<TimeSeries>` (uPlot for big data) |

### "I want students to manipulate parameters..."

| What | Use |
|---|---|
| Graph functions, drag points | `<Desmos>`, `<MafsPlot movable />`, `<Graph>` (JSXGraph), `<Plotter>` |
| Geometry constructions | `<GeoGebra appName="geometry">` |
| Pre-built physics sandboxes | `<PhETSim sim="...">` (huge library, prefer this over rolling your own) |
| Custom 2D physics | `<PhysicsSandbox>` (Matter.js) |
| Live electrical circuits | `<CircuitSim>` (Falstad analog), `<LogicGate>` (CircuitVerse digital) |
| Genetic crosses | `<PunnettSquare>` |

### "I want students to read carefully..."

| What | Use |
|---|---|
| Annotate a primary source (teacher pre-baked highlights) | `<DocAnnotate>` |
| Let students annotate themselves (per-browser persistence) | `<TextAnnotate>` |
| Compare two versions side by side | `<DiffView>`, `<CompareSlider>` |
| Zoom into a high-res image | `<DeepZoom>`, `<DeepZoomAnnotated>` |
| Read alongside a video with timestamped notes | `<VideoAnnotate>` |
| Embed a textbook PDF | `<PDFViewer>` |

### "I want students to hear the language..."

| What | Use |
|---|---|
| Native-speaker audio with waveform | `<Pronounce>` (wavesurfer) |
| Read-aloud any guide passage | `<ReadAloud>` (already in `GuideLayout`, opt-in via /settings) |
| Speak-back vocab quiz | `<SpeechQuiz>` |
| IPA input for linguistics | `<IPAKeyboard>` |
| Chinese stroke order | `<HanziWriter>` |

### "I want students to code or run real software..."

| What | Use |
|---|---|
| Single-file Python | `<PyRunner>` (Pyodide, ~10MB first run) |
| Multi-file Node / React / Vue / Astro | `<NodeSandbox>` (Sandpack) |
| Full editor experience | `<CodeEditor>` (Monaco) |
| SQL queries against a real DB | `<SQLPlayground>` (sql.js) |
| Spreadsheet | `<Spreadsheet>` (Jspreadsheet) |
| Hardware simulation | `<Wokwi>` (Arduino, ESP32, Raspberry Pi Pico) |
| Regex live testing | `<RegexTester>` |

### "I want students to explore 3D structure..."

| What | Use |
|---|---|
| Proteins / biomolecules | `<Molecule pdb="...">` (3Dmol) |
| Chemical structures | `<ChemStructure smiles="...">` (2D), `<ChemDoodle3D>` (editable) |
| Anatomy | `<AnatomyViewer>`, `<BrainBrowser>` |
| Embedded models from any creator | `<Sketchfab>` |
| GLTF model with rotate / AR | `<ModelViewer>` |
| Custom three.js scene | `<ThreeScene>`, `<R3FScene>` (declarative R3F), `<Babylon>` |

### "I want students to test themselves..."

| What | Use |
|---|---|
| Multiple choice with feedback | `<Quiz>` (now with `extraBanks` for "↻ New quiz" cycling) |
| Timed practice test | wrap `<Quiz>` near `<TestTimer>` |
| Drill missed items only | `<TypingQuiz>` and `<SpeechQuiz>` both have "drill misses" mode |
| Order steps correctly | `<DragSort>` |
| Match terms to definitions | `<MatchPairs>` (custom), `<DragMatch>` (accessible @dnd-kit) |
| Identify parts of an image | `<Hotspots mode="quiz">` |

### "I want atmosphere or 'wow'..."

| What | Use |
|---|---|
| Animated WebGL background | `<VantaBackground type="net|fog|waves|globe|halo|topology|dots|birds|clouds|rings|ripple|cells">` |
| Particle field (petals, snow, fireworks, fire, stars) | `<Particles preset="...">` (tsparticles) |
| Typewriter intro | `<Typewriter>` |
| 3D vector pictogram (rose, dagger, hourglass, sun, moon, star, heart, cup, mask) | `<Zdog>` |
| Hand-drawn highlights inline | `<RoughNotation type="underline|box|circle|highlight|strike-through|crossed-off|bracket">` |
| Lottie / Rive animation | `<Lottie>`, `<Rive>` |
| Cinematic scroll storytelling | `<GSAPScroll>`, `<Scrollytelling>`, `<Scrollytell>` |
| Confetti reward | Auto-fires on Quiz 100% and on full Flashcards deck rated good/easy |

---

## 2. Subject playbooks

For each subject, a tight shortlist. If a guide doesn't use ≥4 from its list, ask why.

### Mathematics
Always: inline KaTeX `$x^2$`, block `$$...$$`, `<Quiz>`, `<Flashcards>` for theorems.
Choose 2–3: `<Desmos>` (algebra/calc), `<MafsPlot>` (clean React plots), `<GeoGebra>` (geometry), `<JSXGraph>` (custom constructions), `<MathBox>` (vector calc, parametric surfaces), `<EquationEditor>` (student input), `<Statistics>` / `<DataChart type="histogram">` (stats), `<NumberLine>` (intervals), `<MindMap>` (theorem dependency).

### Biology
Always: `<Quiz>`, `<Flashcards>`, `<Callout type="theorem">`.
Choose 2–3 by topic:
- Cell / molecular: `<Molecule pdb="...">`, `<DNASequence>`
- Genetics: `<PunnettSquare>`, `<DichotomousKey>`
- Evolution: `<EvolutionSim>`, `<FinchSim>`, `<Phylogeny>`
- Ecology: `<Sankey>` (energy flow), `<NetworkGraph>` (food webs), `<CellSim>`
- Anatomy: `<AnatomyViewer>`, `<Hotspots mode="quiz">`
- Neuro: `<NeuronSim>`, `<BrainBrowser>` (this corner of the catalog is unusually deep, use it).

### Chemistry
Always: KaTeX for thermodynamics formulae, `<Quiz>`.
Choose 2–3: `<PeriodicTable>` (Ptable iframe, deep-link to element), `<Molecule>` (3D), `<ChemStructure>` (2D from SMILES), `<ChemDoodle3D editable>` (mechanism sketching), `<PhETSim sim="reactions-and-rates">`, `<Plotter>` for kinetics.

### Physics
Always: KaTeX, `<Quiz>`, sometimes `<TestTimer>`.
Choose 2–3 by topic:
- Mechanics: `<PhysicsSandbox>`, `<PhETSim>` (massive library; prefer over building)
- E&M: `<CircuitSim>`
- Astrophysics: `<StarMap>`, `<VirtualSky>`, `<Aladin>`, `<R3FScene>` for orbital mechanics
- 3D scenes: `<R3FScene>`, `<Babylon>`, `<ModelViewer>`.

### History
Always: `<Quiz>`, `<KeyTerm>` (jargon), `<Flashcards>` (dates and figures).
Choose 2–3 by topic:
- Chronology: `<ChronoTimeline mode="VERTICAL_ALTERNATING">`, `<Timeline>` (Knight Lab), `<VisTimeline>` (parallel lanes), `<VerticalTimeline>` (scroll-reveal narrative)
- Geographic / spatial: `<MapView>` (Leaflet), `<MapLibreView>`, `<DeckMap>` (animated arcs for trade routes), `<Globe3D>` / `<CobeGlobe>` (lightweight), `<Cesium>` (production-grade real-terrain globe; needs `PUBLIC_CESIUM_TOKEN` for premium layers)
- Storytelling: `<StoryMap>`, `<Scrollytelling>`
- Primary sources: `<DocAnnotate>`, `<DeepZoomAnnotated>` for high-res manuscripts/maps
- Comparison: `<CompareSlider>` for then-and-now photos
- Map-labeling assessment: `<Hotspots image="europe-1914.png" mode="quiz">`.

### English / Literature
Always: `<KeyTerm>` (literary devices), `<Callout>` for passages, `<Quiz>`.
Choose 2–3:
- Close reading: `<DocAnnotate>` (teacher) or `<TextAnnotate>` (student)
- Memorization: `<Memorize>` for soliloquies
- Theme analysis: `<WordCloud>`, `<MindMap>` (motif maps)
- Atmosphere (use this — Romeo & Juliet shows the way): `<VantaBackground type="fog">`, `<Particles preset="petals">`, `<Zdog shape="rose|dagger|hourglass">`
- Drafts and revision: `<DiffView>`.

### World Languages
Always: `<Flashcards>`, `<TypingQuiz>`, `<Quiz>`.
- Spanish / Romance: `<TypingQuiz>`, `<SpeechQuiz>`, `<ImperfectConjugator>`, `<Pronounce>`
- Chinese: `<HanziWriter>` for stroke order
- Phonetics: `<IPAKeyboard>`, `<Pronounce>`.

**The three-stage chain works on every language unit:** `<Flashcards>` → `<TypingQuiz>` → `<SpeechQuiz>`. Recognition then production-typed then production-spoken. Don't ship a language guide without all three.

### Computer Science
Always: `<CodeEditor>` or `<PyRunner>`, `<Quiz>`, `<Callout type="warning">` for gotchas.
Choose 2–3:
- Algorithms: `<AlgoViz>`, `<StepThrough>` paired with code
- Data structures: `<NetworkGraph>` (graphs), `<TreeMap>` / `<Dendrogram>` (trees)
- Web dev: `<NodeSandbox template="react">`, `<SandpackPlayground>`
- Databases: `<SQLPlayground>`
- Logic / digital: `<LogicGate>`
- Hardware: `<Wokwi>`
- Game theory / strategy: `<ChessBoard>`, `<Sudoku>`
- AI sensors: `<PoseMatch>`, `<HandSign>` (camera, no model files needed).

### Music / Visual Arts
Always: `<Quiz>`, `<Flashcards>` for terms.
- Notation: `<Score abc="...">` (lightweight ABC), `<SheetMusic>` (full MusicXML), `<MiniScore>` (inline)
- Tabs with playback: `<Tab>` (Guitar Pro)
- Theory: `<MusicTheory>` (Tonal.js), `<EarTraining>` (iframe)
- Synthesis: `<Synth>` (Tone.js)
- MIDI: `<MidiPlayer>`
- Color theory: `<ColorWheel>`, `<ColorPicker>`
- Art viewing: `<DeepZoom>` (high-res paintings), `<Lightbox>` (galleries), `<Sketchfab>` (sculptures).

### Universal study aids (every guide)
- `<Callout type="theorem|definition|insight|warning|tip|note">` — break up long prose
- `<KeyTerm term="...">def</KeyTerm>` — inline tooltips for jargon (cheapest comprehension upgrade in the catalog)
- `<Collapsible question="...">answer</Collapsible>` — practice problems with reveal
- `<Quiz>` — at least one per major section
- `<Flashcards>` — terms and concepts, FSRS-syncs when signed in
- `<Pomodoro>` — sidebar timer
- `<ProgressRing value={75}>` — visible progress
- `<RoughNotation type="underline">` — hand-drawn emphasis on a few key sentences
- `<TableOfContents>` — already in `GuideLayout`.

---

## 3. Combination patterns

The catalog compounds when components are paired. Six high-leverage combos:

### A. "See it, do it, prove it"
Replace any single explanation with this three-beat structure:
1. **See:** `<PhETSim>`, `<Desmos>`, or any sim that lets students play.
2. **Do:** `<Whiteboard>` or `<EquationEditor>` for student work.
3. **Prove:** `<Quiz>` to lock comprehension.

### B. "Read, annotate, recall" (history / lit)
1. **Read with structure:** `<DocAnnotate>` with teacher-baked highlights.
2. **Annotate yourself:** `<TextAnnotate>` (per-browser persistence).
3. **Recall:** `<Quiz>` or `<Memorize mode="cloze">`.

### C. "Drill the production direction" (languages)
1. **Encounter:** `<Flashcards>` (recognition, auto-SRS).
2. **Produce typed:** `<TypingQuiz>` (lenient on diacritics, drill misses).
3. **Produce spoken:** `<SpeechQuiz>` (mic, typed fallback for unsupported browsers).

### D. "Animate, freeze, explain" (math / science)
1. **Animate:** `<RevealOnScroll>`, `<Lottie>`, or a sim.
2. **Freeze and step through:** `<StepThrough>`.
3. **Probe understanding:** `<Quiz>` whose questions require the intuition just built.

### E. "Atmosphere, then content" (lit / history)
Wrap the hero in `<VantaBackground>` or `<Particles>` with a `<Typewriter>` headline and a `<Zdog>` pictogram. Then drop into normal prose with `<Callout>` and `<KeyTerm>`. The Romeo & Juliet guide shows the exact recipe (Vanta net, petals, dagger Zdog). Extend pattern: *Gatsby* (waves + ColorWheel art-deco), *1984* (topology + Typewriter), *Hamlet* (fog + Zdog skull/mask).

### F. "Manipulate parameters to discover the law" (inquiry science / math)
1. **Knob:** `<Desmos>` with sliders, or `<PhETSim>`.
2. **Hypothesis:** `<Collapsible question="What rule did you find?">` with the answer hidden.
3. **Test:** `<Quiz>`.

### G. "Timed test simulation" (AP / EOC / SAT)
`<TestTimer minutes={45} title="...">` near `<Quiz extraBanks={[...]} />`. Now the `extraBanks` prop lets students retake with fresh question banks via "↻ New quiz."

---

## 4. Canonical guide skeleton

The required section structure (also documented in `welcome.mdx`):

```mdx
## Learning objectives
## TL;DR
## Glossary
## Core concepts
## Worked example
## Practice         (uses <Collapsible>)
## Quiz             (uses <Quiz>; for languages, also <TypingQuiz> / <SpeechQuiz>)
## Flashcards       (uses <Flashcards>)
## Mnemonics
## Common pitfalls
## Cheat sheet
```

Frontmatter (required): `title`, `description`, `subject`, `estimatedTime`, `date`. Optional: `tags`, `authors` (defaults to `["IHHS"]`), `updated`, `cover`, `categories`, `draft`.

For a hero with atmosphere, wrap the lead paragraph in `<VantaBackground>` or `<Particles>` ABOVE `## Learning objectives`. See `spanish-imperfect-regular.mdx` for the recipe (Vanta waves + Typewriter + English subtitle).

---

## 5. Self-audit before shipping

Eight questions to ask before declaring a guide done. If most answers are no, the catalog is being underused.

1. Is there at least one `<KeyTerm>` per page of prose?
2. Is there at least one `<Quiz>` and one `<Flashcards>` per major section?
3. Does anything visual (a diagram, a process, a function) get *manipulated*, not just shown?
4. Does anything textual (a passage, a definition) get *recalled*, not just read?
5. If the guide has a list of 5+ things students must know cold, is `<Memorize>` or `<Crossword>` used?
6. If the guide has a sequence (steps, chronology, proof), is `<StepThrough>` or `<DragSort>` used?
7. If the guide has a chartable dataset, is the chart interactive (`<Plotter>` / `<DataChart>` / `<RechartsLine>` / `<NivoSankey>`) or just an image?
8. Does the title section have *one* atmosphere component (`<VantaBackground>` / `<Particles>` / `<Typewriter>` / `<Zdog>`)?

Aim for 6+ yeses. Anything below 4 means revise before merging.

---

## 6. My defaults to break

I lean on these ten too hard: `<Callout>`, `<KeyTerm>`, `<Collapsible>`, `<Quiz>`, `<Flashcards>`, `<TypingQuiz>`, `<RoughNotation>`, `<MindMap>`, `<DragSort>`, `<StepThrough>`. They are good. They are also the same ten in every guide. **For the next ten guides I author, force at least one component from this list per guide that I have never used before:**

- `<Hotspots mode="quiz">` for diagram labeling
- `<DocAnnotate>` for primary-source close reading
- `<Memorize>` for any list of 5+ things
- `<DichotomousKey>` for any "identify which X is this" goal
- `<Sankey>` / `<NetworkGraph>` instead of bullet-list "X causes Y" prose
- `<NodeSandbox>` instead of `<PyRunner>` when there are multiple files
- `<DiffView>` for any before/after textual comparison
- `<CompareSlider>` for any before/after visual comparison
- `<MathBox>` instead of static plots for vector calc / parametric surfaces
- `<NivoCalendar>` / `<CalHeatmap>` for any date-stamped dataset
- `<Particles>` / `<VantaBackground>` for atmosphere on subjects beyond Romeo & Juliet
- `<TestTimer>` + `<Quiz extraBanks>` combo for any AP / EOC / SAT prep guide
- `<ProgressRing>` to surface section progress

If I default to my old ten without consulting this file, I'm leaving 90% of the catalog on the shelf.

---

## 7. Quick lookup index

- **Full catalog:** `LIBRARIES.md` (Tiers 1–9, organized by library family)
- **Lazy-load helper:** `src/lib/loadScript.ts`
- **Storage helpers:** `src/lib/storage.ts`, `srs.ts`, `progress.ts`
- **Auth (hybrid local/Supabase):** `src/lib/auth.ts`
- **Confetti presets:** `src/lib/confetti.ts` (`burst`, `cannons`, `fireworks`)
- **Color tokens:** `accent-50` through `accent-950` (red), `ink-50` through `ink-950` (neutral)
- **Dark mode detect:** `document.documentElement.classList.contains('dark')`
- **Embedded SVG/canvas color picks:** `#b91c1c` (light) or `#f87171` (dark)
