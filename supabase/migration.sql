-- ============================================
-- Clocka Database Migration
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/anxljfruffcsvwalhosu/sql
-- ============================================

-- 1. Schools table
CREATE TABLE IF NOT EXISTS schools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  logo TEXT DEFAULT '',
  admin_password TEXT DEFAULT '',
  settings JSONB DEFAULT '{}',
  parent_portal_appearance JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Students table
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  school_code TEXT NOT NULL,
  name TEXT NOT NULL,
  image TEXT DEFAULT '',
  age INTEGER DEFAULT 0,
  class TEXT DEFAULT '',
  gender TEXT DEFAULT 'Male',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_students_school ON students(school_code);

-- 3. Parents table
CREATE TABLE IF NOT EXISTS parents (
  id TEXT PRIMARY KEY,
  school_code TEXT NOT NULL,
  parent_id TEXT NOT NULL,
  family_id TEXT NOT NULL,
  type TEXT DEFAULT 'father',
  name TEXT NOT NULL DEFAULT '',
  photo TEXT DEFAULT '',
  gender TEXT DEFAULT '',
  occupation TEXT DEFAULT '',
  residential_address TEXT DEFAULT '',
  children_ids JSONB DEFAULT '[]',
  password TEXT DEFAULT '',
  must_change_password BOOLEAN DEFAULT false,
  phone_number TEXT DEFAULT '',
  email TEXT DEFAULT '',
  pin TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_parents_school ON parents(school_code);
CREATE INDEX IF NOT EXISTS idx_parents_parent_id ON parents(parent_id);
CREATE INDEX IF NOT EXISTS idx_parents_family_id ON parents(family_id);

-- 4. Attendance logs table
CREATE TABLE IF NOT EXISTS attendance_logs (
  id TEXT PRIMARY KEY,
  school_code TEXT NOT NULL,
  parent_id TEXT DEFAULT '',
  parent_name TEXT DEFAULT '',
  parent_photo TEXT DEFAULT '',
  children_ids JSONB DEFAULT '[]',
  children_names JSONB DEFAULT '[]',
  type TEXT NOT NULL DEFAULT 'clock-in',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  assignee_id TEXT DEFAULT '',
  assignee_name TEXT DEFAULT '',
  assignee_photo TEXT DEFAULT '',
  assigned_by TEXT DEFAULT '',
  assigned_by_name TEXT DEFAULT '',
  assigned_by_photo TEXT DEFAULT '',
  face_image TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_attendance_school ON attendance_logs(school_code);
CREATE INDEX IF NOT EXISTS idx_attendance_parent ON attendance_logs(parent_id);

-- 5. Child addition requests table
CREATE TABLE IF NOT EXISTS child_addition_requests (
  id TEXT PRIMARY KEY,
  school_code TEXT NOT NULL,
  parent_id TEXT DEFAULT '',
  parent_name TEXT DEFAULT '',
  parent_phone TEXT DEFAULT '',
  parent_email TEXT DEFAULT '',
  parent_type TEXT DEFAULT 'father',
  student_id TEXT DEFAULT '',
  student_name TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  request_date TIMESTAMPTZ DEFAULT NOW(),
  review_date TIMESTAMPTZ,
  reviewed_by TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_child_requests_school ON child_addition_requests(school_code);

-- 6. Assignees table
CREATE TABLE IF NOT EXISTS assignees (
  id TEXT PRIMARY KEY,
  school_code TEXT NOT NULL,
  parent_id TEXT DEFAULT '',
  parent_name TEXT DEFAULT '',
  parent_email TEXT DEFAULT '',
  parent_phone TEXT DEFAULT '',
  parent_photo TEXT DEFAULT '',
  family_id TEXT DEFAULT '',
  children_ids JSONB DEFAULT '[]',
  full_name TEXT DEFAULT '',
  photo TEXT DEFAULT '',
  phone_number TEXT DEFAULT '',
  id_type TEXT DEFAULT 'NIN',
  id_number TEXT DEFAULT '',
  id_photo TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  access_code TEXT DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_assignees_school ON assignees(school_code);
CREATE INDEX IF NOT EXISTS idx_assignees_access_code ON assignees(access_code);
CREATE INDEX IF NOT EXISTS idx_assignees_family ON assignees(family_id);

-- 7. Security personnel table
CREATE TABLE IF NOT EXISTS security_personnel (
  id TEXT PRIMARY KEY,
  school_code TEXT NOT NULL,
  full_name TEXT DEFAULT '',
  email TEXT DEFAULT '',
  phone_number TEXT DEFAULT '',
  photo TEXT DEFAULT '',
  username TEXT DEFAULT '',
  password TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_by TEXT DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_security_school ON security_personnel(school_code);

-- 8. Classes table
CREATE TABLE IF NOT EXISTS school_classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_code TEXT UNIQUE NOT NULL,
  selected_classes JSONB DEFAULT '[]',
  custom_classes JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_classes_school ON school_classes(school_code);

-- ============================================
-- Row Level Security (RLS) - Allow all access via anon key
-- ============================================

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_addition_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_classes ENABLE ROW LEVEL SECURITY;

-- Allow full access for anon role (the app handles auth internally)
CREATE POLICY "Allow all access" ON schools FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON parents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON attendance_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON child_addition_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON assignees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON security_personnel FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON school_classes FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Enable Realtime for all tables
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE students;
ALTER PUBLICATION supabase_realtime ADD TABLE parents;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE child_addition_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE assignees;
ALTER PUBLICATION supabase_realtime ADD TABLE security_personnel;
ALTER PUBLICATION supabase_realtime ADD TABLE schools;
ALTER PUBLICATION supabase_realtime ADD TABLE school_classes;
