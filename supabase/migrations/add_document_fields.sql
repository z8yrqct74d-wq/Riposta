-- Run in Supabase Dashboard → SQL Editor → New query
-- Adds document metadata columns to members and sets up storage bucket

ALTER TABLE members ADD COLUMN IF NOT EXISTS medical_cert_url               text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS medical_cert_issue_date        date;
ALTER TABLE members ADD COLUMN IF NOT EXISTS medical_cert_expiry_date       date;
ALTER TABLE members ADD COLUMN IF NOT EXISTS federation_licence_number      text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS federation_licence_url         text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS federation_licence_issue_date  date;
ALTER TABLE members ADD COLUMN IF NOT EXISTS federation_licence_expiry_date date;

-- Storage bucket for member documents (public reads, open writes for prototype)
INSERT INTO storage.buckets (id, name, public)
VALUES ('member-docs', 'member-docs', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'member_docs_select') THEN
    CREATE POLICY "member_docs_select" ON storage.objects FOR SELECT USING (bucket_id = 'member-docs');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'member_docs_insert') THEN
    CREATE POLICY "member_docs_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'member-docs');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'member_docs_update') THEN
    CREATE POLICY "member_docs_update" ON storage.objects FOR UPDATE USING (bucket_id = 'member-docs');
  END IF;
END $$;
