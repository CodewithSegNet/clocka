import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, LogOut, Calendar, Search, Users, Clock, FileText, Download, Eye, ChevronDown, ChevronUp, Building2, Filter, ClipboardList, UserCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/app/components/ui/button';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import * as supabaseApi from '@/utils/supabaseApi';
import Badge from '@/components/Badge';
import ImageViewerModal from '@/components/ImageViewerModal';
import SecurityAttendanceTable from '@/components/SecurityAttendanceTable';
import type { AttendanceLog, Assignee, Student } from '@/contexts/DataContext';

export default function SecurityDashboard() {
  const navigate = useNavigate();
  const { security, logout, isLoading } = useAuth();
  const { attendanceLogs, assignees, students, getStudentsByIds, parents } = useData();
  
  const [activeTab, setActiveTab] = useState<'attendance' | 'assignees'>('attendance');
  const [searchQuery, setSearchQuery] = useState('');
  const [schoolInfo, setSchoolInfo] = useState<any>(null);

  // Attendance filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'early' | 'late'>('all');
  const [tagFilter, setTagFilter] = useState<'all' | 'present' | 'incomplete' | 'absent'>('all');

  // Assignee filters
  const [assigneeStatusFilter, setAssigneeStatusFilter] = useState<'all' | 'active' | 'expired'>('all');

  const [imageViewer, setImageViewer] = useState<{ isOpen: boolean; imageUrl: string; title: string; subtitle?: string }>({
    isOpen: false,
    imageUrl: '',
    title: '',
    subtitle: ''
  });

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if no security session (use useEffect to avoid navigation during render)
  useEffect(() => {
    if (!isLoading && !security) {
      console.log('❌ [SECURITY DASHBOARD] No security session, redirecting to login');
      navigate(`/school/${sessionStorage.getItem('schoolCode')}/security-login`, { replace: true });
    }
  }, [isLoading, security, navigate]);

  // If no security, show loading while redirecting
  if (!security) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Load school information
  useEffect(() => {
    async function loadSchoolInfo() {
      try {
        const schoolCode = security.schoolCode || sessionStorage.getItem('schoolCode');
        if (!schoolCode) return;

        console.log('📡 Loading school info for dashboard:', schoolCode);
        
        // Try Supabase first
        const school = await supabaseApi.getSchoolInfo(schoolCode);
        
        if (school) {
          console.log('✅ School info loaded:', school.name);
          setSchoolInfo(school);
        } else {
          // Fallback to localStorage
          const storedSchoolInfo = localStorage.getItem('schoolInfo');
          const storedSchoolCode = localStorage.getItem('schoolCode');
          
          if (storedSchoolInfo && storedSchoolCode === schoolCode) {
            const localSchool = JSON.parse(storedSchoolInfo);
            setSchoolInfo({
              id: schoolCode,
              schoolCode: schoolCode,
              name: localSchool.name || 'School',
              logo: localSchool.logo || '',
            });
          }
        }
      } catch (error) {
        console.error('Error loading school info:', error);
      }
    }

    loadSchoolInfo();
  }, [security]);

  // Filter today's attendance logs
  const todayLogs = attendanceLogs.filter(log => {
    const logDate = new Date(log.timestamp);
    const today = new Date();
    return logDate.toDateString() === today.toDateString();
  });

  // Group logs by unique action (each log entry represents one action) - SAME AS SCHOOL ADMIN
  const groupedRecords = useMemo(() => {
    const groupedLogs = new Map();
    todayLogs.forEach(log => {
      const dateKey = new Date(log.timestamp).toDateString();
      // Create unique key based on log ID to ensure each action is separate
      const key = log.id;
      
      if (!groupedLogs.has(key)) {
        // Find parent to get their photo
        const parentRecord = parents.find(p => p.id === log.parentId);
        
        groupedLogs.set(key, {
          parentId: log.parentId,
          parentName: log.parentName,
          parentPhoto: log.parentPhoto || parentRecord?.photo || '', // Use log's parent photo first, then fallback to parent record
          children: log.childrenNames, // Specific children in THIS action
          childrenIds: log.childrenIds, // IDs of children in THIS action
          date: dateKey,
          clockIn: log.type === 'clock-in' ? log.timestamp : null,
          clockOut: log.type === 'clock-out' ? log.timestamp : null,
          clockInFaceImage: log.type === 'clock-in' ? log.faceImage : null,
          clockOutFaceImage: log.type === 'clock-out' ? log.faceImage : null,
          // Assignee information
          assigneeId: log.assigneeId,
          assigneeName: log.assigneeName,
          assigneePhoto: log.assigneePhoto,
          assignedBy: log.assignedBy,
          assignedByName: log.assignedByName,
          assignedByPhoto: log.assignedByPhoto,
          // Store action type for display
          actionType: log.type
        });
      }
    });

    // Sort by timestamp (most recent first)
    return Array.from(groupedLogs.values()).sort((a, b) => {
      const timeA = a.clockIn || a.clockOut;
      const timeB = b.clockIn || b.clockOut;
      return new Date(timeB).getTime() - new Date(timeA).getTime();
    });
  }, [todayLogs, parents]);

  // Apply filters and search for attendance
  const filteredAttendanceRecords = useMemo(() => {
    let records = [...groupedRecords];

    // Apply status filter (Early/Late)
    if (statusFilter !== 'all') {
      records = records.filter(record => {
        if (!record.clockIn) return false;
        const clockInTime = new Date(record.clockIn);
        const isLate = clockInTime.getHours() > 8 || (clockInTime.getHours() === 8 && clockInTime.getMinutes() > 0);
        
        if (statusFilter === 'early') return !isLate;
        if (statusFilter === 'late') return isLate;
        return true;
      });
    }

    // Apply tag filter (Present/Incomplete/Absent)
    if (tagFilter !== 'all') {
      records = records.filter(record => {
        const hasClockIn = !!record.clockIn;
        const hasClockOut = !!record.clockOut;

        if (tagFilter === 'present') return hasClockIn && hasClockOut;
        if (tagFilter === 'incomplete') return hasClockIn && !hasClockOut;
        if (tagFilter === 'absent') return !hasClockIn && !hasClockOut;
        return true;
      });
    }

    // Apply search
    if (searchQuery) {
      records = records.filter(record => 
        record.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.children.some((child: string) => child.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return records;
  }, [groupedRecords, statusFilter, tagFilter, searchQuery]);

  // Calculate counts for filter chips
  const attendanceCounts = useMemo(() => {
    const early = groupedRecords.filter(record => {
      if (!record.clockIn) return false;
      const clockInTime = new Date(record.clockIn);
      return clockInTime.getHours() < 8 || (clockInTime.getHours() === 8 && clockInTime.getMinutes() === 0);
    }).length;

    const late = groupedRecords.filter(record => {
      if (!record.clockIn) return false;
      const clockInTime = new Date(record.clockIn);
      return clockInTime.getHours() > 8 || (clockInTime.getHours() === 8 && clockInTime.getMinutes() > 0);
    }).length;

    const present = groupedRecords.filter(record => record.clockIn && record.clockOut).length;
    const incomplete = groupedRecords.filter(record => record.clockIn && !record.clockOut).length;
    const absent = groupedRecords.filter(record => !record.clockIn && !record.clockOut).length;

    return { early, late, present, incomplete, absent };
  }, [groupedRecords]);

  // Filter today's assignees
  const todayAssignees = assignees.filter(assignee => {
    const assigneeDate = new Date(assignee.createdAt);
    const today = new Date();
    return assigneeDate.toDateString() === today.toDateString();
  });

  // Apply filters for assignees
  const filteredAssignees = useMemo(() => {
    let filtered = [...todayAssignees];

    // Apply status filter
    if (assigneeStatusFilter !== 'all') {
      filtered = filtered.filter(assignee => {
        const expiresAt = new Date(assignee.expiresAt);
        const isExpired = expiresAt < new Date();
        
        if (assigneeStatusFilter === 'active') return !isExpired;
        if (assigneeStatusFilter === 'expired') return isExpired;
        return true;
      });
    }

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(assignee =>
        assignee.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignee.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignee.phoneNumber.includes(searchQuery)
      );
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [todayAssignees, assigneeStatusFilter, searchQuery]);

  // Calculate assignee counts
  const assigneeCounts = useMemo(() => {
    const active = todayAssignees.filter(assignee => {
      const expiresAt = new Date(assignee.expiresAt);
      return expiresAt >= new Date();
    }).length;

    const expired = todayAssignees.filter(assignee => {
      const expiresAt = new Date(assignee.expiresAt);
      return expiresAt < new Date();
    }).length;

    return { active, expired };
  }, [todayAssignees]);

  const handleLogout = () => {
    logout();
    navigate(`/school/${security.schoolCode}/security-login`);
  };

  const generateAssigneePDF = (assignee: Assignee) => {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Header - Clocka branding
      pdf.setFillColor(37, 99, 235);
      pdf.rect(0, 0, pageWidth, 40, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Clocka', pageWidth / 2, 20, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Assignee Schedule', pageWidth / 2, 32, { align: 'center' });

      pdf.setTextColor(0, 0, 0);

      let yPos = 55;

      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TEMPORARY PICK-UP AUTHORIZATION', pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

      pdf.setFillColor(254, 243, 199);
      pdf.rect(10, yPos, pageWidth - 20, 15, 'F');
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(146, 64, 14);
      pdf.text('🔒 FOR SECURITY USE ONLY - VERIFY ALL DETAILS BEFORE RELEASE', pageWidth / 2, yPos + 10, { align: 'center' });
      pdf.setTextColor(0, 0, 0);
      yPos += 25;

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Authorized Person:', 15, yPos);
      yPos += 10;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Full Name: ${assignee.fullName}`, 20, yPos);
      yPos += 8;
      pdf.text(`Phone Number: ${assignee.phoneNumber}`, 20, yPos);
      yPos += 8;
      pdf.text(`ID Type: ${assignee.idType}`, 20, yPos);
      yPos += 8;
      pdf.text(`ID Number: ${assignee.idNumber}`, 20, yPos);
      yPos += 8;
      pdf.text(`Access Code: ${assignee.accessCode}`, 20, yPos);
      pdf.setFont('helvetica', 'bold');
      yPos += 15;

      pdf.setFillColor(239, 246, 255);
      pdf.rect(10, yPos, pageWidth - 20, 40, 'F');
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(29, 78, 216);
      pdf.text('⚠️ PARENT CONTACT FOR CONFIRMATION:', 15, yPos + 8);
      pdf.setTextColor(0, 0, 0);
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Parent Name: ${assignee.parentName}`, 20, yPos + 18);
      if (assignee.parentEmail) {
        pdf.text(`Parent Email: ${assignee.parentEmail}`, 20, yPos + 26);
      }
      if (assignee.parentPhone) {
        pdf.text(`Parent Phone: ${assignee.parentPhone}`, 20, yPos + 34);
      }
      yPos += 50;

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Authorized to Pick Up:', 15, yPos);
      yPos += 10;

      const children = getStudentsByIds(assignee.childrenIds);
      children.forEach((child, index) => {
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${index + 1}. ${child.name} - ${child.class} (Age: ${child.age})`, 20, yPos);
        yPos += 8;
      });

      yPos += 10;

      pdf.setFillColor(220, 252, 231);
      pdf.rect(10, yPos, pageWidth - 20, 25, 'F');
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(22, 101, 52);
      pdf.text('⏱️ VALIDITY PERIOD:', 15, yPos + 10);
      pdf.setTextColor(0, 0, 0);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Created: ${new Date(assignee.createdAt).toLocaleString()}`, 20, yPos + 20);
      
      const expiresAt = new Date(assignee.expiresAt);
      const isExpired = expiresAt < new Date();
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(isExpired ? 220 : 22, isExpired ? 38 : 101, isExpired ? 38 : 52);
      pdf.text(`Expires: ${expiresAt.toLocaleString()} ${isExpired ? '(EXPIRED)' : ''}`, 20, yPos + 28);
      pdf.setTextColor(0, 0, 0);
      yPos += 40;

      pdf.setFillColor(240, 240, 240);
      pdf.rect(10, yPos, pageWidth - 20, 50, 'F');
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SECURITY VERIFICATION:', 15, yPos + 10);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('☐ Photo ID verified and matches system photo', 20, yPos + 20);
      pdf.text('☐ Parent contacted and confirmed authorization', 20, yPos + 28);
      pdf.text('☐ Access code verified in system', 20, yPos + 36);
      pdf.text('☐ Child(ren) released at: ____________ Time: ____________', 20, yPos + 44);
      yPos += 60;

      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 15, pageHeight - 20);
      pdf.text(`Security Personnel: ${security.fullName}`, 15, pageHeight - 14);
      pdf.text('Powered by Clocka - Secure Attendance Management', pageWidth / 2, pageHeight - 10, { align: 'center' });

      pdf.save(`Assignee_${assignee.fullName.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {schoolInfo?.logo ? (
                <div className="w-12 h-12 rounded-full overflow-hidden bg-white shadow-md">
                  <img
                    src={schoolInfo.logo}
                    alt={schoolInfo.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                  <Shield className="w-7 h-7 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {schoolInfo?.name || 'Security Dashboard'}
                </h1>
                <p className="text-sm text-gray-500">Welcome, {security.fullName}</p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => {
                setActiveTab('attendance');
                setSearchQuery('');
              }}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                activeTab === 'attendance'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-5 h-5" />
                <span>Daily Attendance Log</span>
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('assignees');
                setSearchQuery('');
              }}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                activeTab === 'assignees'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Users className="w-5 h-5" />
                <span>Assignee Management</span>
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'attendance' ? (
          <AttendanceTab 
            groupedRecords={groupedRecords}
            filteredRecords={filteredAttendanceRecords}
            counts={attendanceCounts}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            tagFilter={tagFilter}
            setTagFilter={setTagFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            getStudentsByIds={getStudentsByIds}
            parents={parents}
            imageViewer={imageViewer}
            setImageViewer={setImageViewer}
          />
        ) : (
          <AssigneeTab 
            todayAssignees={todayAssignees}
            filteredAssignees={filteredAssignees}
            counts={assigneeCounts}
            statusFilter={assigneeStatusFilter}
            setStatusFilter={setAssigneeStatusFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            getStudentsByIds={getStudentsByIds}
            onGeneratePDF={generateAssigneePDF}
          />
        )}
      </div>

      {/* Image Viewer Modal */}
      <ImageViewerModal
        isOpen={imageViewer.isOpen}
        imageUrl={imageViewer.imageUrl}
        title={imageViewer.title}
        subtitle={imageViewer.subtitle}
        onClose={() => setImageViewer({ isOpen: false, imageUrl: '', title: '', subtitle: '' })}
      />
    </div>
  );
}

// Attendance Tab Component
interface AttendanceTabProps {
  groupedRecords: any[];
  filteredRecords: any[];
  counts: any;
  statusFilter: 'all' | 'early' | 'late';
  setStatusFilter: (filter: 'all' | 'early' | 'late') => void;
  tagFilter: 'all' | 'present' | 'incomplete' | 'absent';
  setTagFilter: (filter: 'all' | 'present' | 'incomplete' | 'absent') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  getStudentsByIds: (ids: string[]) => Student[];
  parents: any[];
  imageViewer: any;
  setImageViewer: any;
}

function AttendanceTab({ 
  groupedRecords, 
  filteredRecords, 
  counts, 
  statusFilter, 
  setStatusFilter, 
  tagFilter, 
  setTagFilter,
  searchQuery,
  setSearchQuery,
  getStudentsByIds,
  parents,
  imageViewer,
  setImageViewer
}: AttendanceTabProps) {
  return (
    <div>
      {/* Header Card */}
      <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-200 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Today's Attendance Records</h3>
            <p className="text-sm text-gray-600">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} - All attendance for today
            </p>
          </div>
        </div>

        {/* Filter Chips Row 1 - Status */}
        <div className="flex items-center gap-4 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">Status:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setStatusFilter('early')}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors flex items-center gap-1 ${
                statusFilter === 'early' 
                  ? 'bg-emerald-500 text-white shadow-md' 
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${statusFilter === 'early' ? 'bg-white' : 'bg-emerald-500'}`}></div>
              Early ({counts.early})
            </button>
            <button 
              onClick={() => setStatusFilter('late')}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors flex items-center gap-1 ${
                statusFilter === 'late' 
                  ? 'bg-red-500 text-white shadow-md' 
                  : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${statusFilter === 'late' ? 'bg-white' : 'bg-red-500'}`}></div>
              Late ({counts.late})
            </button>
          </div>
        </div>

        {/* Filter Chips Row 2 - Tags */}
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm font-semibold text-gray-700">Tags:</span>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setTagFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                tagFilter === 'all' 
                  ? 'bg-gray-700 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({groupedRecords.length})
            </button>
            <button 
              onClick={() => setTagFilter('present')}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors flex items-center gap-1 ${
                tagFilter === 'present' 
                  ? 'bg-green-500 text-white shadow-md' 
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${tagFilter === 'present' ? 'bg-white' : 'bg-green-500'}`}></div>
              Present ({counts.present})
            </button>
            <button 
              onClick={() => setTagFilter('incomplete')}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors flex items-center gap-1 ${
                tagFilter === 'incomplete' 
                  ? 'bg-yellow-500 text-white shadow-md' 
                  : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${tagFilter === 'incomplete' ? 'bg-white' : 'bg-yellow-500'}`}></div>
              Incomplete ({counts.incomplete})
            </button>
            <button 
              onClick={() => setTagFilter('absent')}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors flex items-center gap-1 ${
                tagFilter === 'absent' 
                  ? 'bg-gray-500 text-white shadow-md' 
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${tagFilter === 'absent' ? 'bg-white' : 'bg-gray-500'}`}></div>
              Absent ({counts.absent})
            </button>
          </div>
        </div>

        {/* Search & Record Count */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by parent or child name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {statusFilter !== 'all' && (
                <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-md">
                  Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                </span>
              )}
              {tagFilter !== 'all' && (
                <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-md">
                  Tag: {tagFilter.charAt(0).toUpperCase() + tagFilter.slice(1)}
                </span>
              )}
              {(statusFilter !== 'all' || tagFilter !== 'all') && (
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setTagFilter('all');
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline"
                >
                  Clear filters
                </button>
              )}
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredRecords.length}</span> of <span className="font-semibold text-gray-900">{groupedRecords.length}</span> records
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Records */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-gray-200 shadow-sm">
          <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">
            {groupedRecords.length === 0 ? 'No attendance records found' : 'No records match the current filters'}
          </p>
          <p className="text-sm text-gray-400">
            {groupedRecords.length === 0 
              ? 'Attendance records will appear here when parents clock in/out'
              : 'Try adjusting your filters to see more results'
            }
          </p>
          {(statusFilter !== 'all' || tagFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setTagFilter('all');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <SecurityAttendanceTable
          filteredRecords={filteredRecords}
          groupedRecords={groupedRecords}
          parents={parents}
          setImageViewer={setImageViewer}
          statusFilter={statusFilter}
          tagFilter={tagFilter}
          searchQuery={searchQuery}
          setStatusFilter={setStatusFilter}
          setTagFilter={setTagFilter}
          setSearchQuery={setSearchQuery}
        />
      )}
    </div>
  );
}

// Assignee Tab Component
interface AssigneeTabProps {
  todayAssignees: Assignee[];
  filteredAssignees: Assignee[];
  counts: any;
  statusFilter: 'all' | 'active' | 'expired';
  setStatusFilter: (filter: 'all' | 'active' | 'expired') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  getStudentsByIds: (ids: string[]) => Student[];
  onGeneratePDF: (assignee: Assignee) => void;
}

function AssigneeTab({ 
  todayAssignees,
  filteredAssignees, 
  counts,
  statusFilter,
  setStatusFilter,
  searchQuery,
  setSearchQuery,
  getStudentsByIds, 
  onGeneratePDF 
}: AssigneeTabProps) {
  const [documentViewer, setDocumentViewer] = useState<{ isOpen: boolean; imageUrl: string; title: string; subtitle?: string }>({
    isOpen: false,
    imageUrl: '',
    title: '',
    subtitle: ''
  });

  return (
    <div>
      {/* Header Card */}
      <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-200 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Today's Records</h3>
            <p className="text-sm text-gray-600">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} - All assignees created today
            </p>
          </div>
        </div>

        {/* Filter Chips - Status */}
        <div className="flex items-center gap-4 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">Status:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                statusFilter === 'all' 
                  ? 'bg-gray-700 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({todayAssignees.length})
            </button>
            <button 
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors flex items-center gap-1 ${
                statusFilter === 'active' 
                  ? 'bg-green-500 text-white shadow-md' 
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${statusFilter === 'active' ? 'bg-white' : 'bg-green-500'}`}></div>
              Active ({counts.active})
            </button>
            <button 
              onClick={() => setStatusFilter('expired')}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors flex items-center gap-1 ${
                statusFilter === 'expired' 
                  ? 'bg-red-500 text-white shadow-md' 
                  : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${statusFilter === 'expired' ? 'bg-white' : 'bg-red-500'}`}></div>
              Expired ({counts.expired})
            </button>
          </div>
        </div>

        {/* Search & Record Count */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone, or parent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {statusFilter !== 'all' && (
                <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-md">
                  Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                </span>
              )}
              {(statusFilter !== 'all') && (
                <button
                  onClick={() => setStatusFilter('all')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline"
                >
                  Clear filters
                </button>
              )}
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredAssignees.length}</span> of <span className="font-semibold text-gray-900">{todayAssignees.length}</span> records
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Assignee Records */}
      {filteredAssignees.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-gray-200 shadow-sm">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">
            {todayAssignees.length === 0 ? 'No assignees found' : 'No records match the current filters'}
          </p>
          <p className="text-sm text-gray-400">
            {todayAssignees.length === 0 
              ? 'Assignee records will appear here when parents create temporary pick-up authorizations'
              : 'Try adjusting your filters to see more results'
            }
          </p>
          {(statusFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAssignees.map((assignee) => {
            const children = getStudentsByIds(assignee.childrenIds);
            const expiresAt = new Date(assignee.expiresAt);
            const isExpired = expiresAt < new Date();
            const now = new Date();
            const timeRemaining = expiresAt.getTime() - now.getTime();
            const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
            const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

            return (
              <div
                key={assignee.id}
                className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden transition-all ${
                  isExpired ? 'border-red-300' : 'border-green-300'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <img
                      src={assignee.photo}
                      alt={assignee.fullName}
                      className="w-20 h-20 rounded-full object-cover border-4 border-gray-100"
                      onError={(e) => {
                        e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${assignee.fullName}`;
                      }}
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{assignee.fullName}</h3>
                      <p className="text-sm text-gray-600 mb-2">{assignee.phoneNumber}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          isExpired
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {isExpired ? '❌ Expired' : `✓ Active - ${hoursRemaining}h ${minutesRemaining}m left`}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                          {assignee.idType}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-xs text-gray-600 mb-1">Access Code:</p>
                    <p className="font-mono font-bold text-lg text-gray-900">{assignee.accessCode}</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-xs font-semibold text-blue-900 mb-2">📞 Parent Contact (For Confirmation):</p>
                    <div className="space-y-1 text-sm text-blue-800">
                      <p><strong>Name:</strong> {assignee.parentName}</p>
                      {assignee.parentEmail && <p><strong>Email:</strong> {assignee.parentEmail}</p>}
                      {assignee.parentPhone && <p><strong>Phone:</strong> {assignee.parentPhone}</p>}
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Authorized for {children.length} {children.length === 1 ? 'child' : 'children'}:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {children.map(child => (
                        <span key={child.id} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          {child.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4 text-sm text-gray-600 space-y-1">
                    <p><strong>Created:</strong> {new Date(assignee.createdAt).toLocaleString()}</p>
                    <p className={isExpired ? 'text-red-600 font-semibold' : ''}>
                      <strong>Expires:</strong> {expiresAt.toLocaleString()}
                      {isExpired && ' (EXPIRED)'}
                    </p>
                  </div>

                  {/* ID Document Section */}
                  {assignee.idDocument && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-xs font-semibold text-amber-900 mb-2">🪪 Government ID Document:</p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setDocumentViewer({
                            isOpen: true,
                            imageUrl: assignee.idDocument!,
                            title: `${assignee.idType} - ${assignee.fullName}`,
                            subtitle: `ID Number: ${assignee.idNumber}`
                          })}
                          className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                          size="sm"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View ID
                        </Button>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={() => onGeneratePDF(assignee)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Document Viewer Modal */}
      <ImageViewerModal
        isOpen={documentViewer.isOpen}
        imageUrl={documentViewer.imageUrl}
        title={documentViewer.title}
        subtitle={documentViewer.subtitle}
        onClose={() => setDocumentViewer({ isOpen: false, imageUrl: '', title: '', subtitle: '' })}
      />
    </div>
  );
}