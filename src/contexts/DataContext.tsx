import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as supabaseApi from '@/utils/supabaseApi';
import * as parentApi from '@/utils/parentApi';
import { toast } from 'sonner';
import { supabase } from '@/utils/supabaseClient';

// Updated: Added schoolCode support for parent authentication
export interface Student {
  id: string;
  name: string;
  image: string;
  age: number;
  class: string;
  gender: 'Male' | 'Female';
}

export interface Parent {
  id: string;
  parentId: string; // Unique ID for parent login
  familyId: string; // Links parents to same family unit
  type: 'father' | 'mother';
  name: string;
  photo: string;
  gender: string;
  occupation: string;
  residentialAddress: string;
  childrenIds: string[];
  password: string;
  mustChangePassword?: boolean; // Flag for one-time password
  phoneNumber?: string; // New field for parent registration
  email?: string; // New field for parent registration
  pin?: string; // New field - 4-digit PIN for login
  schoolCode?: string; // School association for multi-tenant SaaS
}

export interface AttendanceLog {
  id: string;
  parentId: string;
  parentName: string;
  parentPhoto?: string; // Parent's photo for display
  childrenIds: string[];
  childrenNames: string[];
  type: 'clock-in' | 'clock-out';
  timestamp: Date;
  // Assignee fields
  assigneeId?: string; // If clocked by assignee
  assigneeName?: string;
  assigneePhoto?: string;
  assignedBy?: string; // Parent who created the assignee
  assignedByName?: string;
  assignedByPhoto?: string; // Photo of parent who assigned
  // Facial verification
  faceImage?: string; // Captured face image for verification
}

export interface Assignee {
  id: string;
  parentId: string; // Parent who created the assignee
  parentName: string;
  parentEmail?: string; // For security confirmation
  parentPhone?: string; // For security confirmation
  parentPhoto?: string; // Parent's photo for display in attendance logs
  familyId: string; // Links to the family
  childrenIds: string[]; // Children this assignee can pick up
  fullName: string;
  photo: string;
  phoneNumber: string;
  idType: 'NIN' | 'Drivers License' | 'Passport';
  idNumber: string;
  idPhoto: string; // Photo of the ID card
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  schoolCode: string;
  accessCode: string; // Unique code for assignee to login
}

export interface SecurityPersonnel {
  id: string;
  schoolCode: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  photo: string;
  username: string; // For login
  password: string;
  createdAt: Date;
  isActive: boolean;
  createdBy: string; // School admin who created them
}

export interface ChildAdditionRequest {
  id: string;
  parentId: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  parentType: 'father' | 'mother';
  studentId: string;
  studentName: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: Date;
  reviewDate?: Date;
  reviewedBy?: string;
  notes?: string;
}

