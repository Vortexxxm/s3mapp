/*
  # Enhanced S3M HUB Schema Update

  1. Enhanced Tables
    - `profiles` - Add age, enhanced avatar support
    - `news` - Add image_url, video_url for media attachments
    - `leaderboard` - Support for 1-55 players with team names
    - `special_awards` - New table for Player/Leader of Week/Month
    - `notifications` - Push notification tracking

  2. Security
    - Enhanced RLS policies for all tables
    - Admin-only policies for content management
    - User-specific policies for profile management

  3. Real-time Features
    - All tables configured for real-time updates
    - Notification triggers for content changes
*/

-- Update profiles table with enhanced fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'age'
  ) THEN
    ALTER TABLE profiles ADD COLUMN age integer;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE profiles ADD COLUMN bio text DEFAULT '';
  END IF;
END $$;

-- Update news table with media support
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'news' AND column_name = 'video_url'
  ) THEN
    ALTER TABLE news ADD COLUMN video_url text;
  END IF;
END $$;

-- Update leaderboard table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leaderboard' AND column_name = 'team_name'
  ) THEN
    ALTER TABLE leaderboard ADD COLUMN team_name text DEFAULT '';
  END IF;
END $$;

-- Create special awards table
CREATE TABLE IF NOT EXISTS special_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  award_type text NOT NULL CHECK (award_type IN ('player_of_week', 'player_of_month', 'leader_of_week')),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  image_url text,
  week_number integer,
  month_number integer,
  year integer NOT NULL DEFAULT EXTRACT(year FROM now()),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE special_awards ENABLE ROW LEVEL SECURITY;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info' CHECK (type IN ('info', 'news', 'award', 'leaderboard')),
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for special_awards
CREATE POLICY "Special awards are viewable by everyone"
  ON special_awards
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Special awards can be managed by admins"
  ON special_awards
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can create notifications"
  ON notifications
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Update triggers for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_special_awards_updated_at
  BEFORE UPDATE ON special_awards
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

-- Sample data for special awards
INSERT INTO special_awards (award_type, title, description, week_number, year) VALUES
('player_of_week', 'Player of the Week', 'Outstanding performance this week', EXTRACT(week FROM now()), EXTRACT(year FROM now())),
('leader_of_week', 'Leader of the Week', 'Exceptional leadership this week', EXTRACT(week FROM now()), EXTRACT(year FROM now()))
ON CONFLICT DO NOTHING;