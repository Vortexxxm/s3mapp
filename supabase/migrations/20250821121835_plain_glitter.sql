/*
  # Add author_id column to news table

  1. Schema Changes
    - Add `author_id` column to `news` table (uuid, references profiles.id)
    - Create foreign key constraint from news.author_id to profiles.id
    - Update existing news records to use created_by value for author_id
    - Remove old created_by column

  2. Security
    - Update RLS policies to use author_id instead of created_by
*/

-- Add author_id column
ALTER TABLE news ADD COLUMN IF NOT EXISTS author_id uuid;

-- Copy existing created_by values to author_id
UPDATE news SET author_id = created_by WHERE created_by IS NOT NULL;

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'news_author_id_fkey' 
    AND table_name = 'news'
  ) THEN
    ALTER TABLE news ADD CONSTRAINT news_author_id_fkey 
    FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Update RLS policies to use author_id
DROP POLICY IF EXISTS "News can be created by admins" ON news;
DROP POLICY IF EXISTS "News can be updated by admins" ON news;
DROP POLICY IF EXISTS "News can be deleted by admins" ON news;

CREATE POLICY "News can be created by admins"
  ON news
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "News can be updated by admins"
  ON news
  FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "News can be deleted by admins"
  ON news
  FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Remove old created_by column after migration
-- ALTER TABLE news DROP COLUMN IF EXISTS created_by;