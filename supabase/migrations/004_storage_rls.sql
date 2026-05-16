-- Storage RLS policies for deal-files bucket
-- Path convention: {user_id}/{deal_id}/{timestamp}-{filename}
-- The first folder segment is always user_id -- enforced by these policies

-- Allow authenticated users to upload files to their own user_id prefix
CREATE POLICY "Users can upload to own prefix"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'deal-files' AND
    auth.role() = 'authenticated' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow authenticated users to read/download their own files
CREATE POLICY "Users can read own files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'deal-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'deal-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
