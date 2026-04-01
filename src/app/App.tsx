import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from '@/contexts/DataContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';

// Eagerly load all pages
import Landing from '@/pages/Landing';
import AdminLogin from '@/pages/admin/AdminLogin';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AddStudent from '@/pages/admin/AddStudent';
import AddParent from '@/pages/admin/AddParent';
import SchoolLogin from '@/pages/school/SchoolLogin';
import ParentLogin from '@/pages/parent/ParentLogin';
import ParentLoginRedirect from '@/pages/parent/ParentLoginRedirect';
import SchoolParentLogin from '@/pages/parent/SchoolParentLogin';
import ParentDashboard from '@/pages/parent/ParentDashboard';
import ParentRegister from '@/pages/parent/ParentRegister';
import AssigneeLogin from '@/pages/parent/AssigneeLogin';
import AssigneeDashboard from '@/pages/parent/AssigneeDashboard';
import SuperAdminLogin from '@/pages/super-admin/SuperAdminLogin';
import SuperAdminDashboard from '@/pages/super-admin/SuperAdminDashboard';
import SecurityManagement from '@/pages/school-admin/SecurityManagement';
import SecurityLogin from '@/pages/security/SecurityLogin';
import SecurityDashboard from '@/pages/security/SecurityDashboard';

// Clocka - Premium School Attendance SaaS Platform
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <Toaster position="top-right" richColors />
          <Routes>
            {/* Landing Page */}
            <Route path="/" element={<Landing />} />
            
            {/* Super Admin Routes */}
            <Route path="/super-admin/login" element={<SuperAdminLogin />} />
            <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
            
            {/* School Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/school/:schoolCode/login" element={<SchoolLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/add-student" element={<AddStudent />} />
            <Route path="/admin/add-parent" element={<AddParent />} />
            <Route path="/school-admin/security-management" element={<SecurityManagement />} />
            
            {/* Parent Routes */}
            <Route path="/parent/login" element={<ParentLoginRedirect />} />
            <Route path="/parent/login-old" element={<ParentLogin />} />
            <Route path="/school/:schoolCode/parent-login" element={<SchoolParentLogin />} />
            <Route path="/parent/dashboard" element={<ParentDashboard />} />
            <Route path="/parent/register" element={<ParentRegister />} />
            
            {/* Assignee Routes */}
            <Route path="/assignee/login" element={<AssigneeLogin />} />
            <Route path="/school/:schoolCode/assignee-login" element={<AssigneeLogin />} />
            <Route path="/assignee/dashboard" element={<AssigneeDashboard />} />
            
            {/* Security Routes */}
            <Route path="/school/:schoolCode/security-login" element={<SecurityLogin />} />
            <Route path="/security/dashboard" element={<SecurityDashboard />} />
            
            {/* Fallback - Redirect to Landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
