# Guide authoring playbook (for Claude)

This file is for me, future Claude. The catalog has ~200 components and I default to the same ten. Read this before authoring or revising a guide. Then check `LIBRARIES.md` for the full menu.

**Audience model**: assume a visual learner. They retain a diagram before a paragraph, a chart before a table, a map before a place name, an animation before a sequence of steps. The bias of every choice in this file is "show, don't tell."

House rules (also in CLAUDE.md): no em dashes; red, white, black palette only; logo is `/ihhs-logo.png`.

---

## 1. The one rule

**Every 200 words of prose needs a visual.** Count the prose. If a section runs longer than that without an interactive component, an image, a chart, a diagram, or a simulation, the section is too text-heavy. Revise it.

This is the entire playbook in one sentence. Everything below is the menu.

---

## 2. Pick the most advanced visual that fits

Reach for the highest tier the teaching goal can justify, then walk down only if it's overkill.

| Goal | First reach | Fallback | Why |
|---|---|---|---|
| Show a 3D structure (molecule, organ, building, planet) | `<Cesium>` (real-terrain globe), `<Babylon>` / `<R3FScene>` for custom, `<Spline>` runtime for designer-built scenes | `<ModelViewer>`, `<Sketchfab>` | Interactive 3D outperforms any static image for spatial concepts. |
| Show a relationship between things | `<NetworkGraph>` (Cytoscape) for free-form, **AntV G6** for hierarchical/layered, `<MindMap>` for indented markdown | `<Sankey>`, `<Chord>`, `<Dendrogram>` | A graph is the canonical visual learner format for relations. |
| Show change over time | `<TimeSeries>` (uPlot) for big data, `<RechartsLine>`, `<NivoStream>` for share-over-time, `<NivoCalendar>` for date-stamped events | `<DataChart>`, `<Plotly>` | Lines and areas beat tables of numbers. |
| Show change in space | `<Cesium>`, `<MapLibreView>`, `<DeckMap>` (animated arcs, hex bins), `<Choropleth>`, `<HeatMap>` | `<MapView>` (Leaflet) | A map is the canonical visual learner format for geography. |
| Show a process in motion | `<Lottie>`, `<Rive>` (state machines), `<HistoryAnimation>`, `<DrawnSVG>` (line-by-line draw-on) | `<StepThrough>` (click-through), Mermaid in a fenced block | Real motion shows causality; static frames imply it. |
| Show a primary source | `<DeepZoomAnnotated>` for high-res images, `<DocAnnotate>` for annotated text, `<Flipbook>` for documents, `<Panorama360>` for places | `<ImageAnnotate>`, `<CompareSlider>` | Zooming/panning is what a visual learner naturally wants to do with a source. |
| Show a chronology | `<ChronoTimeline>` (vertical alternating), `<VerticalTimeline>` (scroll-revealed), `<VisTimeline>` (parallel lanes), `<NumberLine>` (dense rail) | `<Timeline>` (Knight Lab iframe) | Pick the timeline that matches the structure (single-track vs multi-track vs cluster-rich). |
| Show a hierarchy or category | `<TreeMap>`, `<NivoSunburst>`, `<Dendrogram>`, **AntV G6** dagre layout | bullet list (last resort) | Visual nesting is the point. |
| Show a counterfactual or branching choice | `<BranchingScenario>`, `<DichotomousKey>`, `<MissileCrisisGame>`-style branching SIMs | `<FlowDiagram>` (React Flow) | Let the learner *play* the choice, not read about it. |
| Show a 3D chart | **ECharts GL** (3D bars, surface, globe, flowGL), `<Plotly>` 3D (scientific) | `<MathBox>` (vector calc) | A spinnable 3D chart can communicate density that a 2D projection collapses. |
| Add atmosphere to the hero | `<VantaBackground>` (12 effects), `<Particles>` (presets), `<AuroraBackground>`, `<Typewriter>`, `<Zdog>` pictogram | none | Set the mood in the first viewport. Visual learners orient by aesthetic. |
| Test recall visually | `<Hotspots mode="quiz">` for image labeling, `<DragSort>` for ordering, `<DragMatch>` for matching, `<Crossword>` for vocab | `<Quiz>` multiple choice | Ask the visual learner to *do* the visual, not pick a letter. |

If a goal isn't on this list and nothing in `LIBRARIES.md` fits cleanly, **find a better library on the web, add it to `LIBRARIES.md` (with the CDN URL verified to load), and build a wrapper**. The catalog grows on demand.

---

## 3. The pack-it-with-visuals checklist

Run through this before declaring any guide done. Every "no" should make you ask why, not move on.

