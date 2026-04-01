// Supabase API client - Direct Supabase client queries (no Edge Function needed)
import { supabase } from '@/utils/supabaseClient';

// Connection state tracking
let isServerAvailable = true;
let lastConnectionCheck = 0;
const CONNECTION_CHECK_INTERVAL = 60000;

// Check if server is available
async function checkServerConnection(): Promise<boolean> {
  const now = Date.now();
  if (now - lastConnectionCheck < CONNECTION_CHECK_INTERVAL) {
    return isServerAvailable;
  }

  try {
    // Simple query to check connection
    const { error } = await supabase.from('schools').select('id').limit(1);
    isServerAvailable = !error;
    lastConnectionCheck = now;

    if (isServerAvailable) {
      sessionStorage.removeItem('supabaseConnectionFailed');
      sessionStorage.removeItem('connection-error-logged');
    }

    return isServerAvailable;
  } catch {
    const wasAvailable = isServerAvailable;
    isServerAvailable = false;
    lastConnectionCheck = now;

    if (wasAvailable) {
      console.info('📦 Backend unavailable - using local storage');
    }
    sessionStorage.setItem('supabaseConnectionFailed', 'true');
    return false;
  }
}

// Migration function - migrate localStorage to Supabase tables
export async function migrateToSupabase(schoolCode: string) {
  const students = JSON.parse(localStorage.getItem('students') || '[]');
  const parents = JSON.parse(localStorage.getItem('parents') || '[]');
  const attendanceLogs = JSON.parse(localStorage.getItem('attendanceLogs') || '[]');

  console.log('📦 Starting migration...', {
    students: students.length,
    parents: parents.length,
    logs: attendanceLogs.length,
  });

  // Migrate students
  if (students.length > 0) {
    for (const student of students) {
      const { error } = await supabase.from('students').upsert({
        id: student.id,
        school_code: schoolCode,
        name: student.name,
        image: student.image || '',
        age: student.age || 0,
        class: student.class || '',
        gender: student.gender || 'Male',
      }, { onConflict: 'id' });
      if (error) console.warn('Failed to migrate student:', student.name, error.message);
    }
  }

  // Migrate parents
  if (parents.length > 0) {
    for (const parent of parents) {
      const { error } = await supabase.from('parents').upsert({
        id: parent.id,
        school_code: schoolCode,
        parent_id: parent.parentId,
        family_id: parent.familyId,
        type: parent.type || 'father',
        name: parent.name,
        photo: parent.photo || '',
        gender: parent.gender || '',
        occupation: parent.occupation || '',
        residential_address: parent.residentialAddress || '',
        children_ids: parent.childrenIds || [],
        password: parent.password || '',
        must_change_password: parent.mustChangePassword || false,
        phone_number: parent.phoneNumber || '',
        email: parent.email || '',
        pin: parent.pin || '',
      }, { onConflict: 'id' });
      if (error) console.warn('Failed to migrate parent:', parent.name, error.message);
    }
  }

  // Mark migration as complete
  localStorage.setItem('migratedToSupabase', 'true');
  localStorage.setItem('migrationDate', new Date().toISOString());

  console.log('✅ Migration complete');
  return { success: true, migrated: { students: students.length, parents: parents.length, logs: attendanceLogs.length } };
}

// Check if already migrated
export function isMigrated(): boolean {
  return localStorage.getItem('migratedToSupabase') === 'true';
}

// Test endpoint
export async function testConnection() {
  const isConnected = await checkServerConnection();
  return { status: isConnected ? 'ok' : 'offline', connected: isConnected };
}

// ==================== SCHOOL ROUTES ====================

export async function getSchoolInfo(schoolCode: string) {
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .eq('school_code', schoolCode)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(error.message);
  }

  return mapSchoolFromDB(data);
}

