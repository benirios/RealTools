#!/usr/bin/env bash
set -euo pipefail

vault_dir="$(cd "$(dirname "$0")" && pwd)"
index_script="$vault_dir/update_index.sh"
snapshot_file="$vault_dir/.md_snapshot"
log_file="$vault_dir/watch.log"

trap 'echo "Stopping md watcher at $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$log_file"; exit 0' SIGINT SIGTERM

echo "Starting md watcher at $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$log_file"

# initialize snapshot
ls "$vault_dir"/*.md 2>/dev/null | sort > "$snapshot_file" || true

while true; do
  sleep 2
  ls "$vault_dir"/*.md 2>/dev/null | sort > "$vault_dir/.md_snapshot_new" || true
  if ! cmp -s "$snapshot_file" "$vault_dir/.md_snapshot_new"; then
    mv "$vault_dir/.md_snapshot_new" "$snapshot_file"
    echo "Change detected at $(date -u +%Y-%m-%dT%H:%M:%SZ), regenerating index" >> "$log_file"
    if ! "$index_script" >> "$log_file" 2>&1; then
      echo "update_index.sh failed at $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$log_file"
    fi
  else
    rm -f "$vault_dir/.md_snapshot_new"
  fi
done
