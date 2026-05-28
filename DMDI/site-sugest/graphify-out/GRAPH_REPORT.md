# Graph Report - .  (2026-05-09)

## Corpus Check
- 4 files · ~464,216 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 27 nodes · 38 edges · 4 communities detected
- Extraction: 79% EXTRACTED · 21% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_3D Scroll Engine|3D Scroll Engine]]
- [[_COMMUNITY_Brand Content & CTA|Brand Content & CTA]]
- [[_COMMUNITY_DMDI Brand Identity|DMDI Brand Identity]]
- [[_COMMUNITY_Navigation & Logo|Navigation & Logo]]

## God Nodes (most connected - your core abstractions)
1. `Scroll Animation Controller` - 10 edges
2. `DMDI Eyewear` - 5 edges
3. `Hero Section` - 5 edges
4. `Navigation Bar (Liquid Glass Nav)` - 4 edges
5. `Scroll-driven Video Texture (scroll_glasses.mp4)` - 4 edges
6. `Custom GLSL ShaderMaterial` - 4 edges
7. `Brand Color Palette (gold, navy, cream)` - 4 edges
8. `WebGL Canvas (Three.js)` - 3 edges
9. `End Card Section (CTA)` - 3 edges
10. `Typography System (Cormorant Garamond + Inter)` - 3 edges

## Surprising Connections (you probably didn't know these)
- `Existing DMDI Website Homepage (Screenshot)` --references--> `DMDI Eyewear`  [EXTRACTED]
  context/Captura de Tela 2026-05-09 às 01.22.41.png → index.html
- `Sobre o Grupo DMDI — Brand History (Since 1998)` --references--> `DMDI Eyewear`  [EXTRACTED]
  context/Captura de Tela 2026-05-09 às 01.22.49.png → index.html
- `Existing DMDI Website Homepage (Screenshot)` --references--> `Navigation Links (Início, Sobre Nós, Marcas, Lentes Oftálmicas, Contactos)`  [EXTRACTED]
  context/Captura de Tela 2026-05-09 às 01.22.41.png → index.html

## Hyperedges (group relationships)
- **Scroll-driven 3D Experience Pipeline** — dmdi_scroll_animation, dmdi_video_texture, dmdi_shader_material, dmdi_gl_canvas, dmdi_threejs_lib [EXTRACTED 1.00]
- **Brand Visual Identity System** — dmdi_color_palette, dmdi_typography, dmdi_logo, dmdi_shimmer_animation [INFERRED 0.85]
- **All Page Sections (scroll narrative)** — dmdi_hero_section, dmdi_mid_text_left, dmdi_mid_text_right, dmdi_end_card, dmdi_scroll_hint, dmdi_progress_bar [EXTRACTED 1.00]
- **Existing Site Reference Screenshots** — dmdi_existing_site_homepage, dmdi_existing_site_about, dmdi_sobre_grupo, dmdi_instagram_section [EXTRACTED 1.00]

## Communities

### Community 0 - "3D Scroll Engine"
Cohesion: 0.31
Nodes (10): WebGL Canvas (Three.js), Lens Zoom Effect (30x zoom into lens center), Scroll Progress Bar, Rationale: Scroll-driven Storytelling Design, Scroll Animation Controller, Scroll Hint UI Element, Custom GLSL ShaderMaterial, Three.js r134 Library (+2 more)

### Community 1 - "Brand Content & CTA"
Cohesion: 0.47
Nodes (6): Coleção 2025, Brand Color Palette (gold, navy, cream), End Card Section (CTA), Hero Section, Rationale: Luxury Minimalist Aesthetic, Typography System (Cormorant Garamond + Inter)

### Community 2 - "DMDI Brand Identity"
Cohesion: 0.33
Nodes (6): Existing DMDI Website About/Instagram Section (Screenshot), DMDI Eyewear, Instagram Section (@grupo_dmdi), Mid-scroll Narrative Left (Design sem compromisso), Mid-scroll Narrative Right (Materiais que duram gerações), Sobre o Grupo DMDI — Brand History (Since 1998)

### Community 3 - "Navigation & Logo"
Cohesion: 0.4
Nodes (5): Existing DMDI Website Homepage (Screenshot), DMDI Logo Image, Navigation Bar (Liquid Glass Nav), Navigation Links (Início, Sobre Nós, Marcas, Lentes Oftálmicas, Contactos), Gold Shimmer Animation on Nav

## Knowledge Gaps
- **6 isolated node(s):** `Coleção 2025`, `Scroll Hint UI Element`, `Scroll Progress Bar`, `Three.js r134 Library`, `DMDI Logo Image` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Scroll Animation Controller` connect `3D Scroll Engine` to `Brand Content & CTA`, `DMDI Brand Identity`?**
  _High betweenness centrality (0.571) - this node is a cross-community bridge._
- **Why does `Hero Section` connect `Brand Content & CTA` to `3D Scroll Engine`, `DMDI Brand Identity`?**
  _High betweenness centrality (0.332) - this node is a cross-community bridge._
- **Why does `DMDI Eyewear` connect `DMDI Brand Identity` to `Brand Content & CTA`, `Navigation & Logo`?**
  _High betweenness centrality (0.315) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `DMDI Eyewear` (e.g. with `Mid-scroll Narrative Left (Design sem compromisso)` and `Mid-scroll Narrative Right (Materiais que duram gerações)`) actually correct?**
  _`DMDI Eyewear` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Coleção 2025`, `Scroll Hint UI Element`, `Scroll Progress Bar` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._