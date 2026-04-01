import React, { createContext, useContext, useState, useEffect } from 'react';
import { Parent } from './DataContext';

export interface School {
  id: string;
  name: string;
  username: string;
  password: string;
  schoolCode: string;
  email: string;
  phone: string;
  address: string;
  logo?: string; // School logo image
}

export interface Assignee {
  id: string;
  parentId: string;
  parentName: string;
  familyId: string;
  childrenIds: string[];
  fullName: string;
  photo: string;
  phoneNumber: string;
  idType: 'NIN' | 'Drivers License' | 'Passport';
  idNumber: string;
  idPhoto: string;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  schoolCode: string;
  accessCode: string;
}

export interface SecurityPersonnel {
  id: string;
  schoolCode: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  photo: string;
  username: string;
  password: string;
  createdAt: Date;
  isActive: boolean;
  createdBy: string;
}

interface AuthContextType {
  isAdmin: boolean;
  currentParent: Parent | null;
  currentSchool: School | null;
  assignee: Assignee | null;
  security: SecurityPersonnel | null;
  user: { email: string } | null;
  isLoading: boolean;
  adminLogin: (username: string, password: string) => boolean;
  schoolLogin: (school: School) => void;
  parentLogin: (parent: Parent) => void;
  assigneeLogin: (assignee: Assignee) => void;
  securityLogin: (security: SecurityPersonnel) => void;
  updateSchoolPassword: (newPassword: string) => void;
  updateCurrentParent: (updates: Partial<Parent>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentParent, setCurrentParent] = useState<Parent | null>(null);
  const [currentSchool, setCurrentSchool] = useState<School | null>(null);
  const [assignee, setAssignee] = useState<Assignee | null>(null);
  const [security, setSecurity] = useState<SecurityPersonnel | null>(null);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedAdmin = localStorage.getItem('isAdmin');
    const storedParent = localStorage.getItem('currentParent');
    const storedSchool = localStorage.getItem('currentSchool');
    const storedAssignee = sessionStorage.getItem('assigneeData');
    const storedSecurity = sessionStorage.getItem('securityData');
    const lastActivity = localStorage.getItem('lastActivityTime');
    
    // Check if session has expired (5 days = 432000000 milliseconds)
    const SESSION_EXPIRY = 5 * 24 * 60 * 60 * 1000; // 5 days in milliseconds
    const now = Date.now();
    
    if (lastActivity) {
      const timeSinceLastActivity = now - parseInt(lastActivity);
      
      // If more than 5 days of inactivity, clear parent session
      if (timeSinceLastActivity > SESSION_EXPIRY && storedParent) {
        localStorage.removeItem('currentParent');
        localStorage.removeItem('lastActivityTime');
        return; // Don't restore parent session
      }
    }
    
    // Restore sessions if not expired
    if (storedAdmin === 'true') setIsAdmin(true);
    if (storedParent) {
      const parent = JSON.parse(storedParent);
      
      // Restore schoolCode from separate storage if not in parent object
      if (!parent.schoolCode) {
        const storedSchoolCode = localStorage.getItem('currentParentSchoolCode');
        if (storedSchoolCode) {
          parent.schoolCode = storedSchoolCode;
          console.log('✅ [SESSION] Restored schoolCode to parent:', storedSchoolCode);
        }
      }
      
      setCurrentParent(parent);
      // Update last activity time on session restore
      localStorage.setItem('lastActivityTime', now.toString());
    }
    if (storedSchool) setCurrentSchool(JSON.parse(storedSchool));
    
    // Restore assignee session
    if (storedAssignee) {
      try {
        const assigneeData = JSON.parse(storedAssignee);
        console.log('✅ [SESSION] Restored assignee session:', assigneeData.fullName);
        console.log('🏫 [SESSION] Assignee schoolCode:', assigneeData.schoolCode);
        setAssignee(assigneeData);
      } catch (error) {
        console.error('❌ [SESSION] Failed to restore assignee session:', error);
        sessionStorage.removeItem('assigneeData');
      }
    }
    
