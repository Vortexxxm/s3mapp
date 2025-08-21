/*
  # Add description field to news table

  1. Changes
    - Add `description` column to `news` table for short descriptions in news feed
    - Column is optional (nullable) to maintain compatibility with existing data
    - Add default empty string for consistency

  2. Security
    - No changes to existing RLS policies
    - Maintains all existing permissions and constraints
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'news' AND column_name = 'description'
  ) THEN
    ALTER TABLE news ADD COLUMN description text DEFAULT '';
  END IF;
END $$;