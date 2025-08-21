import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Profile = {
  id: string;
  username: string;
  role: 'user' | 'admin';
  avatar_url?: string;
  created_at: string;
};

export type NewsItem = {
  id: string;
  title: string;
  content: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
};

export type LeaderboardEntry = {
  id: string;
  user_id: string;
  rank: number;
  points: number;
  updated_at: string;
  profiles?: Profile;
};

export type TopPlayer = {
  id: string;
  user_id: string;
  mvp_points: number;
  position: number;
  updated_at: string;
  profiles?: Profile;
};