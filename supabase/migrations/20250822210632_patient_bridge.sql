/*
  # Enhanced Special Awards Management

  1. New Features
    - Add comprehensive special awards management
    - Support for weekly and monthly awards
    - Enhanced award tracking with better metadata
    
  2. Security
    - Maintain existing RLS policies
    - Ensure proper admin access controls
    
  3. Enhancements
    - Better award categorization
    - Improved tracking for award periods
*/

-- Add any missing columns to special_awards table if they don't exist
DO $$
BEGIN
  -- Check and add week_number column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'special_awards' AND column_name = 'week_number'
  ) THEN
    ALTER TABLE special_awards ADD COLUMN week_number integer;
  END IF;

  -- Check and add month_number column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'special_awards' AND column_name = 'month_number'
  ) THEN
    ALTER TABLE special_awards ADD COLUMN month_number integer;
  END IF;

  -- Check and add year column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'special_awards' AND column_name = 'year'
  ) THEN
    ALTER TABLE special_awards ADD COLUMN year integer DEFAULT EXTRACT(year FROM now());
  END IF;
END $$;

-- Create index for better performance on award queries
CREATE INDEX IF NOT EXISTS idx_special_awards_period 
ON special_awards(award_type, year, week_number, month_number);

-- Create index for user awards
CREATE INDEX IF NOT EXISTS idx_special_awards_user 
ON special_awards(user_id, award_type);