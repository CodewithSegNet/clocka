// Parent API - Direct Supabase client queries (no Edge Function needed)
import { supabase } from '@/utils/supabaseClient';

// ==================== PARENT API ====================

export async function getParentsBySchool(schoolCode: string) {
  const { data, error } = await supabase
    .from('parents')
    .select('*')
    .eq('school_code', schoolCode);

  if (error) throw new Error(error.message);

  // Map snake_case DB fields to camelCase for frontend
  return (data || []).map(mapParentFromDB);
}

export async function createParent(schoolCode: string, parent: any) {
  const dbParent = {
    id: parent.id,
    school_code: schoolCode,
    parent_id: parent.parentId,
    family_id: parent.familyId,
    type: parent.type || 'father',
    name: parent.name || '',
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
  };

  const { data, error } = await supabase
    .from('parents')
    .insert(dbParent)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapParentFromDB(data);
}

export async function updateParent(parentId: string, updates: any) {
  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.photo !== undefined) dbUpdates.photo = updates.photo;
  if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
  if (updates.occupation !== undefined) dbUpdates.occupation = updates.occupation;
  if (updates.residentialAddress !== undefined) dbUpdates.residential_address = updates.residentialAddress;
  if (updates.childrenIds !== undefined) dbUpdates.children_ids = updates.childrenIds;
  if (updates.password !== undefined) dbUpdates.password = updates.password;
  if (updates.mustChangePassword !== undefined) dbUpdates.must_change_password = updates.mustChangePassword;
  if (updates.phoneNumber !== undefined) dbUpdates.phone_number = updates.phoneNumber;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.pin !== undefined) dbUpdates.pin = updates.pin;
  if (updates.type !== undefined) dbUpdates.type = updates.type;
  if (updates.familyId !== undefined) dbUpdates.family_id = updates.familyId;
  dbUpdates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('parents')
    .update(dbUpdates)
    .eq('id', parentId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapParentFromDB(data);
}

export async function deleteParent(parentId: string) {
  const { error } = await supabase
    .from('parents')
    .delete()
    .eq('id', parentId);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function loginParent(schoolCode: string, parentId: string, pin: string) {
  const { data, error } = await supabase
    .from('parents')
    .select('*')
    .eq('school_code', schoolCode)
    .eq('parent_id', parentId)
    .eq('pin', pin)
    .single();

  if (error) throw new Error('Invalid credentials');
  return mapParentFromDB(data);
}

// ==================== ATTENDANCE LOG API ====================

export async function getAttendanceLogsBySchool(schoolCode: string) {
  const { data, error } = await supabase
    .from('attendance_logs')
    .select('*')
    .eq('school_code', schoolCode)
    .order('timestamp', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapAttendanceLogFromDB);
}

export async function createAttendanceLog(schoolCode: string, log: any) {
  const dbLog = {
    id: log.id || crypto.randomUUID(),
    school_code: schoolCode,
    parent_id: log.parentId || '',
    parent_name: log.parentName || '',
    parent_photo: log.parentPhoto || '',
    children_ids: log.childrenIds || [],
    children_names: log.childrenNames || [],
    type: log.type || 'clock-in',
    timestamp: log.timestamp || new Date().toISOString(),
    assignee_id: log.assigneeId || '',
    assignee_name: log.assigneeName || '',
    assignee_photo: log.assigneePhoto || '',
    assigned_by: log.assignedBy || '',
    assigned_by_name: log.assignedByName || '',
    assigned_by_photo: log.assignedByPhoto || '',
    face_image: log.faceImage || '',
  };

  const { data, error } = await supabase
    .from('attendance_logs')
    .insert(dbLog)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapAttendanceLogFromDB(data);
}

// ==================== CHILD ADDITION REQUEST API ====================

export async function getChildRequestsBySchool(schoolCode: string) {
  const { data, error } = await supabase
    .from('child_addition_requests')
    .select('*')
    .eq('school_code', schoolCode)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapChildRequestFromDB);
}

export async function createChildRequest(schoolCode: string, request: any) {
  const dbRequest = {
    id: request.id || crypto.randomUUID(),
    school_code: schoolCode,
    parent_id: request.parentId || '',
    parent_name: request.parentName || '',
    parent_phone: request.parentPhone || '',
    parent_email: request.parentEmail || '',
    parent_type: request.parentType || 'father',
    student_id: request.studentId || '',
    student_name: request.studentName || '',
    status: request.status || 'pending',
    request_date: request.requestDate || new Date().toISOString(),
    review_date: request.reviewDate || null,
    reviewed_by: request.reviewedBy || '',
    notes: request.notes || '',
  };

  const { data, error } = await supabase
    .from('child_addition_requests')
    .insert(dbRequest)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapChildRequestFromDB(data);
}

export async function updateChildRequest(requestId: string, updates: any) {
  const dbUpdates: any = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.reviewDate !== undefined) dbUpdates.review_date = updates.reviewDate;
  if (updates.reviewedBy !== undefined) dbUpdates.reviewed_by = updates.reviewedBy;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

  const { data, error } = await supabase
    .from('child_addition_requests')
    .update(dbUpdates)
    .eq('id', requestId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapChildRequestFromDB(data);
}

export async function deleteChildRequest(requestId: string) {
  const { error } = await supabase
    .from('child_addition_requests')
    .delete()
    .eq('id', requestId);

  if (error) throw new Error(error.message);
  return { success: true };
}

// ==================== ASSIGNEE API ====================

