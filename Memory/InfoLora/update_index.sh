#!/usr/bin/env bash
set -euo pipefail

# regenerate 00-Index.md from existing .md filenames
vault_dir="$(pwd)"
index_file="$vault_dir/00-Index.md"

echo "---" > "$index_file"
echo "title: Index" >> "$index_file"
echo "tags: [infolora, obsidian, index]" >> "$index_file"
echo "created: 2026-04-11" >> "$index_file"
echo "---" >> "$index_file"
echo "" >> "$index_file"
echo "# Index (auto-generated)" >> "$index_file"
echo "" >> "$index_file"
for f in "$vault_dir"/*.md; do
  basename_f="$(basename "$f")"
  if [ "$basename_f" = "00-Index.md" ]; then
    continue
  fi
  name="${basename_f%.md}"
  echo "- [[${name}]]" >> "$index_file"
done

echo "Index regenerated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")" >> "$index_file"
