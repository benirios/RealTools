-- 006_notes_content_column.sql
-- Rename notes.body → notes.content to match plan conventions,
-- and add updated_at for inline-edit tracking.
-- The plan's note-actions.ts and note-item.tsx expect "content" and "updated_at".

ALTER TABLE notes RENAME COLUMN body TO content;

ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
