---
title: Watch Instructions
tags: [infolora, watch, tools]
created: 2026-04-11
---

# Watch Instructions

To auto-regenerate the Obsidian index when markdown files change, use one of these methods:

macOS (fswatch):
- Install: brew install fswatch
- Run: fswatch -o . | xargs -n1 -I{} ./update_index.sh

Cross-platform (entr):
- Install entr (brew install entr or apt)
- Run: ls *.md | entr -r ./update_index.sh

Note: Make update_index.sh executable: chmod +x ./update_index.sh
