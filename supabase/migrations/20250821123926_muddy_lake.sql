/*
  # إنشاء جدول طلبات الانضمام للكلان

  1. جداول جديدة
    - `clan_join_requests`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `free_fire_username` (text, اسم المستخدم في فري فاير)
      - `age` (integer, العمر)
      - `reason` (text, سبب الانضمام)
      - `status` (text, حالة الطلب: pending/approved/rejected)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. الأمان
    - تفعيل RLS على جدول `clan_join_requests`
    - إضافة سياسات للمستخدمين لإنشاء طلباتهم الخاصة
    - إضافة سياسات للمشرفين لعرض وإدارة جميع الطلبات
*/

CREATE TABLE IF NOT EXISTS clan_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  free_fire_username text NOT NULL,
  age integer NOT NULL,
  reason text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clan_join_requests ENABLE ROW LEVEL SECURITY;

-- المستخدمون يمكنهم إنشاء طلباتهم الخاصة
CREATE POLICY "Users can create their own join requests"
  ON clan_join_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- المستخدمون يمكنهم عرض طلباتهم الخاصة
CREATE POLICY "Users can view their own join requests"
  ON clan_join_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- المشرفون يمكنهم عرض جميع الطلبات
CREATE POLICY "Admins can view all join requests"
  ON clan_join_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- المشرفون يمكنهم تحديث جميع الطلبات
CREATE POLICY "Admins can update all join requests"
  ON clan_join_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- إضافة trigger لتحديث updated_at
CREATE TRIGGER update_clan_join_requests_updated_at
  BEFORE UPDATE ON clan_join_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();