/*
  # Fix profiles table INSERT policy

  1. Security Changes
    - Add INSERT policy for profiles table to allow authenticated users to create their own profile
    - Ensure users can only insert profiles with their own user ID

  2. Changes Made
    - Create policy "Users can insert their own profile" for INSERT operations
    - Policy checks that auth.uid() matches the profile id being inserted
*/

-- Create INSERT policy for profiles table
CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);