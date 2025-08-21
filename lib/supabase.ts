import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

// Check if environment variables are properly configured (not placeholders)
const isValidUrl = (url: string | undefined): boolean => {
  if (!url || url.includes('your_supabase_project_url_here') || url.includes('placeholder')) {
    return false;
  }
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const isValidKey = (key: string | undefined): boolean => {
  return !!(key && !key.includes('your_supabase_anon_key_here') && !key.includes('placeholder') && key.length > 20);
};

// Declare exports at top level
export let supabase: ReturnType<typeof createClient>;
export let supabaseAdmin: ReturnType<typeof createClient>;

if (!isValidUrl(supabaseUrl) || !isValidKey(supabaseAnonKey)) {
  console.error('⚠️  Supabase configuration missing or invalid. Please update your .env file with actual Supabase credentials.');
  console.error('Required environment variables:');
  console.error('- EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
  console.error('- EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
  console.error('- EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (for admin functions)');
  
  // Create dummy clients to prevent app crashes during development
  const dummyUrl = 'https://dummy.supabase.co';
  const dummyKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1bW15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.dummy';
  
  supabase = createClient(dummyUrl, dummyKey);
  supabaseAdmin = supabase;
} else {
  supabase = createClient(supabaseUrl!, supabaseAnonKey!);
  supabaseAdmin = supabaseServiceKey && isValidKey(supabaseServiceKey)
    ? createClient(supabaseUrl!, supabaseServiceKey)
    : supabase;
    
  // Log admin client status for debugging
  if (supabaseServiceKey && isValidKey(supabaseServiceKey)) {
    console.log('✅ Admin client configured with service role key');
  } else {
    console.warn('⚠️  Admin client using anon key - some admin functions may not work');
  }
}


export type Profile = {
  id: string;
  username: string;
  role: 'user' | 'admin';
  avatar_url?: string;
  age?: number;
  bio?: string;
  created_at: string;
  updated_at: string;
};

export type NewsItem = {
  id: string;
  title: string;
  content: string;
  description?: string;
  image_url?: string;
  video_url?: string;
  author_id?: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
};

export type LeaderboardEntry = {
  id: string;
  team_name: string;
  rank: number;
  points: number;
  created_at: string;
  updated_at: string;
};

export type TopPlayer = {
  id: string;
  player_name: string;
  team_name: string;
  position: string;
  mvp_points: number;
  created_at: string;
  updated_at: string;
};

export type SpecialAward = {
  id: string;
  award_type: 'player_of_week' | 'player_of_month' | 'leader_of_week';
  user_id?: string;
  title: string;
  description: string;
  image_url?: string;
  week_number?: number;
  month_number?: number;
  year: number;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'news' | 'award' | 'leaderboard';
  read: boolean;
  created_at: string;
};