interface DataContextType {
  students: Student[];
  parents: Parent[];
  attendanceLogs: AttendanceLog[];
  childAdditionRequests: ChildAdditionRequest[];
  assignees: Assignee[];
  securityPersonnel: SecurityPersonnel[];
  classes: string[];
  loading: boolean;
  addStudent: (student: Omit<Student, 'id'>) => void;
  addParent: (parent: Omit<Parent, 'id' | 'password' | 'parentId'>) => { parentId: string; password: string };
  updateParentChildren: (parentId: string, childrenIds: string[]) => void;
  addAttendanceLog: (log: Omit<AttendanceLog, 'id' | 'timestamp'>) => void;
  updateParentPassword: (parentId: string, newPassword: string) => void;
  getParentByCredentials: (parentId: string, password: string) => Parent | undefined;
  getStudentsByIds: (ids: string[]) => Student[];
  deleteParent: (parentId: string) => void;
  deleteFamily: (childrenIds: string[]) => void;
  updateParent: (parentId: string, updates: Partial<Parent>) => void;
  deleteStudent: (studentId: string) => void;
  updateStudent: (studentId: string, updates: Partial<Student>) => void;
  bulkUpdateParents: (updatedParents: Parent[]) => void;
  addChildAdditionRequest: (request: Omit<ChildAdditionRequest, 'id' | 'requestDate'>) => void;
  updateChildAdditionRequest: (requestId: string, updates: Partial<ChildAdditionRequest>) => void;
  deleteChildAdditionRequest: (requestId: string) => void;
  refreshChildRequests: () => Promise<void>;
  // Assignee functions
  addAssignee: (assignee: Omit<Assignee, 'id' | 'createdAt' | 'accessCode'>) => Assignee;
  deleteAssignee: (assigneeId: string) => void;
  updateAssignee: (assigneeId: string, updates: Partial<Assignee>) => void;
  getAssigneeByAccessCode: (accessCode: string) => Assignee | undefined;
  getActiveAssigneesForFamily: (familyId: string) => Assignee[];
  // Security functions
  addSecurityPersonnel: (personnel: Omit<SecurityPersonnel, 'id' | 'createdAt'>) => void;
  deleteSecurityPersonnel: (personnelId: string) => void;
  updateSecurityPersonnel: (personnelId: string, updates: Partial<SecurityPersonnel>) => void;
  getSecurityByCredentials: (username: string, password: string) => SecurityPersonnel | undefined;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [childAdditionRequests, setChildAdditionRequests] = useState<ChildAdditionRequest[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [securityPersonnel, setSecurityPersonnel] = useState<SecurityPersonnel[]>([]);
  // pendingDeletes tracks in-memory only (no localStorage)
  const [pendingDeletes, setPendingDeletes] = useState<Set<string>>(new Set());
  const [classes, setClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Helper to get current school code from session storage
  const getSchoolCode = () => {
    return sessionStorage.getItem('schoolCode') || localStorage.getItem('schoolCode') || '';
  };

  // Helper to generate unique school code
  const generateSchoolCode = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    
    // Generate 3 random letters
    let code = 'SCH';
    for (let i = 0; i < 3; i++) {
      code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    // Generate 6 random numbers
    for (let i = 0; i < 6; i++) {
      code += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    
    return code;
  };

  // Load initial data from Supabase
  useEffect(() => {
    const loadDataFromSupabase = async () => {
      try {
        console.log('🚀 DataProvider mounting - loading data from Supabase...');
        
        const schoolCode = getSchoolCode();
        
        if (!schoolCode) {
          console.log('⚠️ No school code found, generating new unique school code...');
          
          // Generate unique school code
          const newSchoolCode = generateSchoolCode();
          sessionStorage.setItem('schoolCode', newSchoolCode);
          console.log('✅ Generated new school code:', newSchoolCode);
          
          // Initialize with empty data for new school
          const initialStudents: Student[] = [];
          
          setStudents(initialStudents);
          setParents([]);
          
          setLoading(false);
          setIsInitialLoad(false);
          return;
        }

        // Try to load from Supabase
        try {
          console.log('📡 Loading students from Supabase for school:', schoolCode);
          const supabaseStudents = await supabaseApi.getStudentsBySchool(schoolCode);
          
          if (supabaseStudents && supabaseStudents.length > 0) {
            console.log('✅ Loaded students from Supabase:', supabaseStudents.length);
            setStudents(supabaseStudents);
          } else {
            console.log('ℹ️ No students found in Supabase for this school');
            setStudents([]);
          }
        } catch (supabaseError: any) {
          // Silently fail and use empty dataset - DO NOT LOG CONNECTION ERRORS
          // Check if it's a network/fetch error (Edge Function not deployed)
          if (supabaseError.message?.includes('Failed to fetch') || 
              supabaseError.message?.includes('fetch') || 
              supabaseError.message?.includes('Cannot connect to server') ||
              supabaseError.message?.includes('OFFLINE')) {
            // Only show notification once per session
            if (!sessionStorage.getItem('backend-offline-notified')) {
              sessionStorage.setItem('backend-offline-notified', 'true');
              sessionStorage.setItem('supabaseConnectionFailed', 'true');
              console.info('📦 Backend unavailable - running in offline mode with localStorage');
            }
            setStudents([]);
          } else if (supabaseError.message?.includes('timeout')) {
            setStudents([]);
          } else {
            // For other errors, set empty array
            setStudents([]);
          }
        }

        // Load other data from Supabase (parents, logs, requests)
        try {
          console.log('📡 Loading parents from Supabase for school:', schoolCode);
          const supabaseParents = await parentApi.getParentsBySchool(schoolCode);
          
          if (supabaseParents && supabaseParents.length > 0) {
            console.log('✅ Loaded', supabaseParents.length, 'parents from Supabase');
            setParents(supabaseParents);
          } else {
            console.log('ℹ️ No parents found in Supabase');
            setParents([]);
          }
        } catch (error) {
          // Silently fail
          setParents([]);
        }

        // Load attendance logs from Supabase
        try {
          console.log('📡 Loading attendance logs from Supabase for school:', schoolCode);
          const supabaseLogs = await parentApi.getAttendanceLogsBySchool(schoolCode);
          
          if (supabaseLogs && supabaseLogs.length > 0) {
            console.log('✅ Loaded', supabaseLogs.length, 'attendance logs from Supabase');
            const logsWithDates = supabaseLogs.map((log: any) => ({ 
              ...log, 
              timestamp: new Date(log.timestamp) 
            }));
            setAttendanceLogs(logsWithDates);
          } else {
            // No data in Supabase, check localStorage as fallback
            console.log('⚠️ No attendance logs in Supabase, checking localStorage...');
            const storedLogs = localStorage.getItem('attendanceLogs');
            
            if (storedLogs) {
              const localLogs = JSON.parse(storedLogs);
              console.log('📦 Found', localLogs.length, 'logs in localStorage');
              const logsWithDates = localLogs.map((log: any) => ({ 
                ...log, 
                timestamp: new Date(log.timestamp) 
              }));
              setAttendanceLogs(logsWithDates);
              
              // Sync localStorage data to Supabase
              if (localLogs.length > 0) {
                console.log('🔄 Syncing localStorage logs to Supabase...');
                for (const log of localLogs) {
                  try {
                    await parentApi.createAttendanceLog(schoolCode, log);
                  } catch (error) {
                    console.warn('Failed to sync log:', log.id, error);
                  }
                }
              }
            } else {
              setAttendanceLogs([]);
            }
          }
        } catch (error) {
          // Silently fail and use localStorage
          const storedLogs = localStorage.getItem('attendanceLogs');
          if (storedLogs) {
            const localLogs = JSON.parse(storedLogs);
            setAttendanceLogs(localLogs.map((log: any) => ({ 
              ...log, 
              timestamp: new Date(log.timestamp) 
            })));
          } else {
            setAttendanceLogs([]);
          }
        }

        // Load child addition requests from Supabase
        try {
          console.log('📡 Loading child addition requests from Supabase for school:', schoolCode);
          const supabaseRequests = await parentApi.getChildRequestsBySchool(schoolCode);
          
          if (supabaseRequests && supabaseRequests.length > 0) {
            console.log('✅ Loaded', supabaseRequests.length, 'child requests from Supabase');
            const requestsWithDates = supabaseRequests.map((request: any) => ({ 
              ...request, 
              requestDate: new Date(request.requestDate),
              reviewDate: request.reviewDate ? new Date(request.reviewDate) : undefined
            }));
            setChildAdditionRequests(requestsWithDates);
          } else {
            console.log('ℹ️ No child requests found in Supabase for this school');
            setChildAdditionRequests([]);
          }
        } catch (error) {
          // Silently fail
          setChildAdditionRequests([]);
        }

        // Load assignees from Supabase ONLY (no localStorage backup)
        try {
          console.log('📡 Loading assignees from Supabase for school:', schoolCode);
          
          // First, check if we have localStorage assignees that need migration
          let localAssigneesToMigrate: any[] = [];
          try {
            const storedAssignees = localStorage.getItem('assignees');
            if (storedAssignees) {
              localAssigneesToMigrate = JSON.parse(storedAssignees);
              console.log('📦 Found', localAssigneesToMigrate.length, 'assignees in localStorage that may need migration');
            }
          } catch (localErr) {
            console.warn('Could not read localStorage assignees:', localErr);
          }
          
          // Load from Supabase
          const supabaseAssignees = await parentApi.getAssigneesBySchool(schoolCode);
          
          if (supabaseAssignees && supabaseAssignees.length > 0) {
            console.log('✅ Loaded', supabaseAssignees.length, 'assignees from Supabase');
            
            // Convert date strings to Date objects
            const assigneesWithDates = supabaseAssignees.map(assignee => ({
              ...assignee,
              createdAt: new Date(assignee.createdAt),
              expiresAt: new Date(assignee.expiresAt)
            }));
            
            console.log('📅 [ASSIGNEES] Converted dates for assignees:', assigneesWithDates.map(a => ({
              name: a.fullName,
              familyId: a.familyId,
              expiresAt: a.expiresAt,
              isActive: a.isActive
            })));
            
            setAssignees(assigneesWithDates);
            
            // Clear localStorage since Supabase is the source of truth
            try {
              localStorage.removeItem('assignees');
              console.log('🗑️ Cleared assignees from localStorage (using Supabase only)');
            } catch (e) {
              console.warn('Could not clear localStorage:', e);
            }
          } else if (localAssigneesToMigrate.length > 0) {
            // No data in Supabase but we have localStorage data - migrate it
            console.log('🔄 Migrating', localAssigneesToMigrate.length, 'assignees from localStorage to Supabase...');
            
            const migratedAssignees: any[] = [];
            for (const assignee of localAssigneesToMigrate) {
              try {
                // Ensure assignee has schoolCode
                const assigneeToMigrate = {
                  ...assignee,
                  schoolCode: assignee.schoolCode || schoolCode // Add schoolCode if missing
                };
                
                await parentApi.createAssignee(schoolCode, assigneeToMigrate);
                // Convert dates when adding to local array
                migratedAssignees.push({
                  ...assigneeToMigrate,
                  createdAt: new Date(assigneeToMigrate.createdAt),
                  expiresAt: new Date(assigneeToMigrate.expiresAt)
                });
                console.log('✅ Migrated assignee:', assignee.fullName);
              } catch (error) {
                console.warn('❌ Failed to migrate assignee:', assignee.fullName, error);
              }
            }
            
            setAssignees(migratedAssignees);
            
            // Clear localStorage after successful migration
            try {
              localStorage.removeItem('assignees');
              console.log('✅ Migration complete! Cleared localStorage assignees.');
              toast.success(`Migrated ${migratedAssignees.length} assignee(s) to cloud storage`);
            } catch (e) {
              console.warn('Could not clear localStorage after migration:', e);
            }
          } else {
            console.log('ℹ️ No assignees found in Supabase or localStorage');
            setAssignees([]);
          }
        } catch (error) {
          // Silently fail
          setAssignees([]);
        }

        // Load security personnel from Supabase
        try {
          console.log('🔒 Loading security personnel from Supabase for school:', schoolCode);
          const securityData = await supabaseApi.getSecurityPersonnel(schoolCode);
          
          if (securityData && securityData.length > 0) {
            console.log('✅ Loaded', securityData.length, 'security personnel from Supabase');
            setSecurityPersonnel(securityData);
          } else {
            console.log('ℹ️ No security personnel found for this school');
            setSecurityPersonnel([]);
          }
        } catch (error: any) {
          // Silently fail if server is unavailable
          if (error.message?.includes('Failed to fetch') || error.message?.includes('Cannot connect')) {
            console.log('ℹ️ Server unavailable - using empty security personnel dataset');
          }
          setSecurityPersonnel([]);
        }

        // Load classes from Supabase
        try {
          console.log('📚 Loading classes from Supabase...');
          const classesData = await parentApi.getClassesBySchool(schoolCode);
          
          const allClasses: string[] = [
            ...(classesData.selectedClasses || []),
            ...(classesData.customClasses || [])
          ];
          
          if (allClasses.length > 0) {
            setClasses(allClasses);
            console.log('✅ Classes loaded from Supabase:', allClasses.length, allClasses);
          }
        } catch (error) {
          // Silently fail
          setClasses([]);
        }

        setLoading(false);
        setIsInitialLoad(false);
        
      } catch (error) {
        console.error('❌ Error loading data:', error);
        setLoading(false);
        setIsInitialLoad(false);
      }
    };

    loadDataFromSupabase();
  }, []);

  // Real-time subscriptions for live data sync between school and parent systems
  useEffect(() => {
    const schoolCode = getSchoolCode();
    if (!schoolCode) {
      console.log('⏭️ Skipping real-time subscriptions (no school code)');
      return;
    }

    console.log('🔴 REAL-TIME: Setting up live data sync for school:', schoolCode);
    
    // Subscribe to students table changes
    const studentsChannel = supabase
      .channel(`students-${schoolCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students',
          filter: `school_code=eq.${schoolCode}`
        },
        (payload: any) => {
          console.log('🔴 REAL-TIME: Students table changed!', payload.eventType, payload.new?.name || payload.old?.name);
          
          if (payload.eventType === 'INSERT') {
            setStudents(prev => {
              const exists = prev.some(s => s.id === payload.new.id);
              if (exists) return prev;
              toast.info(`New student added: ${payload.new.name}`);
              return [...prev, payload.new];
            });
          } else if (payload.eventType === 'UPDATE') {
            setStudents(prev => prev.map(s => s.id === payload.new.id ? payload.new : s));
            toast.info(`Student updated: ${payload.new.name}`);
          } else if (payload.eventType === 'DELETE') {
            setStudents(prev => prev.filter(s => s.id !== payload.old.id));
            toast.info('Student removed');
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ REAL-TIME: Students subscription active');
        }
      });

    // Subscribe to parents table changes
    const parentsChannel = supabase
      .channel(`parents-${schoolCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'parents',
          filter: `school_code=eq.${schoolCode}`
        },
        (payload: any) => {
          console.log('🔴 REAL-TIME: Parents table changed!', payload.eventType, payload.new?.name || payload.old?.name);
          
          if (payload.eventType === 'INSERT') {
            setParents(prev => {
              const exists = prev.some(p => p.id === payload.new.id);
              if (exists) return prev;
              console.log('➕ Real-time: New parent added:', payload.new.name);
              toast.success(`New parent registered: ${payload.new.name}`, { duration: 3000 });
              return [...prev, payload.new];
            });
          } else if (payload.eventType === 'UPDATE') {
            setParents(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
            console.log('🔄 Real-time: Parent updated:', payload.new.name);
          } else if (payload.eventType === 'DELETE') {
            setParents(prev => prev.filter(p => p.id !== payload.old.id));
            console.log('🗑️ Real-time: Parent removed:', payload.old.name);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(' REAL-TIME: Parents subscription active');
        }
      });

    // Subscribe to attendance_logs table changes
    const logsChannel = supabase
      .channel(`attendance-logs-${schoolCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_logs',
          filter: `school_code=eq.${schoolCode}`
        },
        (payload: any) => {
          console.log('🔴 REAL-TIME: Attendance log changed!', payload.eventType);
          
          if (payload.eventType === 'INSERT') {
            // Map snake_case database fields to camelCase for frontend
            const logWithDate = {
              id: payload.new.id,
              schoolCode: payload.new.school_code,
              parentId: payload.new.parent_id,
              parentName: payload.new.parent_name,
              parentPhoto: payload.new.parent_photo,
              childrenIds: payload.new.children_ids,
              childrenNames: payload.new.children_names,
              type: payload.new.type,
              timestamp: new Date(payload.new.timestamp),
              // Assignee fields
              assigneeId: payload.new.assignee_id,
              assigneeName: payload.new.assignee_name,
              assigneePhoto: payload.new.assignee_photo,
              assignedBy: payload.new.assigned_by,
              assignedByName: payload.new.assigned_by_name,
              assignedByPhoto: payload.new.assigned_by_photo,
              // Facial verification
              faceImage: payload.new.face_image,
              createdAt: payload.new.created_at
            };
            setAttendanceLogs(prev => {
              const exists = prev.some(l => l.id === logWithDate.id);
              if (exists) {
                console.log('⚠️ REAL-TIME: Duplicate log detected, skipping:', logWithDate.id);
                return prev;
              }
              console.log('✅ REAL-TIME: Adding new attendance log:', logWithDate.id);
              const loggerName = logWithDate.assigneeName || logWithDate.parentName;
              const actionBy = logWithDate.assigneeName ? `${logWithDate.assigneeName} (assignee)` : logWithDate.parentName;
              toast.success(`${actionBy} ${logWithDate.type === 'clock-in' ? 'clocked in' : 'clocked out'}`, {
                duration: 5000
              });
              return [logWithDate, ...prev];
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ REAL-TIME: Attendance logs subscription active');
        }
      });

    // Subscribe to child_addition_requests table changes
    const requestsChannel = supabase
      .channel(`child-requests-${schoolCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'child_addition_requests',
          filter: `school_code=eq.${schoolCode}`
        },
        (payload: any) => {
          console.log('🔴 REAL-TIME: Child request changed!', payload.eventType);
          
          if (payload.eventType === 'INSERT') {
            const requestWithDates = {
              ...payload.new,
              requestDate: new Date(payload.new.requestDate),
              reviewDate: payload.new.reviewDate ? new Date(payload.new.reviewDate) : undefined
            };
            setChildAdditionRequests(prev => {
              const exists = prev.some(r => r.id === payload.new.id);
              if (exists) return prev;
              return [...prev, requestWithDates];
            });
          } else if (payload.eventType === 'UPDATE') {
            const requestWithDates = {
              ...payload.new,
              requestDate: new Date(payload.new.requestDate),
              reviewDate: payload.new.reviewDate ? new Date(payload.new.reviewDate) : undefined
            };
            setChildAdditionRequests(prev => prev.map(r => r.id === payload.new.id ? requestWithDates : r));
          } else if (payload.eventType === 'DELETE') {
            setChildAdditionRequests(prev => prev.filter(r => r.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ REAL-TIME: Child requests subscription active');
        }
      });

    // Subscribe to assignees table changes
    const assigneesChannel = supabase
      .channel(`assignees-${schoolCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assignees',
          filter: `school_code=eq.${schoolCode}`
        },
        (payload: any) => {
          console.log('🔴 REAL-TIME: Assignees table changed!', payload.eventType, payload.new?.fullName || payload.old?.fullName);
          
          if (payload.eventType === 'INSERT') {
            const assigneeWithDates = {
              id: payload.new.id,
              parentId: payload.new.parent_id,
              parentName: payload.new.parent_name,
              parentEmail: payload.new.parent_email,
              parentPhone: payload.new.parent_phone,
              parentPhoto: payload.new.parent_photo,
              familyId: payload.new.family_id,
              childrenIds: payload.new.children_ids,
              fullName: payload.new.full_name,
              photo: payload.new.photo,
              phoneNumber: payload.new.phone_number,
              idType: payload.new.id_type,
              idNumber: payload.new.id_number,
              idPhoto: payload.new.id_photo,
              createdAt: new Date(payload.new.created_at),
              expiresAt: new Date(payload.new.expires_at),
              isActive: payload.new.is_active,
              schoolCode: payload.new.school_code,
              accessCode: payload.new.access_code
            };
            setAssignees(prev => {
              const exists = prev.some(a => a.id === assigneeWithDates.id);
              if (exists) return prev;
              console.log('🔴 REAL-TIME: New assignee added:', assigneeWithDates.fullName);
              toast.success(`New assignee added: ${assigneeWithDates.fullName}`, { duration: 3000 });
              return [...prev, assigneeWithDates];
            });
          } else if (payload.eventType === 'UPDATE') {
            const assigneeWithDates = {
              id: payload.new.id,
              parentId: payload.new.parent_id,
              parentName: payload.new.parent_name,
              parentEmail: payload.new.parent_email,
              parentPhone: payload.new.parent_phone,
              parentPhoto: payload.new.parent_photo,
              familyId: payload.new.family_id,
              childrenIds: payload.new.children_ids,
              fullName: payload.new.full_name,
              photo: payload.new.photo,
              phoneNumber: payload.new.phone_number,
              idType: payload.new.id_type,
              idNumber: payload.new.id_number,
              idPhoto: payload.new.id_photo,
              createdAt: new Date(payload.new.created_at),
              expiresAt: new Date(payload.new.expires_at),
              isActive: payload.new.is_active,
              schoolCode: payload.new.school_code,
              accessCode: payload.new.access_code
            };
            setAssignees(prev => prev.map(a => a.id === assigneeWithDates.id ? assigneeWithDates : a));
            console.log('🔴 REAL-TIME: Assignee updated:', assigneeWithDates.fullName);
          } else if (payload.eventType === 'DELETE') {
            setAssignees(prev => prev.filter(a => a.id !== payload.old.id));
            console.log('🔴 REAL-TIME: Assignee deleted');
            toast.info('Assignee removed', { duration: 3000 });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ REAL-TIME: Assignees subscription active');
        }
      });

    // Subscribe to security_personnel table changes
    const securityChannel = supabase
      .channel(`security-personnel-${schoolCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'security_personnel',
          filter: `school_code=eq.${schoolCode}`
        },
        (payload: any) => {
          console.log('🔴 REAL-TIME: Security personnel table changed!', payload.eventType, payload.new?.fullName || payload.old?.fullName);
          
          if (payload.eventType === 'INSERT') {
            setSecurityPersonnel(prev => {
              const exists = prev.some(s => s.id === payload.new.id);
              if (exists) return prev;
              return [...prev, payload.new];
            });
          } else if (payload.eventType === 'UPDATE') {
            setSecurityPersonnel(prev => prev.map(s => s.id === payload.new.id ? payload.new : s));
          } else if (payload.eventType === 'DELETE') {
            setSecurityPersonnel(prev => prev.filter(s => s.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ REAL-TIME: Security personnel subscription active');
        }
      });

    // Cleanup subscriptions on unmount
    return () => {
      console.log('🔴 REAL-TIME: Cleaning up subscriptions');
      studentsChannel.unsubscribe();
      parentsChannel.unsubscribe();
      logsChannel.unsubscribe();
      requestsChannel.unsubscribe();
      assigneesChannel.unsubscribe();
      securityChannel.unsubscribe();
    };
  }, []); // Empty dependency array - setup once on mount

  // All data is stored in Supabase only - no localStorage syncing
  // This prevents "Storage full" errors and ensures single source of truth

  // Listen for classes updates via custom event (when updated from SchoolSetupTab)
  useEffect(() => {
    const handleClassesUpdate = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { selectedClasses = [], customClasses = [] } = customEvent.detail || {};
      
      const allClasses: string[] = [
        ...selectedClasses,
        ...customClasses
      ];
      
      setClasses(allClasses);
      console.log('🔄 Classes updated from event:', allClasses.length, allClasses);
    };

    // Listen for custom classesUpdated event
    window.addEventListener('classesUpdated', handleClassesUpdate as EventListener);

    return () => {
      window.removeEventListener('classesUpdated', handleClassesUpdate as EventListener);
    };
  }, []);

  const addStudent = (student: Omit<Student, 'id'>) => {
    const newStudent = {
      ...student,
      id: Date.now().toString()
    };
    console.log('➕ Adding new student:', newStudent);
    
    // Optimistically update local state
    setStudents(prevStudents => {
      const updated = [...prevStudents, newStudent];
      console.log('📊 Students array updated. Total:', updated.length);
      return updated;
    });
    
    // Save to Supabase in background
    const schoolCode = getSchoolCode();
    if (schoolCode) {
      supabaseApi.createStudent(schoolCode, newStudent)
        .then(() => {
          console.log('✅ Student saved to Supabase successfully');
          toast.success('Student added successfully!');
        })
        .catch((error) => {
          console.warn('⚠️ Failed to save student to Supabase:', error);
          toast.warning('Student added locally but not synced to cloud');
        });
    }
  };

  // Generate random password
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar looking characters
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // Generate unique Parent ID
  const generateParentId = () => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PID${timestamp.slice(-6)}${random}`; // e.g., PID847291123
  };

  const addParent = (parent: Omit<Parent, 'id' | 'password' | 'parentId'>) => {
    const generatedPassword = generatePassword();
    const generatedParentId = generateParentId();
    // CRITICAL: Only generate a new familyId if one wasn't provided
    // This ensures spouses get added to the same family
    const familyIdToUse = parent.familyId || `FID${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    const schoolCode = getSchoolCode();
    console.log('➕ [ADD PARENT] Starting parent registration');
    console.log('📋 [ADD PARENT] School Code:', schoolCode || 'MISSING!');
    console.log('👤 [ADD PARENT] Parent Name:', parent.name);
    console.log('👨‍👩‍👧‍👦 [ADD PARENT] Family ID:', familyIdToUse);
    
    if (!schoolCode) {
      console.error('❌ [ADD PARENT] No school code found! Parent will not be associated with a school.');
      toast.error('Registration error: School code not found. Please contact your school administrator.');
      return { parentId: '', password: '' };
    }
    
    const newParent = {
      ...parent,
      id: `p${Date.now()}`,
      parentId: generatedParentId,
      familyId: familyIdToUse, // Use the provided familyId or generate new one
      password: generatedPassword,
      mustChangePassword: true, // Force password change on first login
      schoolCode // Explicitly add schoolCode to parent object
    };
    
    console.log('💾 [ADD PARENT] Creating parent with ID:', newParent.id);
    
    // Optimistically update local state
    setParents(prevParents => {
      const updated = [...prevParents, newParent];
      console.log('📊 [ADD PARENT] Parents array updated. Total:', updated.length);
      return updated;
    });
    
    // Save to Supabase in background
    console.log('🌐 [ADD PARENT] Saving to Supabase...');
    parentApi.createParent(schoolCode, newParent)
      .then(() => {
        console.log('✅ [ADD PARENT] Parent saved to Supabase successfully');
        console.log('🔗 [ADD PARENT] Parent associated with school:', schoolCode);
        toast.success('Account created successfully!');
      })
      .catch((error) => {
        console.error('❌ [ADD PARENT] Failed to save parent to Supabase:', error);
        console.error('🔍 [ADD PARENT] Error details:', {
          errorType: typeof error,
          errorMessage: error.message,
          schoolCode,
          parentId: newParent.id
        });
        toast.error('Registration failed. Please try again or contact your school administrator.');
        // Remove from local state if Supabase save failed
        setParents(prevParents => prevParents.filter(p => p.id !== newParent.id));
      });
    
    return { parentId: generatedParentId, password: generatedPassword };
  };

  const updateParentChildren = (parentId: string, childrenIds: string[]) => {
    setParents(prevParents => prevParents.map(p => p.id === parentId ? { ...p, childrenIds } : p));
  };

  const addAttendanceLog = (log: Omit<AttendanceLog, 'id' | 'timestamp'>) => {
    const newLog = {
      ...log,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    
    // Optimistically update local state
    setAttendanceLogs(prevLogs => [newLog, ...prevLogs]);
    
    // Save to Supabase in background
    const schoolCode = getSchoolCode();
    if (schoolCode) {
      parentApi.createAttendanceLog(schoolCode, newLog)
        .then(() => {
          console.log('✅ Attendance log saved to Supabase successfully');
        })
        .catch((error) => {
          console.warn('⚠️ Failed to save attendance log to Supabase:', error);
          toast.warning('Attendance logged locally but not synced to cloud');
        });
    }
  };

  const updateParentPassword = (parentId: string, newPassword: string) => {
    setParents(prevParents => prevParents.map(p => 
      p.id === parentId ? { ...p, password: newPassword, mustChangePassword: false } : p
    ));
  };

  const getParentByCredentials = (parentId: string, password: string) => {
    return parents.find(p => p.parentId === parentId && p.password === password);
  };

  const getStudentsByIds = (ids: string[]) => {
    return students.filter(s => ids.includes(s.id));
  };

  const deleteParent = async (parentId: string) => {
    try {
      console.log('🗑️ HARD DELETE parent:', parentId);
      
      // Step 1 & 2: Remove from state AND localStorage in one operation
      setParents(prevParents => {
        const filtered = prevParents.filter(p => p.id !== parentId);
        // CRITICAL: Update localStorage with the FILTERED array, not the old 'parents' array
        localStorage.setItem('parents', JSON.stringify(filtered));
        console.log('✅ Removed from state and localStorage');
        return filtered;
      });
      
      // Step 3: Broadcast parent deletion event (for auto-logout)
      window.dispatchEvent(new CustomEvent('parentDeleted', { detail: { parentId } }));
      console.log('📢 [DELETE] Broadcasted parent deletion event for:', parentId);
      
      // Step 4: Delete from Supabase (PERMANENT)
      try {
        await supabaseApi.deleteParent(parentId);
        console.log('✅ PERMANENTLY deleted from Supabase');
        toast.success('Parent deleted successfully');
      } catch (supabaseError) {
        console.warn('⚠️ Supabase delete failed (will still be deleted locally):', supabaseError);
        // Don't revert local changes - local delete is more important than Supabase sync
        toast.success('Parent deleted (local only - Supabase sync failed)');
      }
      
    } catch (error) {
      console.error('❌ Error deleting parent:', error);
      toast.error('Failed to delete parent');
      
      // Reload from localStorage to ensure consistency
      const storedParents = localStorage.getItem('parents');
      if (storedParents) {
        setParents(JSON.parse(storedParents));
      }
    }
  };

  const deleteFamily = (childrenIds: string[]) => {
    console.log('deleteFamily function called with childrenIds:', childrenIds);
    // Delete all parents associated with these children
    // This dissolves the family unit but keeps the students in the school system
    setParents(prevParents => {
      const filtered = prevParents.filter(p => {
        // If no children provided, this means we can't identify the family to delete
        // This shouldn't happen in normal flow, but handle it gracefully
        if (!childrenIds || childrenIds.length === 0) {
          console.warn('deleteFamily called with empty childrenIds - cannot identify family to delete');
          return true; // Keep all parents if we can't identify which to delete
        }
        
        // Check if this parent's children overlap with the family's children
        const hasOverlap = p.childrenIds.some(id => childrenIds.includes(id));
        
        // Keep the parent if they DON'T have overlapping children (not part of this family)
        return !hasOverlap;
      });
      console.log('Parents before filter:', prevParents);
      console.log('Parents after filter:', filtered);
      console.log('Parents removed:', prevParents.length - filtered.length);
      return filtered;
    });
    // NOTE: Students are NOT deleted - they remain in the school system
    console.log('deleteFamily function completed - parents removed, students kept');
  };

  const updateParent = (parentId: string, updates: Partial<Parent>) => {
    console.log('📝 updateParent called for:', parentId, 'with updates:', updates);
    
    // Optimistically update local state AND localStorage
    setParents(prevParents => {
      const updated = prevParents.map(p => p.id === parentId ? { ...p, ...updates } : p);
      
      // CRITICAL: Also update localStorage with the updated parents array
      localStorage.setItem('parents', JSON.stringify(updated));
      console.log('✅ Updated parents in state and localStorage');
      
      return updated;
    });
    
    // Sync currentParent in localStorage if this is the logged-in parent
    const storedCurrentParent = localStorage.getItem('currentParent');
    if (storedCurrentParent) {
      const currentParent = JSON.parse(storedCurrentParent);
      if (currentParent.id === parentId) {
        console.log('🔄 Updating currentParent in localStorage with new data');
        const updatedParent = { ...currentParent, ...updates };
        localStorage.setItem('currentParent', JSON.stringify(updatedParent));
      }
    }
    
    // Update in Supabase in background
    parentApi.updateParent(parentId, updates)
      .then(() => {
        console.log('✅ Parent updated in Supabase successfully');
      })
      .catch((error) => {
        console.warn('⚠️ Failed to update parent in Supabase:', error);
        toast.warning('Parent updated locally but not synced to cloud');
      });
  };

  const deleteStudent = (studentId: string) => {
    console.log('🗑️ Deleting student:', studentId);
    
    // Optimistically update local state
    setStudents(prevStudents => prevStudents.filter(s => s.id !== studentId));
    
    // Delete from Supabase in background
    supabaseApi.deleteStudent(studentId)
      .then(() => {
        console.log('✅ Student deleted from Supabase successfully');
        toast.success('Student deleted successfully!');
      })
      .catch((error) => {
        console.warn('⚠️ Failed to delete student from Supabase:', error);
        toast.warning('Student deleted locally but not synced to cloud');
      });
  };

  const updateStudent = (studentId: string, updates: Partial<Student>) => {
    console.log('📝 Updating student:', studentId, updates);
    
    // Optimistically update local state
    setStudents(prevStudents => prevStudents.map(s =>
      s.id === studentId ? { ...s, ...updates } : s
    ));
    
    // Update in Supabase in background
    supabaseApi.updateStudent(studentId, updates)
      .then(() => {
        console.log('✅ Student updated in Supabase successfully');
        toast.success('Student updated successfully!');
      })
      .catch((error) => {
        console.warn('⚠️ Failed to update student in Supabase:', error);
        toast.warning('Student updated locally but not synced to cloud');
      });
  };

  const bulkUpdateParents = async (updatedParents: Parent[]) => {
    // Optimistically update local state
    setParents(updatedParents);
    
    // Update each parent in Supabase in background
    try {
      console.log('🔄 Bulk updating', updatedParents.length, 'parents in Supabase...');
      
      const updatePromises = updatedParents.map(parent => 
        parentApi.updateParent(parent.id, parent)
          .then(() => console.log('✅ Updated parent in Supabase:', parent.name))
          .catch(error => {
            console.warn('⚠️ Failed to update parent in Supabase:', parent.name, error);
            return null;
          })
      );
      
      await Promise.all(updatePromises);
      console.log('✅ Bulk parent update complete');
    } catch (error) {
      console.error('❌ Error during bulk parent update:', error);
      toast.warning('Some changes may not be synced to cloud. Please refresh and try again.');
    }
  };
  
  // Force clear all parent data
  const clearAllParents = () => {
    console.log('🗑️ Clearing all parent data...');
    setParents([]);
    localStorage.setItem('parents', JSON.stringify([]));
    console.log('✅ All parent data cleared');
  };

  const addChildAdditionRequest = (request: Omit<ChildAdditionRequest, 'id' | 'requestDate'>) => {
    const newRequest = {
      ...request,
      id: Date.now().toString(),
      requestDate: new Date()
    };
    
    // Optimistically update local state
    setChildAdditionRequests(prevRequests => [...prevRequests, newRequest]);
    
    // Save to Supabase in background
    const schoolCode = getSchoolCode();
    if (schoolCode) {
      parentApi.createChildRequest(schoolCode, newRequest)
        .then(() => {
          console.log('✅ Child addition request saved to Supabase successfully');
        })
        .catch((error) => {
          console.warn('⚠️ Failed to save child request to Supabase:', error);
          toast.warning('Request created locally but not synced to cloud');
        });
    }
  };

  const updateChildAdditionRequest = (requestId: string, updates: Partial<ChildAdditionRequest>) => {
    console.log('🔄 Updating child request:', requestId, updates);
    console.log('📊 Current requests before update:', childAdditionRequests.map(r => ({ id: r.id, status: r.status })));
    
    // Get the full request data
    const existingRequest = childAdditionRequests.find(r => r.id === requestId);
    if (!existingRequest) {
      console.error('❌ Request not found in local state:', requestId);
      toast.error('Request not found');
      return;
    }
    
    // Optimistically update local state
    setChildAdditionRequests(prevRequests => {
      const updated = prevRequests.map(r => r.id === requestId ? { ...r, ...updates } : r);
      console.log('✅ Requests after update:', updated.map(r => ({ id: r.id, status: r.status })));
      return updated;
    });
    
    // Serialize dates before sending to Supabase
    const serializedUpdates = {
      ...updates,
      reviewDate: updates.reviewDate ? updates.reviewDate.toISOString() : undefined,
      requestDate: updates.requestDate ? updates.requestDate.toISOString() : undefined,
    };
    
    console.log('📤 Sending update to Supabase:', serializedUpdates);
    
    // Update in Supabase in background
    parentApi.updateChildRequest(requestId, serializedUpdates)
      .then(() => {
        console.log('✅ Child request updated in Supabase successfully');
        console.log('📊 Verifying update - request ID:', requestId, 'new status:', updates.status);
        toast.success('Request updated and synced to cloud!');
      })
      .catch((error) => {
        console.error('❌ Error updating child request:', error);
        console.log('🔍 Error message type:', typeof error.message);
        console.log('🔍 Error message value:', error.message);
        console.log('🔍 Full error object:', JSON.stringify(error, null, 2));
        
        // If request not found (404), create it in Supabase first
        const errorMsg = String(error.message || error);
        console.log('🔍 Checking error message:', errorMsg);
        
        if (errorMsg.includes('Request not found') || errorMsg.includes('404') || errorMsg.includes('not found')) {
          console.log('🔧 Request not in Supabase, creating it now...');
          
          // Get school code
          const schoolCode = getSchoolCode();
          
          if (!schoolCode) {
            console.error('❌ Cannot create request: school code not found');
            toast.error('Failed to sync: school code missing');
            return;
          }
          
          console.log('✓ School code found:', schoolCode);
          
          // Prepare the full request data for creation
          const fullRequestData = {
            ...existingRequest,
            ...updates,
            requestDate: existingRequest.requestDate.toISOString(),
            reviewDate: updates.reviewDate ? updates.reviewDate.toISOString() : undefined,
          };
          
          console.log('📦 Creating request in Supabase with data:', fullRequestData);
          
          // Create the request in Supabase (with schoolCode parameter)
          parentApi.createChildRequest(schoolCode, fullRequestData)
            .then(() => {
              console.log('✅ Request created in Supabase and updated successfully!');
              toast.success('Request synced to cloud successfully!', { duration: 3000 });
            })
            .catch((createError) => {
              console.error('❌ Failed to create request in Supabase:', createError);
              toast.error(`Failed to sync: ${createError.message}`);
            });
        } else {
          console.log('❌ Error does not match 404 pattern, not auto-creating');
          console.error('Error details:', {
            requestId,
            updates: serializedUpdates,
            errorMessage: error.message,
            errorStack: error.stack
          });
          toast.error(`Failed to sync to cloud: ${error.message}`);
        }
      });
  };

  const deleteChildAdditionRequest = async (requestId: string) => {
    console.log('🗑️ [DELETE START] Deleting child request:', requestId);
    console.log('📍 [DELETE] Current pendingDeletes:', Array.from(pendingDeletes));
    console.log('📍 [DELETE] Current requests in state:', childAdditionRequests.map(r => r.id));
    
    // Add to pending deletes FIRST to prevent it from coming back during refresh
    setPendingDeletes(prev => {
      const newSet = new Set(prev);
      newSet.add(requestId);
      console.log('🔒 [DELETE] Added to pendingDeletes. Total pending:', newSet.size, 'IDs:', Array.from(newSet));
      return newSet;
    });
    
    // Optimistically update local state
    setChildAdditionRequests(prevRequests => {
      const filtered = prevRequests.filter(r => r.id !== requestId);
      console.log('📊 [DELETE] Local state updated. Before:', prevRequests.length, 'After:', filtered.length);
      console.log('📊 [DELETE] Remaining IDs in state:', filtered.map(r => r.id));
      return filtered;
    });
    
    // Remove from localStorage immediately
    // localStorage disabled - using Supabase only
    console.log('💾 [DELETE] Request deleted from Supabase');
    
    // Delete from Supabase - WAIT for this to complete
    console.log('🌐 [DELETE] Starting Supabase delete API call...');
    try {
      const result = await parentApi.deleteChildRequest(requestId);
      console.log('✅ [DELETE SUCCESS] Child request deleted from Supabase:', result);
      toast.success('Request cancelled successfully!');
      
      // DO NOT remove from pendingDeletes - keep it there permanently to prevent re-fetch
      console.log('🔒 [DELETE] Keeping in pendingDeletes permanently to prevent re-fetch');
    } catch (error) {
      console.error('❌ [DELETE FAILED] Failed to delete child request from Supabase:', error);
      console.log('🔍 [DELETE ERROR] Error details:', {
        requestId,
        errorType: typeof error,
        errorMessage: error.message,
        errorStack: error.stack,
        fullError: error
      });
      toast.error(`Failed to cancel request: ${error.message}`);
      
      // Keep in pending deletes even if failed - prevents it from reappearing
      console.log('⚠️ [DELETE] Keeping in pendingDeletes despite error to prevent re-fetch');
    }
  };

  const refreshChildRequests = useCallback(async () => {
    const schoolCode = getSchoolCode();
    if (schoolCode) {
      try {
        console.log('🔄 Refreshing child requests from Supabase...');
        const supabaseRequests = await parentApi.getChildRequestsBySchool(schoolCode);
        
        if (supabaseRequests && supabaseRequests.length > 0) {
          console.log('✅ Loaded', supabaseRequests.length, 'child requests from Supabase');
          console.log('📋 Request details:', supabaseRequests.map(r => ({ 
            id: r.id, 
            status: r.status, 
            parentId: r.parentId,
            studentName: r.studentName 
          })));
          
          // Filter out requests that are currently being deleted
          const filteredRequests = supabaseRequests.filter(r => !pendingDeletes.has(r.id));
          
          if (filteredRequests.length < supabaseRequests.length) {
            console.log('🚫 Filtered out', supabaseRequests.length - filteredRequests.length, 'pending delete(s)');
          }
          
          const requestsWithDates = filteredRequests.map((request: any) => ({ 
            ...request, 
            requestDate: new Date(request.requestDate),
            reviewDate: request.reviewDate ? new Date(request.reviewDate) : undefined
          }));
          setChildAdditionRequests(requestsWithDates);
        } else {
          // No data in Supabase, check localStorage as fallback
          console.log('⚠️ No child requests in Supabase, checking localStorage...');
          const storedRequests = localStorage.getItem('childAdditionRequests');
          
          if (storedRequests) {
            const localRequests = JSON.parse(storedRequests);
            console.log('📦 Found', localRequests.length, 'requests in localStorage');
            
            // Filter out requests that are currently being deleted
            const filteredRequests = localRequests.filter((r: any) => !pendingDeletes.has(r.id));
            
            const requestsWithDates = filteredRequests.map((request: any) => ({ 
              ...request, 
              requestDate: new Date(request.requestDate),
              reviewDate: request.reviewDate ? new Date(request.reviewDate) : undefined
            }));
            setChildAdditionRequests(requestsWithDates);
            
            // Sync localStorage data to Supabase
            if (localRequests.length > 0) {
              console.log('🔄 Syncing localStorage requests to Supabase...');
              for (const request of localRequests) {
                // Skip syncing if it's being deleted
                if (pendingDeletes.has(request.id)) continue;
                
                try {
                  await parentApi.createChildRequest(schoolCode, request);
                } catch (error) {
                  console.warn('Failed to sync request:', request.id, error);
                }
              }
            }
          } else {
            setChildAdditionRequests([]);
          }
        }
      } catch (error) {
        console.warn('⚠️ Failed to load child requests from Supabase, using localStorage fallback:', error);
        const storedRequests = localStorage.getItem('childAdditionRequests');
        if (storedRequests) {
          const localRequests = JSON.parse(storedRequests);
          
          // Filter out requests that are currently being deleted
          const filteredRequests = localRequests.filter((r: any) => !pendingDeletes.has(r.id));
          
          setChildAdditionRequests(filteredRequests.map((request: any) => ({ 
            ...request, 
            requestDate: new Date(request.requestDate),
            reviewDate: request.reviewDate ? new Date(request.reviewDate) : undefined
          })));
        } else {
          setChildAdditionRequests([]);
        }
      }
    }
  }, [pendingDeletes]); // Add pendingDeletes as dependency

  // Assignee functions
  const addAssignee = (assignee: Omit<Assignee, 'id' | 'createdAt' | 'accessCode'>) => {
    // Generate a more readable access code (12 characters: ASG + random alphanumeric)
    const generateAccessCode = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar looking chars
      let code = 'ASG'; // Prefix to identify assignee codes
      for (let i = 0; i < 9; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };
    
    const generatedAccessCode = generateAccessCode().toUpperCase();
    console.log('🔑 [DATA CONTEXT] Generated access code:', generatedAccessCode);
    
    const newAssignee = {
      ...assignee,
      id: Date.now().toString(),
      createdAt: new Date(),
      accessCode: generatedAccessCode
    };
    
    console.log('💾 [DATA CONTEXT] New assignee object created:', {
      id: newAssignee.id,
      fullName: newAssignee.fullName,
      accessCode: newAssignee.accessCode,
      familyId: newAssignee.familyId
    });
    
    // Optimistically update local state
    setAssignees(prevAssignees => [...prevAssignees, newAssignee]);
    
    // Save to Supabase in background
    const schoolCode = getSchoolCode();
    if (schoolCode) {
      console.log('📤 [DATA CONTEXT] Sending assignee to Supabase with access code:', newAssignee.accessCode);
      parentApi.createAssignee(schoolCode, newAssignee)
        .then(() => {
          console.log('✅ [DATA CONTEXT] Assignee saved to Supabase successfully');
        })
        .catch((error) => {
          console.warn('⚠️ [DATA CONTEXT] Failed to save assignee to Supabase:', error);
          toast.warning('Assignee added locally but not synced to cloud');
        });
    }
    
    // Return full assignee object with accessCode
    console.log('✅ [DATA CONTEXT] Returning assignee with access code:', newAssignee.accessCode);
    return newAssignee;
  };

  const deleteAssignee = (assigneeId: string) => {
    console.log('🗑️ Deleting assignee:', assigneeId);
    
    // Optimistically update local state
    setAssignees(prevAssignees => prevAssignees.filter(a => a.id !== assigneeId));
    
    // Delete from Supabase in background
    parentApi.deleteAssignee(assigneeId)
      .then(() => {
        console.log('✅ Assignee deleted from Supabase successfully');
        toast.success('Assignee deleted successfully!');
      })
      .catch((error) => {
        console.warn('⚠️ Failed to delete assignee from Supabase:', error);
        toast.warning('Assignee deleted locally but not synced to cloud');
      });
  };

  const updateAssignee = (assigneeId: string, updates: Partial<Assignee>) => {
    console.log('🔄 Updating assignee:', assigneeId, updates);
    console.log('📊 Current assignees before update:', assignees.map(a => ({ id: a.id, fullName: a.fullName })));
    
    // Get the full assignee data
    const existingAssignee = assignees.find(a => a.id === assigneeId);
    if (!existingAssignee) {
      console.error('❌ Assignee not found in local state:', assigneeId);
      toast.error('Assignee not found');
      return;
    }
    
    // Optimistically update local state
    setAssignees(prevAssignees => {
      const updated = prevAssignees.map(a => a.id === assigneeId ? { ...a, ...updates } : a);
      console.log('✅ Assignees after update:', updated.map(a => ({ id: a.id, fullName: a.fullName })));
      return updated;
    });
    
    // Update in Supabase in background
    parentApi.updateAssignee(assigneeId, updates)
      .then(() => {
        console.log('✅ Assignee updated in Supabase successfully');
        console.log('📊 Verifying update - assignee ID:', assigneeId, 'new status:', updates.isActive);
        toast.success('Assignee updated and synced to cloud!');
      })
      .catch((error) => {
        console.error('❌ Error updating assignee:', error);
        console.log('🔍 Error message type:', typeof error.message);
        console.log('🔍 Error message value:', error.message);
        console.log('🔍 Full error object:', JSON.stringify(error, null, 2));
        
        // If assignee not found (404), create it in Supabase first
        const errorMsg = String(error.message || error);
        console.log('🔍 Checking error message:', errorMsg);
        
        if (errorMsg.includes('Assignee not found') || errorMsg.includes('404') || errorMsg.includes('not found')) {
          console.log('🔧 Assignee not in Supabase, creating it now...');
          
          // Get school code
          const schoolCode = getSchoolCode();
          
          if (!schoolCode) {
            console.error('❌ Cannot create assignee: school code not found');
            toast.error('Failed to sync: school code missing');
            return;
          }
          
          console.log('✓ School code found:', schoolCode);
          
          // Prepare the full assignee data for creation
          const fullAssigneeData = {
            ...existingAssignee,
            ...updates,
            createdAt: existingAssignee.createdAt.toISOString(),
            expiresAt: existingAssignee.expiresAt.toISOString(),
          };
          
          console.log('📦 Creating assignee in Supabase with data:', fullAssigneeData);
          
          // Create the assignee in Supabase (with schoolCode parameter)
          parentApi.createAssignee(schoolCode, fullAssigneeData)
            .then(() => {
              console.log('✅ Assignee created in Supabase and updated successfully!');
              toast.success('Assignee synced to cloud successfully!', { duration: 3000 });
            })
            .catch((createError) => {
              console.error('❌ Failed to create assignee in Supabase:', createError);
              toast.error(`Failed to sync: ${createError.message}`);
            });
        } else {
          console.log('❌ Error does not match 404 pattern, not auto-creating');
          console.error('Error details:', {
            assigneeId,
            updates: updates,
            errorMessage: error.message,
            errorStack: error.stack
          });
          toast.error(`Failed to sync to cloud: ${error.message}`);
        }
      });
  };

  const getAssigneeByAccessCode = (accessCode: string) => {
    return assignees.find(a => a.accessCode.toUpperCase() === accessCode.toUpperCase());
  };

  const getActiveAssigneesForFamily = (familyId: string) => {
    return assignees.filter(a => a.familyId === familyId && a.isActive);
  };

  // Security Personnel Functions
  const addSecurityPersonnel = (personnel: Omit<SecurityPersonnel, 'id' | 'createdAt'>) => {
    const schoolCode = getSchoolCode();
    const newPersonnel: SecurityPersonnel = {
      ...personnel,
      id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };

    setSecurityPersonnel(prev => [...prev, newPersonnel]);

    // Save to Supabase
    supabaseApi.createSecurityPersonnel(schoolCode, newPersonnel)
      .then(() => {
        console.log('✅ Security personnel saved to Supabase');
        toast.success(`Security personnel ${newPersonnel.fullName} created successfully`);
      })
      .catch((error) => {
        console.error('❌ Failed to save security personnel to Supabase:', error);
        toast.error('Failed to save security personnel');
      });
  };

  const deleteSecurityPersonnel = (personnelId: string) => {
    const schoolCode = getSchoolCode();
    setSecurityPersonnel(prev => prev.filter(p => p.id !== personnelId));

    // Delete from Supabase
    supabaseApi.deleteSecurityPersonnel(schoolCode, personnelId)
      .then(() => {
        console.log('✅ Security personnel deleted from Supabase');
        toast.success('Security personnel removed');
      })
      .catch((error) => {
        console.error('❌ Failed to delete security personnel from Supabase:', error);
        toast.error('Failed to delete security personnel');
      });
  };

  const updateSecurityPersonnel = (personnelId: string, updates: Partial<SecurityPersonnel>) => {
    const schoolCode = getSchoolCode();
    setSecurityPersonnel(prev =>
      prev.map(p => (p.id === personnelId ? { ...p, ...updates } : p))
    );

    // Update in Supabase
    supabaseApi.updateSecurityPersonnel(schoolCode, personnelId, updates)
      .then(() => {
        console.log('✅ Security personnel updated in Supabase');
        toast.success('Security personnel updated');
      })
      .catch((error) => {
        console.error('❌ Failed to update security personnel in Supabase:', error);
        toast.error('Failed to update security personnel');
      });
  };

  const getSecurityByCredentials = (username: string, password: string): SecurityPersonnel | undefined => {
    return securityPersonnel.find(
      p => p.username === username && p.password === password && p.isActive
    );
  };

  return (
    <DataContext.Provider
      value={{
        students,
        parents,
        attendanceLogs,
        childAdditionRequests,
        assignees,
        securityPersonnel,
        classes,
        loading,
        addStudent,
        addParent,
        updateParentChildren,
        addAttendanceLog,
        updateParentPassword,
        getParentByCredentials,
        getStudentsByIds,
        deleteParent,
        deleteFamily,
        updateParent,
        deleteStudent,
        updateStudent,
        bulkUpdateParents,
        addChildAdditionRequest,
        updateChildAdditionRequest,
        deleteChildAdditionRequest,
        refreshChildRequests,
        // Assignee functions
        addAssignee,
        deleteAssignee,
        updateAssignee,
        getAssigneeByAccessCode,
        getActiveAssigneesForFamily,
        // Security functions
        addSecurityPersonnel,
        deleteSecurityPersonnel,
        updateSecurityPersonnel,
        getSecurityByCredentials
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}