export async function getAssigneesBySchool(schoolCode: string) {
  const { data, error } = await supabase
    .from('assignees')
    .select('*')
    .eq('school_code', schoolCode);

  if (error) throw new Error(error.message);
  return (data || []).map(mapAssigneeFromDB);
}

export async function createAssignee(schoolCode: string, assignee: any) {
  const dbAssignee = {
    id: assignee.id || crypto.randomUUID(),
    school_code: schoolCode,
    parent_id: assignee.parentId || '',
    parent_name: assignee.parentName || '',
    parent_email: assignee.parentEmail || '',
    parent_phone: assignee.parentPhone || '',
    parent_photo: assignee.parentPhoto || '',
    family_id: assignee.familyId || '',
    children_ids: assignee.childrenIds || [],
    full_name: assignee.fullName || '',
    photo: assignee.photo || '',
    phone_number: assignee.phoneNumber || '',
    id_type: assignee.idType || 'NIN',
    id_number: assignee.idNumber || '',
    id_photo: assignee.idPhoto || '',
    created_at: assignee.createdAt || new Date().toISOString(),
    expires_at: assignee.expiresAt || new Date().toISOString(),
    is_active: assignee.isActive !== undefined ? assignee.isActive : true,
    access_code: assignee.accessCode || '',
  };

  const { data, error } = await supabase
    .from('assignees')
    .insert(dbAssignee)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapAssigneeFromDB(data);
}

export async function updateAssignee(assigneeId: string, updates: any) {
  const dbUpdates: any = {};
  if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
  if (updates.photo !== undefined) dbUpdates.photo = updates.photo;
  if (updates.phoneNumber !== undefined) dbUpdates.phone_number = updates.phoneNumber;
  if (updates.idType !== undefined) dbUpdates.id_type = updates.idType;
  if (updates.idNumber !== undefined) dbUpdates.id_number = updates.idNumber;
  if (updates.idPhoto !== undefined) dbUpdates.id_photo = updates.idPhoto;
  if (updates.childrenIds !== undefined) dbUpdates.children_ids = updates.childrenIds;
  if (updates.expiresAt !== undefined) dbUpdates.expires_at = updates.expiresAt;
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

  const { data, error } = await supabase
    .from('assignees')
    .update(dbUpdates)
    .eq('id', assigneeId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapAssigneeFromDB(data);
}

export async function deleteAssignee(assigneeId: string) {
  const { error } = await supabase
    .from('assignees')
    .delete()
    .eq('id', assigneeId);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function getAssigneeByAccessCode(accessCode: string) {
  const { data, error } = await supabase
    .from('assignees')
    .select('*')
    .eq('access_code', accessCode)
    .eq('is_active', true)
    .single();

  if (error) throw new Error(error.message);
  return mapAssigneeFromDB(data);
}

// ==================== CLASSES API ====================

export async function getClassesBySchool(schoolCode: string) {
  const { data, error } = await supabase
    .from('school_classes')
    .select('*')
    .eq('school_code', schoolCode)
    .maybeSingle();

  if (error || !data) {
    // No classes yet - return empty
    return { selectedClasses: [], customClasses: [] };
  }
  return {
    selectedClasses: data.selected_classes || [],
    customClasses: data.custom_classes || [],
  };
}

export async function saveClasses(schoolCode: string, selectedClasses: string[], customClasses: string[]) {
  const { data, error } = await supabase
    .from('school_classes')
    .upsert({
      school_code: schoolCode,
      selected_classes: selectedClasses,
      custom_classes: customClasses,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'school_code' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return {
    selectedClasses: data.selected_classes || [],
    customClasses: data.custom_classes || [],
  };
}

// ==================== FIELD MAPPERS ====================

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

function mapAttendanceLogFromDB(row: any) {
  return {
    id: row.id,
    parentId: row.parent_id,
    parentName: row.parent_name,
    parentPhoto: row.parent_photo,
    childrenIds: row.children_ids || [],
    childrenNames: row.children_names || [],
    type: row.type,
    timestamp: row.timestamp,
    assigneeId: row.assignee_id,
    assigneeName: row.assignee_name,
    assigneePhoto: row.assignee_photo,
    assignedBy: row.assigned_by,
    assignedByName: row.assigned_by_name,
    assignedByPhoto: row.assigned_by_photo,
    faceImage: row.face_image,
    schoolCode: row.school_code,
  };
}

function mapChildRequestFromDB(row: any) {
  return {
    id: row.id,
    parentId: row.parent_id,
    parentName: row.parent_name,
    parentPhone: row.parent_phone,
    parentEmail: row.parent_email,
    parentType: row.parent_type,
    studentId: row.student_id,
    studentName: row.student_name,
    status: row.status,
    requestDate: row.request_date,
    reviewDate: row.review_date,
    reviewedBy: row.reviewed_by,
    notes: row.notes,
    schoolCode: row.school_code,
  };
}

function mapAssigneeFromDB(row: any) {
  return {
    id: row.id,
    parentId: row.parent_id,
    parentName: row.parent_name,
    parentEmail: row.parent_email,
    parentPhone: row.parent_phone,
    parentPhoto: row.parent_photo,
    familyId: row.family_id,
    childrenIds: row.children_ids || [],
    fullName: row.full_name,
    photo: row.photo,
    phoneNumber: row.phone_number,
    idType: row.id_type,
    idNumber: row.id_number,
    idPhoto: row.id_photo,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    isActive: row.is_active,
    schoolCode: row.school_code,
    accessCode: row.access_code,
  };
}