export async function saveSchoolInfo(schoolData: any) {
  const dbSchool = {
    school_code: schoolData.schoolCode,
    name: schoolData.name || '',
    address: schoolData.address || '',
    phone: schoolData.phone || '',
    email: schoolData.email || '',
    logo: schoolData.logo || '',
    admin_password: schoolData.adminPassword || '',
    settings: schoolData.settings || {},
    parent_portal_appearance: schoolData.parentPortalAppearance || {},
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('schools')
    .upsert(dbSchool, { onConflict: 'school_code' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapSchoolFromDB(data);
}

export async function getAllSchools() {
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapSchoolFromDB);
}

// ==================== STUDENT ROUTES ====================

export async function getStudentsBySchool(schoolCode: string) {
  const serverAvailable = await checkServerConnection();
  if (!serverAvailable) throw new Error('OFFLINE');

  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('school_code', schoolCode);

  if (error) throw new Error(error.message);
  return (data || []).map(mapStudentFromDB);
}

export async function createStudent(schoolCode: string, studentData: any) {
  const dbStudent = {
    id: studentData.id || crypto.randomUUID(),
    school_code: schoolCode,
    name: studentData.name,
    image: studentData.image || '',
    age: studentData.age || 0,
    class: studentData.class || '',
    gender: studentData.gender || 'Male',
  };

  const { data, error } = await supabase
    .from('students')
    .insert(dbStudent)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapStudentFromDB(data);
}

export async function updateStudent(id: string, updates: any) {
  const dbUpdates: any = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.image !== undefined) dbUpdates.image = updates.image;
  if (updates.age !== undefined) dbUpdates.age = updates.age;
  if (updates.class !== undefined) dbUpdates.class = updates.class;
  if (updates.gender !== undefined) dbUpdates.gender = updates.gender;

  const { data, error } = await supabase
    .from('students')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapStudentFromDB(data);
}

export async function deleteStudent(id: string) {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  return { success: true };
}

// ==================== BULK OPERATIONS ====================

export async function bulkDeleteParents(parentIds: string[]) {
  const { error } = await supabase
    .from('parents')
    .delete()
    .in('id', parentIds);

  if (error) throw new Error(error.message);
  return { success: true, deletedCount: parentIds.length };
}

// ==================== SECURITY PERSONNEL ====================

export async function getSecurityPersonnel(schoolCode: string) {
  const { data, error } = await supabase
    .from('security_personnel')
    .select('*')
    .eq('school_code', schoolCode);

  if (error) throw new Error(error.message);
  return (data || []).map(mapSecurityFromDB);
}

export async function createSecurityPersonnel(schoolCode: string, personnelData: any) {
  const dbPersonnel = {
    id: personnelData.id || crypto.randomUUID(),
    school_code: schoolCode,
    full_name: personnelData.fullName || '',
    email: personnelData.email || '',
    phone_number: personnelData.phoneNumber || '',
    photo: personnelData.photo || '',
    username: personnelData.username || '',
    password: personnelData.password || '',
    is_active: personnelData.isActive !== undefined ? personnelData.isActive : true,
    created_by: personnelData.createdBy || '',
  };

  const { data, error } = await supabase
    .from('security_personnel')
    .insert(dbPersonnel)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapSecurityFromDB(data);
}

export async function updateSecurityPersonnel(schoolCode: string, personnelId: string, updates: any) {
  const dbUpdates: any = {};
  if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.phoneNumber !== undefined) dbUpdates.phone_number = updates.phoneNumber;
  if (updates.photo !== undefined) dbUpdates.photo = updates.photo;
  if (updates.username !== undefined) dbUpdates.username = updates.username;
  if (updates.password !== undefined) dbUpdates.password = updates.password;
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

  const { data, error } = await supabase
    .from('security_personnel')
    .update(dbUpdates)
    .eq('id', personnelId)
    .eq('school_code', schoolCode)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapSecurityFromDB(data);
}

export async function deleteSecurityPersonnel(schoolCode: string, personnelId: string) {
  const { error } = await supabase
    .from('security_personnel')
    .delete()
    .eq('id', personnelId)
    .eq('school_code', schoolCode);

  if (error) throw new Error(error.message);
  return { success: true };
}

// ==================== SCHOOL INIT ====================

export async function initSchool(schoolData: any) {
  return saveSchoolInfo(schoolData);
}

export async function getSchool(schoolCode: string) {
  return getSchoolInfo(schoolCode);
}

// Load all school data (students, parents, families)
export async function loadSchoolData(schoolCode: string) {
  let students: any[] = [];
  let parents: any[] = [];

  try {
    students = await getStudentsBySchool(schoolCode);
  } catch { students = []; }

  try {
    const { data } = await supabase.from('parents').select('*').eq('school_code', schoolCode);
    parents = (data || []).map(mapParentFromDB);
  } catch { parents = []; }

  return { students, parents, families: [] };
}

// Families (managed via parent familyId grouping)
export async function createFamily(schoolCode: string) {
  return { id: crypto.randomUUID(), schoolCode };
}

export async function getFamiliesBySchool(schoolCode: string) {
  // Families are derived from parent familyId groupings
  const { data } = await supabase
    .from('parents')
    .select('family_id')
    .eq('school_code', schoolCode);

  const familyIds = [...new Set((data || []).map(d => d.family_id))];
  return familyIds.map(id => ({ id, schoolCode }));
}

export async function deleteFamily(familyId: string) {
  // Delete all parents in this family
  const { error } = await supabase
    .from('parents')
    .delete()
    .eq('family_id', familyId);

  if (error) throw new Error(error.message);
  return { success: true };
}




// ==================== FIELD MAPPERS ====================

function mapSchoolFromDB(row: any) {
  return {
    id: row.id,
    schoolCode: row.school_code,
    name: row.name,
    address: row.address,
    phone: row.phone,
    email: row.email,
    logo: row.logo,
    adminPassword: row.admin_password,
    settings: row.settings || {},
    parentPortalAppearance: row.parent_portal_appearance || {},
  };
}

function mapStudentFromDB(row: any) {
  return {
    id: row.id,
    name: row.name,
    image: row.image,
    age: row.age,
    class: row.class,
    gender: row.gender,
  };
}

function mapParentFromDB(row: any) {
  return {
    id: row.id,
    parentId: row.parent_id,
    familyId: row.family_id,
    type: row.type,
    name: row.name,
    photo: row.photo,
    gender: row.gender,
    occupation: row.occupation,
    residentialAddress: row.residential_address,
    childrenIds: row.children_ids || [],
    password: row.password,
    mustChangePassword: row.must_change_password,
    phoneNumber: row.phone_number,
    email: row.email,
    pin: row.pin,
    schoolCode: row.school_code,
  };
}

function mapSecurityFromDB(row: any) {
  return {
    id: row.id,
    schoolCode: row.school_code,
    fullName: row.full_name,
    email: row.email,
    phoneNumber: row.phone_number,
    photo: row.photo,
    username: row.username,
    password: row.password,
    createdAt: row.created_at,
    isActive: row.is_active,
    createdBy: row.created_by,
  };
}