1. Does the title section have an atmosphere component? (`<VantaBackground>`, `<Particles>`, `<AuroraBackground>` + `<Typewriter>`)
2. Is there a globe, map, or 3D scene in the first three sections?
3. Is there at least one chart or graph? (any of `TimeSeries`, `RechartsLine`, `Sankey`, `NetworkGraph`, `Choropleth`, `NivoCalendar`, `NivoStream`, `Statistics`, `TreeMap`, `Dendrogram`)
4. Is there at least one animation that *moves on its own*? (`Lottie`, `Rive`, `HistoryAnimation`, `DrawnSVG`)
5. Is there at least one click-through or step-by-step? (`StepThrough`, `BranchingScenario`, `DichotomousKey`, `Scrollytell`)
6. Is there at least one image you can zoom into or annotate? (`DeepZoom`, `DeepZoomAnnotated`, `ImageAnnotate`, `Panorama360`)
7. Is there at least one assessment that's visual, not just multiple choice? (`Hotspots mode="quiz"`, `DragSort`, `DragMatch`, `Crossword`)
8. Is the cheat-sheet section *also* visual? (`NumberLine`, `Memorize`, `Crossword`, `TremorCard` summary tiles)

Aim for 7+ yeses on long guides, 5+ on short ones. Below 4 means the guide will read like a textbook chapter, which is what we are here to replace.

---

## 4. Required structure

The skeleton (also in `welcome.mdx`):

```
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

Required frontmatter: `title`, `description`, `subject`, `estimatedTime`, `date`. Optional: `tags`, `authors` (defaults to `["IHHS"]`), `updated`, `cover`, `categories`, `draft`.

Hero pattern: wrap the lead paragraph in `<VantaBackground>` or `<AuroraBackground>` ABOVE `## Learning objectives`. Add a `<Typewriter>` headline.

---

## 5. My defaults to break

I lean on these too hard: `<Callout>`, `<KeyTerm>`, `<Collapsible>`, `<Quiz>`, `<Flashcards>`, `<TypingQuiz>`, `<RoughNotation>`, `<MindMap>`, `<DragSort>`, `<StepThrough>`. They are good. They are also what every guide already uses.

For the next guide I author, force in **at least three** I have never used (or rarely use):

- `<Cesium>` (real-terrain 3D globe)
- `<Spline>` runtime (designer-built 3D scene)
- AntV G6 (hierarchical graph viz, more advanced than Cytoscape)
- ECharts GL (3D charts and globes)
- `<Choropleth>` / `<Cartogram>` / `<HeatMap>`
- `<Sankey>` / `<NivoStream>` / `<NivoSunburst>`
- `<NetworkGraph>` for any "X connects to Y" prose
- `<NivoCalendar>` / `<CalHeatmap>` for any date-stamped dataset
- `<Memorize>` for any list of 5+ things students must produce cold
- `<Crossword>` for vocab review
- `<DichotomousKey>` for any "classify which type" goal
- `<Hotspots mode="quiz">` for diagram labeling
- `<CompareSlider>` for any before/after image
- `<Panorama360>` for any place students should "stand inside"
- `<Flipbook>` for any primary-source document
- `<Memorize>` for any speech, soliloquy, or numbered list students must recite
- `<MathBox>` for any vector or parametric surface (math/physics only)
- `<Mol*>` (Tier 9) for any biology macromolecule
- `<Niivue>` (Tier 9) for any neuroscience or medical imaging guide

If I default to my old ten without consulting this list, I'm leaving 90% of the catalog on the shelf.

---

## 6. Quick lookup index

- **Full catalog** (Tiers 1 to 10): `LIBRARIES.md`
- **Visual-learner power kit** (newest, Tier 10): Spline runtime, AntV G6, ECharts GL — see `LIBRARIES.md` section 8h
- **Lazy-load helper**: `src/lib/loadScript.ts` (use `mountWhenVisible` for anything below the fold)
- **Storage helpers**: `src/lib/storage.ts`, `srs.ts`, `progress.ts`
- **Auth (hybrid local/Supabase)**: `src/lib/auth.ts`
- **Confetti presets**: `src/lib/confetti.ts` (`burst`, `cannons`, `fireworks`)
- **Color tokens**: `accent-50` through `accent-950` (red), `ink-50` through `ink-950` (neutral)
- **Dark mode detect**: `document.documentElement.classList.contains('dark')`
- **Embedded SVG/canvas color picks**: `#b91c1c` (light) or `#f87171` (dark)

---

## Performance budget

A guide that drags scroll on a school Chromebook is not a finished guide. The infrastructure now lazy-mounts heavy widgets on viewport entry and pauses WebGL render loops while widgets are offscreen, but the budget still matters:

- **At most one full-page WebGL widget** (`<Cesium>` / `<MapLibreView>` / `<Babylon>` / `<R3FScene>` / `<GlobeTheatre3D>` / `<DeckMap>`). Pick the one that earns its weight; use lighter alternatives (`<MapView>` for 2D, `<CobeGlobe>` for a tiny shader-only globe, static images for the rest) elsewhere.
- **At most two `<Particles>` / `<VantaBackground>` fields.** Each one is a full-screen WebGL canvas. Two atmospheres bookend a guide nicely; a third is just heat.
- **At most one auto-playing `<HistoryAnimation>` per screen.** They're cheap individually but they all tick a `setTimeout` scene-advance loop, and on a long page that adds up. If you need three in a row, switch the middle ones to `<StepThrough>`.
- **If you exceed any of these, add `<GuideLoader />` at the top.** The loader hides the first-load jank by warming components in a controlled scroll.