    // Restore security session
    if (storedSecurity) {
      try {
        const securityData = JSON.parse(storedSecurity);
        console.log('✅ [SESSION] Restored security session:', securityData.fullName);
        console.log('🏫 [SESSION] Security schoolCode:', securityData.schoolCode);
        console.log('📧 [SESSION] Security email:', securityData.email);
        setSecurity(securityData);
        setUser({ email: securityData.email });
      } catch (error) {
        console.error('❌ [SESSION] Failed to restore security session:', error);
        sessionStorage.removeItem('securityData');
      }
    } else {
      console.log('ℹ️ [SESSION] No security session found in sessionStorage');
    }
    
    setIsLoading(false);
  }, []);

  const adminLogin = (username: string, password: string) => {
    // Simple admin check - username: admin, password: admin123
    if (username === 'admin' && password === 'admin123') {
      setIsAdmin(true);
      localStorage.setItem('isAdmin', 'true');
      return true;
    }
    return false;
  };

  const schoolLogin = (school: School) => {
    setCurrentSchool(school);
    setIsAdmin(true);
    localStorage.setItem('currentSchool', JSON.stringify(school));
    localStorage.setItem('isAdmin', 'true');
  };

  const parentLogin = (parent: Parent) => {
    setCurrentParent(parent);
    localStorage.setItem('currentParent', JSON.stringify(parent));
    // Set initial activity time for session tracking
    localStorage.setItem('lastActivityTime', Date.now().toString());
  };

  const assigneeLogin = (assigneeData: Assignee) => {
    console.log('✅ [AUTH] Assignee login:', assigneeData.fullName);
    console.log('🏫 [AUTH] Assignee schoolCode:', assigneeData.schoolCode);
    
    // Ensure schoolCode is present
    if (!assigneeData.schoolCode) {
      console.error('❌ [AUTH] Assignee missing schoolCode!');
    }
    
    setAssignee(assigneeData);
    sessionStorage.setItem('assigneeData', JSON.stringify(assigneeData));
  };

  const securityLogin = (securityData: SecurityPersonnel) => {
    console.log('✅ [AUTH] Security login:', securityData.fullName);
    console.log('🏫 [AUTH] Security schoolCode:', securityData.schoolCode);
    
    // Ensure schoolCode is present
    if (!securityData.schoolCode) {
      console.error('❌ [AUTH] Security missing schoolCode!');
    }
    
    setSecurity(securityData);
    setUser({ email: securityData.email });
    sessionStorage.setItem('securityData', JSON.stringify(securityData));
    // Also store schoolCode separately for easier access
    if (securityData.schoolCode) {
      sessionStorage.setItem('schoolCode', securityData.schoolCode);
    }
  };

  const updateSchoolPassword = (newPassword: string) => {
    if (currentSchool) {
      const updatedSchool = { ...currentSchool, password: newPassword };
      setCurrentSchool(updatedSchool);
      localStorage.setItem('currentSchool', JSON.stringify(updatedSchool));
      
      // Update in schools list in localStorage
      const schools = JSON.parse(localStorage.getItem('schools') || '[]');
      const updatedSchools = schools.map((s: School) => 
        s.id === currentSchool.id ? updatedSchool : s
      );
      localStorage.setItem('schools', JSON.stringify(updatedSchools));
    }
  };

  const updateCurrentParent = (updates: Partial<Parent>) => {
    if (currentParent) {
      const updatedParent = { ...currentParent, ...updates };
      setCurrentParent(updatedParent);
      localStorage.setItem('currentParent', JSON.stringify(updatedParent));
    }
  };

  const logout = () => {
    setIsAdmin(false);
    setCurrentParent(null);
    setCurrentSchool(null);
    setAssignee(null);
    setSecurity(null);
    setUser(null);
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('currentParent');
    localStorage.removeItem('currentSchool');
    localStorage.removeItem('lastActivityTime');
    sessionStorage.removeItem('assigneeData');
    sessionStorage.removeItem('securityData');
    // Note: We keep currentParentSchoolCode so parent is redirected to correct school login
  };

  return (
    <AuthContext.Provider value={{ 
      isAdmin, 
      currentParent, 
      currentSchool, 
      assignee,
      security,
      user,
      isLoading,
      adminLogin, 
      schoolLogin, 
      parentLogin,
      assigneeLogin, 
      securityLogin,
      updateSchoolPassword, 
      updateCurrentParent,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    // During hot module reload, context might be temporarily undefined
    // Return a mock context to prevent crashes
    if (process.env.NODE_ENV === 'development') {
      console.warn('useAuth called outside AuthProvider - this may be due to hot reload');
    }
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}