---
title: README
tags: [infolora, readme]
created: 2026-04-11
---

# Infolora Backend (prototype)

This repository contains the backend skeleton for Infolora: a simple Express server, Obsidian notes, and helper scripts to manage the vault index.

Quickstart

1. Install dependencies: npm install
2. Start server: npm start
3. Run simulator (when implemented) to POST TTN-like payloads to http://localhost:3000/api/temperatures/webhook

Notes

- Regenerate Obsidian index: ./update_index.sh
- Watcher (watch_md.sh) runs in background to auto-regenerate the index when .md files change.
