import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { 
  School, Users, UserPlus, ClipboardList, LogOut, Calendar, Search,
  TrendingUp, Filter, Download, MoreVertical, Eye, Edit, Trash2, Settings,
  Building2, Clock, BookOpen, Bell, Shield, Database, Phone, Mail, Globe, User,
  MapPin, Camera, Plus, X, Save, Upload, Palette, Image as ImageIcon, CheckCircle, XCircle
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import Badge from '@/components/Badge';
import { TableRow, TableCell, TableHeader } from '@/components/TableRow';
import SchoolSetupTab from '@/pages/admin/SchoolSetupTab';
import { useTheme } from '@/hooks/useTheme';
import FamilyDetailsModal from '@/components/FamilyDetailsModal';
import EditFamilyModal from '@/components/EditFamilyModal';
import DatabaseCleanupModal from '@/components/DatabaseCleanupModal';
import * as supabaseApi from '@/utils/supabaseApi';
import ParentCredentialsModal from '@/components/ParentCredentialsModal';
import StudentDetailsModal from '@/components/StudentDetailsModal';
import EditStudentModal from '@/components/EditStudentModal';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';
import MigrationBanner from '@/components/MigrationBanner';
import ChildAdditionRequestsModal from '@/components/ChildAdditionRequestsModal';
import DailyAttendanceLog from '@/components/DailyAttendanceLog';
import AdvancedAttendanceRecords from '@/components/AdvancedAttendanceRecords';
import StudentAttendanceModal from '@/components/StudentAttendanceModal';
import AttendanceRecordsModal from '@/components/AttendanceRecordsModal';
import AssigneeManagementTab from '@/components/AssigneeManagementTab';
import PINResetRequestsTab from '@/components/PINResetRequestsTab';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout, currentSchool } = useAuth();
  const { students, parents, attendanceLogs, childAdditionRequests, deleteFamily, updateParent, bulkUpdateParents, addParent, deleteParent, updateStudent, assignees } = useData();
  
  // Apply theme
  useTheme();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'parents' | 'logs' | 'assignees' | 'pin-resets' | 'setup'>('overview');
  const [logsSubTab, setLogsSubTab] = useState<'daily' | 'advanced'>('daily');
  const [searchQuery, setSearchQuery] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [parentSearchQuery, setParentSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('daily');
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

  // Modal states
  const [showFamilyDetailsModal, setShowFamilyDetailsModal] = useState(false);
  const [showEditFamilyModal, setShowEditFamilyModal] = useState(false);
  const [showDatabaseCleanupModal, setShowDatabaseCleanupModal] = useState(false);
  const [showChildRequestsModal, setShowChildRequestsModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [newParentCredentials, setNewParentCredentials] = useState<any>(null);
  const [selectedFamily, setSelectedFamily] = useState<any>(null);
  const [showStudentDetailsModal, setShowStudentDetailsModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [showAttendanceRecordsModal, setShowAttendanceRecordsModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [familyToDelete, setFamilyToDelete] = useState<any>(null);
  const [previousPendingCount, setPreviousPendingCount] = useState(0);
  const [requestsTab, setRequestsTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  // Subscription state
  const [subscriptionExpiryDate, setSubscriptionExpiryDate] = useState<Date>(() => {
    const saved = localStorage.getItem('subscriptionExpiryDate');
    if (saved) {
      return new Date(saved);
    }
    // Default: 90 days from today (3 months)
    const defaultExpiry = new Date();
    defaultExpiry.setDate(defaultExpiry.getDate() + 90);
    return defaultExpiry;
  });

  const [lastSubscriptionNotification, setLastSubscriptionNotification] = useState<string>(() => {
    return localStorage.getItem('lastSubscriptionNotification') || '';
  });

  // Save subscription expiry to localStorage
  useEffect(() => {
    localStorage.setItem('subscriptionExpiryDate', subscriptionExpiryDate.toISOString());
  }, [subscriptionExpiryDate]);

  // Calculate days until expiry
  const getDaysUntilExpiry = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(subscriptionExpiryDate);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilExpiry = getDaysUntilExpiry();
  const isExpired = daysUntilExpiry < 0;
  const isExpiringSoon = daysUntilExpiry >= 0 && daysUntilExpiry <= 5;

  // Show notification based on days remaining
  useEffect(() => {
    const notificationKey = `notification-${daysUntilExpiry}`;
    
    if (lastSubscriptionNotification !== notificationKey) {
      if (daysUntilExpiry === 5) {
        toast.warning('Subscription Reminder', {
          description: 'Your subscription will expire in 5 days. Please renew to continue using the platform.',
          duration: 10000,
        });
        setLastSubscriptionNotification(notificationKey);
        localStorage.setItem('lastSubscriptionNotification', notificationKey);
        // Simulate email notification
        console.log('📧 Email sent: Subscription expiring in 5 days');
      } else if (daysUntilExpiry === 3) {
        toast.warning('Subscription Reminder', {
          description: 'Your subscription will expire in 3 days. Renew now to avoid service interruption.',
          duration: 10000,
        });
        setLastSubscriptionNotification(notificationKey);
        localStorage.setItem('lastSubscriptionNotification', notificationKey);
        console.log('📧 Email sent: Subscription expiring in 3 days');
      } else if (daysUntilExpiry === 1) {
        toast.error('Urgent: Subscription Expiring Soon', {
          description: 'Your subscription expires tomorrow! Renew immediately to maintain access.',
          duration: 15000,
        });
        setLastSubscriptionNotification(notificationKey);
        localStorage.setItem('lastSubscriptionNotification', notificationKey);
        console.log('📧 Email sent: Subscription expiring in 1 day');
      } else if (daysUntilExpiry === 0) {
        toast.error('Subscription Expires Today', {
          description: 'Your subscription expires today. Renew now to avoid losing access.',
          duration: 20000,
        });
        setLastSubscriptionNotification(notificationKey);
        localStorage.setItem('lastSubscriptionNotification', notificationKey);
        console.log('📧 Email sent: Subscription expires today');
      } else if (isExpired && lastSubscriptionNotification !== 'expired') {
        toast.error('Subscription Expired', {
          description: 'Your subscription has expired. Please renew to continue using the platform.',
          duration: 0, // Persistent
        });
        setLastSubscriptionNotification('expired');
        localStorage.setItem('lastSubscriptionNotification', 'expired');
        console.log('📧 Email sent: Subscription expired');
      }
    }
  }, [daysUntilExpiry, lastSubscriptionNotification, isExpired]);

  // Notification sound when new child request comes in
  useEffect(() => {
    const pendingCount = childAdditionRequests.filter(r => r.status === 'pending').length;
    
    // Only play sound if there's an increase in pending requests (not on initial load)
    if (previousPendingCount > 0 && pendingCount > previousPendingCount) {
      console.log('🔔 New child addition request received!');
      
      // Play loud notification sound using Web Audio API
      const playNotificationSound = () => {
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          
          // Resume audio context in case it's suspended (browser autoplay policy)
          if (audioContext.state === 'suspended') {
            audioContext.resume();
          }
          
          // Create a sequence of beeps for attention
          const playBeep = (frequency: number, duration: number, startTime: number) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'square'; // Square wave for more noticeable sound
            
            // Louder volume
            gainNode.gain.setValueAtTime(0.5, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
          };
          
          const now = audioContext.currentTime;
          // Play 3 loud beeps with varying pitch
          playBeep(880, 0.2, now);           // First beep (A5)
          playBeep(1046.5, 0.2, now + 0.25); // Second beep (C6 - higher)
          playBeep(880, 0.3, now + 0.5);     // Third beep (A5 - longer)
          
        } catch (error) {
          console.error('Error playing notification sound:', error);
          // Fallback: Try playing a simple audio element
          try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ4PVqzn77BdGAU+ltryxnMnBSiAzu/ekEAKFF+06+uoVhMKRZ/g8r5sIAUxh9Dz04MzBSBtwO7jmVEOD1as5++wXRgFPpba8sZzJwUogc7v3pBBChRftOvrqFYTCkWf4PK+bCAFMYjQ89ODMwUgbcHu45lRDg9WrOfvsFwYBT6V2vLGcycFKIHO796QQQoUXrXr66hWEwpFn+DyvmwgBTGI0fPTgjMGIG3A7uOZUQ4PVqzn77BdGAU+lNryxnQnBSiBzu/ekEALFV606+uoVRMKRaDg8sFsIQUwh9Hz04IzBiBtwO7jmFEODles5++wXRgFPpTa88Z0JgUogc7v3pBBCxVetOvrp1UTCkWg4PLBayEFMIfR89OCNAUgbcDu45lRDg9XrOfvr10YBT+U2vLGcyYFKIHO796QQQsUXrTr66hVEwpFoODywWshBTCH0fPTgjQFIG3A7uOZUQ4PV6zn769dGAU/lNryxnMmBSiBzu/ekEELFF606+uoVRMKRaDg8sFrIQUwh9Hz04I0BSBtwO7jmVEOD1es5++vXRgFP5Ta8sZzJgUogc7v3pBBCxRetOvrqFUTCkSg4PLBayEFMIfR89OCNAXYWQ==');
            audio.volume = 1.0;
            audio.play().catch(e => console.error('Fallback audio failed:', e));
          } catch (fallbackError) {
            console.error('Fallback audio error:', fallbackError);
          }
        }
      };
      
      playNotificationSound();
      
      // Show notification toast
      toast.success('🔔 New Child Addition Request!', {
        description: `You have a new request to review (${pendingCount} total pending)`,
        duration: 8000,
      });
    }
    
    setPreviousPendingCount(pendingCount);
  }, [childAdditionRequests, previousPendingCount]);

  // PIN Reset Requests count
  const [pinResetRequestsCount, setPinResetRequestsCount] = useState(0);

  useEffect(() => {
    const refreshPinResetCount = () => {
      const requests = JSON.parse(localStorage.getItem('pinResetRequests') || '[]');
      const pendingRequests = requests.filter((r: any) => r.status === 'pending');
      setPinResetRequestsCount(pendingRequests.length);
    };

    // Initial load
    refreshPinResetCount();

    // Refresh every 5 seconds to catch new requests
    const interval = setInterval(refreshPinResetCount, 5000);

    return () => clearInterval(interval);
  }, []);

  // School setup state
  const [schoolInfo, setSchoolInfo] = useState({
    name: 'Springfield Elementary School',
    address: '123 Main Street, Springfield',
    phone: '+1 (555) 123-4567',
    email: 'admin@springfield.edu',
    website: 'www.springfield.edu',
    principal: 'Dr. John Smith',
    logo: ''
  });

  // Load school info from localStorage on mount
  useEffect(() => {
    const savedSchoolInfo = localStorage.getItem('schoolInfo');
    if (savedSchoolInfo) {
      setSchoolInfo(JSON.parse(savedSchoolInfo));
    }
  }, []);

  // Save school info to localStorage and Supabase whenever it changes
  useEffect(() => {
    localStorage.setItem('schoolInfo', JSON.stringify(schoolInfo));
    // Also save logo and name separately for easier access by parent portal
    localStorage.setItem('schoolLogo', schoolInfo.logo);
    localStorage.setItem('schoolName', schoolInfo.name);
    
    // Auto-save to Supabase
    const saveToSupabase = async () => {
      try {
        const schoolCode = localStorage.getItem('schoolCode');
        if (!schoolCode) {
          console.warn('No school code found, skipping Supabase sync');
          return;
        }
        
        const students = JSON.parse(localStorage.getItem('students') || '[]');
        const parents = JSON.parse(localStorage.getItem('parents') || '[]');
        
        console.log('💾 Auto-syncing school to Supabase...');
        await supabaseApi.saveSchoolInfo({
          schoolCode,
          name: schoolInfo.name,
          address: schoolInfo.address,
          email: schoolInfo.email,
          phone: schoolInfo.phone,
          logo: schoolInfo.logo,
          status: 'active',
          studentsCount: students.length,
          parentsCount: parents.length,
          website: schoolInfo.website,
          principal: schoolInfo.principal
        });
        console.log('✅ School synced to Supabase');
      } catch (error) {
        console.warn('⚠️ Could not sync school to Supabase:', error);
      }
    };
    
    // Debounce to avoid too many requests
    const timeoutId = setTimeout(saveToSupabase, 2000);
    return () => clearTimeout(timeoutId);
  }, [schoolInfo]);

  const [schoolSettings, setSchoolSettings] = useState({
    clockInStart: '07:00',
    clockInEnd: '09:00',
    clockOutStart: '14:00',
    clockOutEnd: '18:00',
    gpsRadius: 100,
    requirePhoto: true,
    enableNotifications: true,
    autoClockOut: false
  });

  // Advanced setup state
  const predefinedClasses = [
    'Pre-Nursery', 'Nursery 1', 'Nursery 2', 
    'Primary 1', 'Primary 2', 'Primary 3', 
    'Primary 4', 'Primary 5', 'Primary 6'
  ];

  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [customClasses, setCustomClasses] = useState<string[]>([]);
  const [newCustomClass, setNewCustomClass] = useState('');
  
  const [schoolHours, setSchoolHours] = useState({
    resumption: '08:00',
    closing: '14:00'
  });

  const [schoolLocation, setSchoolLocation] = useState({
    latitude: '',
    longitude: '',
    address: ''
  });

  const [parentPortalAppearance, setParentPortalAppearance] = useState({
    backgroundType: 'gradient' as 'gradient' | 'image' | 'color',
    backgroundImage: '',
    backgroundColor: '#10b981',
    gradientFrom: '#10b981',
    gradientTo: '#14b8a6'
  });

  const [dashboardTheme, setDashboardTheme] = useState({
    adminPrimaryColor: '#4f46e5',
    adminSecondaryColor: '#818cf8',
    parentPrimaryColor: '#10b981',
    parentSecondaryColor: '#34d399'
  });

  // Load advanced settings from localStorage
  useEffect(() => {
    const savedClasses = localStorage.getItem('selectedClasses');
    const savedCustomClasses = localStorage.getItem('customClasses');
    const savedSchoolHours = localStorage.getItem('schoolHours');
    const savedLocation = localStorage.getItem('schoolLocation');
    const savedParentAppearance = localStorage.getItem('parentPortalAppearance');
    const savedTheme = localStorage.getItem('dashboardTheme');

    if (savedClasses) setSelectedClasses(JSON.parse(savedClasses));
    if (savedCustomClasses) setCustomClasses(JSON.parse(savedCustomClasses));
    if (savedSchoolHours) setSchoolHours(JSON.parse(savedSchoolHours));
    if (savedLocation) setSchoolLocation(JSON.parse(savedLocation));
    if (savedParentAppearance) setParentPortalAppearance(JSON.parse(savedParentAppearance));
    if (savedTheme) setDashboardTheme(JSON.parse(savedTheme));
  }, []);

  // Save advanced settings to localStorage
  useEffect(() => {
    localStorage.setItem('selectedClasses', JSON.stringify(selectedClasses));
  }, [selectedClasses]);

  useEffect(() => {
    localStorage.setItem('customClasses', JSON.stringify(customClasses));
  }, [customClasses]);

  useEffect(() => {
    localStorage.setItem('schoolHours', JSON.stringify(schoolHours));
  }, [schoolHours]);

  useEffect(() => {
    localStorage.setItem('schoolLocation', JSON.stringify(schoolLocation));
  }, [schoolLocation]);

  useEffect(() => {
    localStorage.setItem('parentPortalAppearance', JSON.stringify(parentPortalAppearance));
  }, [parentPortalAppearance]);

  useEffect(() => {
    localStorage.setItem('dashboardTheme', JSON.stringify(dashboardTheme));
  }, [dashboardTheme]);

  const handleToggleClass = (className: string) => {
    setSelectedClasses(prev => 
      prev.includes(className) 
        ? prev.filter(c => c !== className)
        : [...prev, className]
    );
  };

  const handleAddCustomClass = () => {
    if (newCustomClass.trim() && !customClasses.includes(newCustomClass.trim())) {
      setCustomClasses([...customClasses, newCustomClass.trim()]);
      setNewCustomClass('');
    }
  };

  const handleRemoveCustomClass = (className: string) => {
    setCustomClasses(customClasses.filter(c => c !== className));
  };

  const handleGetCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setSchoolLocation({
            ...schoolLocation,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          });
        },
        (error) => {
          alert('Error getting location: ' + error.message);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };

  const handleLogout = () => {
    logout();
    // Redirect to school login page if school code is available
    if (currentSchool?.schoolCode) {
      navigate(`/school/${currentSchool.schoolCode}/login`);
    } else {
      navigate('/admin/login');
    }
  };

  const handleSaveStudent = (updatedStudent: any) => {
    // Update the student in the DataContext
    updateStudent(updatedStudent.id, {
      name: updatedStudent.name,
      age: updatedStudent.age,
      class: updatedStudent.class,
      gender: updatedStudent.gender,
      image: updatedStudent.image,
    });
    
    // Update the selected student state to reflect changes immediately
    setSelectedStudent(updatedStudent);
  };

  // Group parents by family (using familyId)
  const groupParentsByFamily = () => {
    const families: { [key: string]: typeof parents } = {};

    parents.forEach(parent => {
      // Group by familyId - parents with same familyId are in same family
      const familyKey = parent.familyId || `solo-${parent.id}`; // Fallback for parents without familyId
      
      if (!families[familyKey]) {
        families[familyKey] = [];
      }
      families[familyKey].push(parent);
    });

    return Object.values(families);
  };

  const getChildrenForParent = (childrenIds: string[]) => {
    return students.filter(s => childrenIds.includes(s.id));
  };

  // Filter families based on search query
  const filterFamiliesBySearch = () => {
    const allFamilies = groupParentsByFamily();
    if (!parentSearchQuery) return allFamilies;
    
    const query = parentSearchQuery.toLowerCase();
    return allFamilies.filter(family => {
      // Search in parent names, occupation, type
      const matchesParent = family.some(parent => 
        parent.name.toLowerCase().includes(query) ||
        parent.occupation.toLowerCase().includes(query) ||
        parent.type.toLowerCase().includes(query)
      );
      // Search in children names and classes
      const children = getChildrenForParent(family[0].childrenIds);
      const matchesChildren = children.some(child =>
        child.name.toLowerCase().includes(query) ||
        child.class.toLowerCase().includes(query)
      );
      return matchesParent || matchesChildren;
    });
  };

  const filterLogs = () => {
    const now = new Date();
    return attendanceLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      
      switch (filterPeriod) {
        case 'daily':
          return logDate.toDateString() === now.toDateString();
        case 'weekly':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return logDate >= weekAgo;
        case 'monthly':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return logDate >= monthAgo;
        case 'yearly':
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          return logDate >= yearAgo;
        default:
          return true;
      }
    });
  };

  const searchLogs = () => {
    const filtered = filterLogs();
    if (!searchQuery) return filtered;
    
    return filtered.filter(log => 
      log.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.childrenNames.some(name => name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  // Filter students based on search query
  const filterStudentsBySearch = () => {
    if (!studentSearchQuery) return students;
    
    const query = studentSearchQuery.toLowerCase();
    return students.filter(student => 
      student.name.toLowerCase().includes(query) ||
      student.id.toLowerCase().includes(query) ||
      student.class.toLowerCase().includes(query) ||
      student.gender.toLowerCase().includes(query) ||
      student.age.toString().includes(query)
    );
  };

  const todayLogs = attendanceLogs.filter(log => 
    new Date(log.timestamp).toDateString() === new Date().toDateString()
  );
  const clockedInToday = new Set(
    todayLogs.filter(l => l.type === 'clock-in').flatMap(l => l.childrenIds)
  ).size;

  // Calculate grouped attendance records (same as DailyAttendanceLog component)
  // This groups clock-in and clock-out by parent and date to show accurate record count
  const groupedTodayRecords = (() => {
    const groupedLogs = new Map();
    todayLogs.forEach(log => {
      const dateKey = new Date(log.timestamp).toDateString();
      const key = `${log.parentId}-${dateKey}`;
      
      if (!groupedLogs.has(key)) {
        groupedLogs.set(key, {
          parentId: log.parentId,
          clockIn: null,
          clockOut: null
        });
      }
      
      const record = groupedLogs.get(key);
      if (log.type === 'clock-in') {
        record.clockIn = log.timestamp;
      } else {
        record.clockOut = log.timestamp;
      }
    });
    return groupedLogs.size;
  })();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {schoolInfo.logo ? (
                <img
                  src={schoolInfo.logo}
                  alt={schoolInfo.name}
                  className="w-10 h-10 rounded-lg object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--admin-primary)' }}>
                  <School className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{schoolInfo.name}</h1>
                <p className="text-sm text-gray-600">School Attendance Management</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Students"
            value={students.length}
            icon={Users}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-100"
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Total Parents"
            value={parents.length}
            icon={UserPlus}
            iconColor="text-green-600"
            iconBgColor="bg-green-100"
            trend={{ value: 8, isPositive: true }}
          />
          <StatCard
            title="Clocked In Today"
            value={clockedInToday}
            icon={Calendar}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-100"
          />
          <StatCard
            title="Total Logs"
            value={groupedTodayRecords}
            icon={ClipboardList}
            iconColor="text-orange-600"
            iconBgColor="bg-orange-100"
            trend={{ value: 24, isPositive: true }}
          />
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview', count: null },
                { id: 'students', label: 'Students', count: students.length },
                { id: 'parents', label: 'Parents', count: parents.length },
                { id: 'logs', label: 'Attendance Logs', count: groupedTodayRecords },
                { id: 'assignees', label: 'Assignee Management', count: assignees.length },
                { id: 'pin-resets', label: 'PIN Reset Requests', count: pinResetRequestsCount },
                { id: 'setup', label: 'School Setup', count: null }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-4 border-b-2 font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'admin-border-primary admin-text-primary'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count !== null && (
                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                      activeTab === tab.id ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            <div style={{ display: activeTab === 'overview' ? 'block' : 'none' }}>
              {/* Migration Banner */}
              <MigrationBanner 
                schoolCode={localStorage.getItem('schoolCode') || 'SCH000000000'}
                onMigrationComplete={() => {
                  toast.success('Data successfully migrated to cloud database!');
                  window.location.reload();
                }}
              />
              
              {/* Subscription Status Banner */}
              {(isExpired || isExpiringSoon) && (
                <div className={`mb-6 rounded-xl border-2 p-5 ${
                  isExpired 
                    ? 'bg-red-50 border-red-300' 
                    : daysUntilExpiry === 1 
                    ? 'bg-red-50 border-red-300'
                    : daysUntilExpiry <= 3
                    ? 'bg-orange-50 border-orange-300'
                    : 'bg-yellow-50 border-yellow-300'
                }`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isExpired 
                        ? 'bg-red-100' 
                        : daysUntilExpiry === 1 
                        ? 'bg-red-100'
                        : daysUntilExpiry <= 3
                        ? 'bg-orange-100'
                        : 'bg-yellow-100'
                    }`}>
                      <Bell className={`w-6 h-6 ${
                        isExpired 
                          ? 'text-red-600' 
                          : daysUntilExpiry === 1 
                          ? 'text-red-600'
                          : daysUntilExpiry <= 3
                          ? 'text-orange-600'
                          : 'text-yellow-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-lg font-bold mb-1 ${
                        isExpired 
                          ? 'text-red-900' 
                          : daysUntilExpiry === 1 
                          ? 'text-red-900'
                          : daysUntilExpiry <= 3
                          ? 'text-orange-900'
                          : 'text-yellow-900'
                      }`}>
                        {isExpired 
                          ? '⚠️ Subscription Expired' 
                          : daysUntilExpiry === 0
                          ? '⚠️ Subscription Expires Today'
                          : daysUntilExpiry === 1
                          ? '⚠️ Subscription Expires Tomorrow'
                          : `⚠️ Subscription Expires in ${daysUntilExpiry} Days`
                        }
                      </h3>
                      <p className={`text-sm mb-3 ${
                        isExpired 
                          ? 'text-red-700' 
                          : daysUntilExpiry === 1 
                          ? 'text-red-700'
                          : daysUntilExpiry <= 3
                          ? 'text-orange-700'
                          : 'text-yellow-700'
                      }`}>
                        {isExpired 
                          ? 'Your subscription has expired. Renew now to restore full access to the platform and continue managing student attendance.'
                          : daysUntilExpiry === 0
                          ? 'Your subscription expires today. Renew immediately to avoid service interruption.'
                          : `Your subscription will expire on ${subscriptionExpiryDate.toLocaleDateString()}. Renew now to ensure uninterrupted access.`
                        }
                      </p>
                      <p className={`text-xs mb-4 ${
                        isExpired 
                          ? 'text-red-600' 
                          : daysUntilExpiry === 1 
                          ? 'text-red-600'
                          : daysUntilExpiry <= 3
                          ? 'text-orange-600'
                          : 'text-yellow-600'
                      }`}>
                        📧 Email notification sent to {schoolInfo.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Child Addition Requests - Prominent Section */}
              {childAdditionRequests.length > 0 && (
                <div className="mb-8">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                          <UserPlus className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            Child Addition Requests
                            {childAdditionRequests.filter(r => r.status === 'pending').length > 0 && (
                              <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full animate-pulse shadow-lg">
                                {childAdditionRequests.filter(r => r.status === 'pending').length} NEW
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Manage parent requests to add children to their accounts
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Request Status Tabs */}
                    <div className="flex gap-2 mb-5 overflow-x-auto pb-2">
                      <button
                        onClick={() => setRequestsTab('pending')}
                        className={`px-4 py-2.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                          requestsTab === 'pending'
                            ? 'bg-orange-500 text-white shadow-lg'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Pending
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            requestsTab === 'pending' ? 'bg-orange-600' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {childAdditionRequests.filter(r => r.status === 'pending').length}
                          </span>
                        </span>
                      </button>
                      <button
                        onClick={() => setRequestsTab('approved')}
                        className={`px-4 py-2.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                          requestsTab === 'approved'
                            ? 'bg-green-500 text-white shadow-lg'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Approved
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            requestsTab === 'approved' ? 'bg-green-600' : 'bg-green-100 text-green-700'
                          }`}>
                            {childAdditionRequests.filter(r => r.status === 'approved').length}
                          </span>
                        </span>
                      </button>
                      <button
                        onClick={() => setRequestsTab('rejected')}
                        className={`px-4 py-2.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                          requestsTab === 'rejected'
                            ? 'bg-red-500 text-white shadow-lg'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <XCircle className="w-4 h-4" />
                          Rejected
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            requestsTab === 'rejected' ? 'bg-red-600' : 'bg-red-100 text-red-700'
                          }`}>
                            {childAdditionRequests.filter(r => r.status === 'rejected').length}
                          </span>
                        </span>
                      </button>
                    </div>

                    {/* Request Preview (show first 3 of selected tab) */}
                    <div className="space-y-3 mb-4">
                      {childAdditionRequests
                        .filter(r => r.status === requestsTab)
                        .slice(0, 3)
                        .map(request => {
                          const student = students.find(s => s.id === request.studentId);
                          return (
                            <div
                              key={request.id}
                              className={`bg-white border-2 rounded-lg p-4 ${
                                requestsTab === 'pending'
                                  ? 'border-orange-200'
                                  : requestsTab === 'approved'
                                  ? 'border-green-200'
                                  : 'border-red-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {student && (
                                    <img
                                      src={student.image}
                                      alt={student.name}
                                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                                    />
                                  )}
                                  <div>
                                    <p className="font-bold text-gray-900">{request.studentName}</p>
                                    <p className="text-sm text-gray-600">
                                      Parent: {request.parentName} ({request.parentType})
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {new Date(request.requestDate).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  requestsTab === 'pending'
                                    ? 'bg-orange-100 text-orange-700'
                                    : requestsTab === 'approved'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {requestsTab.toUpperCase()}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      
                      {childAdditionRequests.filter(r => r.status === requestsTab).length === 0 && (
                        <div className="text-center py-8 bg-white rounded-lg border-2 border-dashed border-gray-200">
                          <p className="text-gray-500">No {requestsTab} requests</p>
                        </div>
                      )}
                    </div>

                    {/* View All Button */}
                    <button
                      onClick={() => setShowChildRequestsModal(true)}
                      className="w-full px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-xl"
                    >
                      View All Requests ({childAdditionRequests.length})
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <button
                    onClick={() => navigate('/admin/add-student')}
                    className="flex items-start gap-4 p-6 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all text-left"
                  >
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <UserPlus className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">Add New Student</p>
                      <p className="text-sm text-gray-600">Register a new student to the system</p>
                    </div>
                  </button>

                  <button
                    onClick={() => navigate('/admin/add-parent')}
                    className="flex items-start gap-4 p-6 bg-white border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-sm transition-all text-left"
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">Add New Parent</p>
                      <p className="text-sm text-gray-600">Register a new parent account</p>
                    </div>
                  </button>

                  <button
                    onClick={() => navigate('/school-admin/security-management')}
                    className="flex items-start gap-4 p-6 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all text-left"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">Security Management</p>
                      <p className="text-sm text-gray-600">Manage security personnel access</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                  {attendanceLogs.length > 0 && (
                    <button
                      onClick={() => setActiveTab('logs')}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      View All
                    </button>
                  )}
                </div>
                {attendanceLogs.length === 0 ? (
                  <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                    <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-900 font-medium mb-1">No attendance logs yet</p>
                    <p className="text-sm text-gray-500">Logs will appear here when parents clock in/out</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {attendanceLogs.slice(0, 5).map((log) => (
                      <div 
                        key={log.id}
                        className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all"
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          log.type === 'clock-in' ? 'bg-green-100' : 'bg-orange-100'
                        }`}>
                          {log.type === 'clock-in' ? (
                            <Calendar className={`w-5 h-5 text-green-600`} />
                          ) : (
                            <Clock className={`w-5 h-5 text-orange-600`} />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {log.parentName} {log.type === 'clock-in' ? 'clocked in' : 'clocked out'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {log.childrenNames.join(', ')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(log.timestamp).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Students Tab */}
            <div style={{ display: activeTab === 'students' ? 'block' : 'none' }}>
              <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Student Directory</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {studentSearchQuery 
                      ? `Showing ${filterStudentsBySearch().length} of ${students.length} students` 
                      : `${students.length} students registered`
                    }
                  </p>
                </div>
                <button
                  onClick={() => !isExpired && navigate('/admin/add-student')}
                  disabled={isExpired}
                  className={`px-6 py-2.5 rounded-lg transition-colors font-medium shadow-sm ${
                    isExpired 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                  title={isExpired ? 'Renew subscription to add students' : ''}
                >
                  + Add Student
                </button>
              </div>

              {/* Search Bar */}
              {students.length > 0 && (
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      placeholder="Search by name, ID, class, gender, or age..."
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                    {studentSearchQuery && (
                      <button
                        onClick={() => setStudentSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {students.length === 0 ? (
                <div className="text-center py-16">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No students registered yet</p>
                  <p className="text-sm text-gray-400 mb-6">Start by adding your first student</p>
                  <button
                    onClick={() => !isExpired && navigate('/admin/add-student')}
                    disabled={isExpired}
                    className={`px-6 py-2.5 rounded-lg transition-colors ${
                      isExpired 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                    title={isExpired ? 'Renew subscription to add students' : ''}
                  >
                    Add Student
                  </button>
                </div>
              ) : (
                <>
                  {filterStudentsBySearch().length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
                      <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg mb-2">No students found</p>
                      <p className="text-sm text-gray-400 mb-6">Try adjusting your search criteria</p>
                      <button
                        onClick={() => setStudentSearchQuery('')}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Clear Search
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto overflow-y-visible">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <TableHeader>Student</TableHeader>
                            <TableHeader>Class</TableHeader>
                            <TableHeader>Age</TableHeader>
                            <TableHeader>Gender</TableHeader>
                            <TableHeader align="right">Actions</TableHeader>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filterStudentsBySearch().map((student, index) => {
                            const totalStudents = filterStudentsBySearch().length;
                            const isFirst = index < 2; // First 2 students
                            const isLast = index >= totalStudents - 2; // Last 2 students
                            
                            return (
                            <TableRow key={student.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <img
                                src={student.image}
                                alt={student.name}
                                className="w-10 h-10 rounded-full bg-gray-200 object-cover"
                              />
                              <div>
                                <p className="font-medium text-gray-900">{student.name}</p>
                                <p className="text-sm text-gray-500">ID: {student.id}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="info">{student.class}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-gray-900">{student.age} years</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={student.gender === 'Male' ? 'blue' : 'pink'}>
                              {student.gender}
                            </Badge>
                          </TableCell>
                            <TableCell align="right">
                              <div className="relative">
                                <button
                                  onClick={() => setShowActionMenu(showActionMenu === student.id ? null : student.id)}
                                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                  <MoreVertical className="w-4 h-4 text-gray-600" />
                                </button>
                                {showActionMenu === student.id && (
                                  <>
                                    <div 
                                      className="fixed inset-0 z-10"
                                      onClick={() => setShowActionMenu(null)}
                                    />
                                    <div className={`absolute right-0 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 ${
                                      isLast ? 'bottom-full mb-2' : 'top-full mt-2'
                                    }`}>
                                      <div className="py-1">
                                        <button
                                          onClick={() => {
                                            setSelectedStudent(student);
                                            setShowStudentDetailsModal(true);
                                            setShowActionMenu(null);
                                          }}
                                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                        >
                                          <Eye className="w-4 h-4" />
                                          View Details
                                        </button>
                                        <button
                                          onClick={() => {
                                            setSelectedStudent(student);
                                            setShowAttendanceRecordsModal(true);
                                            setShowActionMenu(null);
                                          }}
                                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                        >
                                          <Calendar className="w-4 h-4" />
                                          View Attendance
                                        </button>
                                        <button
                                          onClick={() => {
                                            setSelectedStudent(student);
                                            setShowEditStudentModal(true);
                                            setShowActionMenu(null);
                                          }}
                                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                        >
                                          <Edit className="w-4 h-4" />
                                          Edit Student
                                        </button>
                                        <button
                                          onClick={() => {
                                            if (confirm(`Are you sure you want to delete ${student.name}? This action cannot be undone.`)) {
                                              toast.success(`${student.name} deleted successfully`);
                                            }
                                            setShowActionMenu(null);
                                          }}
                                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                          Delete Student
                                        </button>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                          );
                        })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Parents Tab */}
            <div style={{ display: activeTab === 'parents' ? 'block' : 'none' }}>
              <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Parent Directory</h3>
                  <p className="text-sm text-gray-600 mt-1">{groupParentsByFamily().length} families • {parents.length} parents registered</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDatabaseCleanupModal(true)}
                    className="px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-sm inline-flex items-center gap-2"
                  >
                    <Database className="w-4 h-4" />
                    <span className="hidden sm:inline">Cleanup Database</span>
                  </button>
                  <button
                    onClick={() => !isExpired && navigate('/admin/add-parent')}
                    disabled={isExpired}
                    className={`px-6 py-2.5 rounded-lg transition-colors font-medium shadow-sm ${
                      isExpired 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                    title={isExpired ? 'Renew subscription to add parents' : ''}
                  >
                    + Add Parent
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              {parents.length > 0 && (
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={parentSearchQuery}
                      onChange={(e) => setParentSearchQuery(e.target.value)}
                      placeholder="Search by parent name, occupation, child name, or class..."
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                    {parentSearchQuery && (
                      <button
                        onClick={() => setParentSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {parents.length === 0 ? (
                <div className="text-center py-16">
                  <UserPlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No parents registered yet</p>
                  <p className="text-sm text-gray-400 mb-6">Start by adding parent accounts</p>
                  <button
                    onClick={() => !isExpired && navigate('/admin/add-parent')}
                    disabled={isExpired}
                    className={`px-6 py-2.5 rounded-lg transition-colors ${
                      isExpired 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                    title={isExpired ? 'Renew subscription to add parents' : ''}
                  >
                    Add Parent
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filterFamiliesBySearch().map((family, familyIdx) => {
                    const children = getChildrenForParent(family[0].childrenIds);
                    return (
                      <div 
                        key={`family-${familyIdx}`}
                        className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all"
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-purple-600" />
                            <h4 className="font-semibold text-gray-900">Family Unit</h4>
                            <Badge variant="purple">
                              {children.length} {children.length === 1 ? 'Child' : 'Children'}
                            </Badge>
                          </div>
                          <div className="relative">
                            <button
                              onClick={() => setShowActionMenu(showActionMenu === family[0].id ? null : family[0].id)}
                              className="p-2 hover:bg-white rounded-lg transition-colors border border-gray-200"
                            >
                              <MoreVertical className="w-4 h-4 text-gray-600" />
                            </button>
                            {showActionMenu === family[0].id && (
                              <>
                                <div 
                                  className="fixed inset-0 z-10"
                                  onClick={() => setShowActionMenu(null)}
                                />
                                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                                  <div className="py-1">
                                    <button
                                      onClick={() => {
                                        setSelectedFamily(family);
                                        setShowFamilyDetailsModal(true);
                                        setShowActionMenu(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                    >
                                    <Eye className="w-4 h-4" />
                                    View Details
                                  </button>
                                    <button
                                      onClick={() => {
                                        setSelectedFamily(family);
                                        setShowEditFamilyModal(true);
                                        setShowActionMenu(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                    >
                                    <Edit className="w-4 h-4" />
                                    Edit Family
                                  </button>
                                    <button
                                      onClick={() => {
                                        setFamilyToDelete(family);
                                        setShowDeleteModal(true);
                                        setShowActionMenu(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Family
                                  </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Parents Section */}
                        <div className="mb-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            {family.map((parent) => (
                              <div 
                                key={parent.id}
                                className="bg-white border border-gray-200 rounded-lg p-4"
                              >
                                <div className="flex items-start gap-3">
                                  <img
                                    src={parent.photo}
                                    alt={parent.name}
                                    className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 object-cover"
                                    onError={(e) => {
                                      e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${parent.name}`;
                                    }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="font-semibold text-gray-900 truncate">{parent.name}</p>
                                      <Badge variant={parent.type === 'father' ? 'blue' : 'pink'} className="flex-shrink-0">
                                        {parent.type === 'father' ? '👨 Father' : '👩 Mother'}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">{parent.occupation}</p>
                                    <p className="text-xs text-gray-500 truncate">{parent.residentialAddress}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {family.length === 1 && (
                              <button
                                onClick={() => {
                                  setSelectedFamily(family);
                                  setShowEditFamilyModal(true);
                                }}
                                className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center hover:border-green-400 hover:bg-green-50 transition-all group cursor-pointer"
                              >
                                <div className="text-center">
                                  <UserPlus className="w-8 h-8 text-gray-400 mx-auto mb-2 group-hover:text-green-500 transition-colors" />
                                  <p className="text-sm text-gray-500 group-hover:text-green-600 font-medium transition-colors">Add spouse</p>
                                </div>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Children Section */}
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Children</p>
                          <div className="flex flex-wrap gap-2">
                            {children.map((child) => (
                              <div 
                                key={child.id}
                                className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 hover:bg-purple-100 transition-colors"
                              >
                                <img
                                  src={child.image}
                                  alt={child.name}
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-900">{child.name}</p>
                                  <p className="text-xs text-gray-600">{child.class} • {child.age} yrs</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {parentSearchQuery && filterFamiliesBySearch().length === 0 && (
                    <div className="text-center py-16">
                      <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg mb-2">No families found</p>
                      <p className="text-sm text-gray-400 mb-6">
                        No results match "{parentSearchQuery}"
                      </p>
                      <button
                        onClick={() => setParentSearchQuery('')}
                        className="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Clear Search
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Daily Attendance Log Tab */}
            <div style={{ display: activeTab === 'logs' ? 'block' : 'none' }}>
              {/* Sub-tabs for Daily vs Advanced */}
              <div className="mb-6 border-b border-gray-200">
                <div className="flex gap-2">
                  <button
                    onClick={() => setLogsSubTab('daily')}
                    className={`px-6 py-3 border-b-2 font-semibold transition-colors ${
                      logsSubTab === 'daily'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }`}
                  >
                    Today's Records
                  </button>
                  <button
                    onClick={() => setLogsSubTab('advanced')}
                    className={`px-6 py-3 border-b-2 font-semibold transition-colors ${
                      logsSubTab === 'advanced'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }`}
                  >
                    Advanced Search
                  </button>
                </div>
              </div>

              {/* Daily View */}
              {logsSubTab === 'daily' && (
                <DailyAttendanceLog attendanceLogs={attendanceLogs} parents={parents} />
              )}

              {/* Advanced View */}
              {logsSubTab === 'advanced' && (
                <AdvancedAttendanceRecords 
                  attendanceLogs={attendanceLogs} 
                  parents={parents} 
                  students={students}
                />
              )}
            </div>

            {/* Assignee Management Tab */}
            <div style={{ display: activeTab === 'assignees' ? 'block' : 'none' }}>
              <AssigneeManagementTab 
                assignees={assignees} 
                students={students} 
                parents={parents} 
              />
            </div>

            {/* PIN Reset Requests Tab */}
            <div style={{ display: activeTab === 'pin-resets' ? 'block' : 'none' }}>
              <PINResetRequestsTab />
            </div>

            {/* Setup Tab */}
            <div style={{ display: activeTab === 'setup' ? 'block' : 'none' }}>
              <SchoolSetupTab />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedFamily && (
        <FamilyDetailsModal
          isOpen={showFamilyDetailsModal}
          onClose={() => setShowFamilyDetailsModal(false)}
          family={selectedFamily}
          children={getChildrenForParent(selectedFamily[0].childrenIds)}
        />
      )}

      {selectedFamily && (
        <EditFamilyModal
          isOpen={showEditFamilyModal}
          onClose={() => setShowEditFamilyModal(false)}
          family={selectedFamily}
          children={getChildrenForParent(selectedFamily[0].childrenIds)}
          allStudents={students}
          allParents={parents}
          onSave={(updates) => {
            try {
              console.log('AdminDashboard onSave called with updates:', updates);
              console.log('Updates.parents:', updates.parents);
              console.log('Updates.childrenIds:', updates.childrenIds);
              
              // First, identify which parents were removed
              const originalParentIds = selectedFamily.map(p => p.id);
              const updatedParentIds = updates.parents.map(p => p.id).filter(id => !id.startsWith('temp_'));
              const removedParentIds = originalParentIds.filter(id => !updatedParentIds.includes(id));
              
              console.log('Original parent IDs:', originalParentIds);
              console.log('Updated parent IDs:', updatedParentIds);
              console.log('Removed parent IDs:', removedParentIds);
              
              // Delete removed parents
              removedParentIds.forEach(parentId => {
                console.log('Deleting parent:', parentId);
                deleteParent(parentId);
              });
              
              // Update all parents in the family
              updates.parents.forEach(parent => {
                // Check if this is a new parent (has temp_ ID)
                if (parent.id.startsWith('temp_')) {
                  console.log('Adding new parent:', parent.name, 'with children:', updates.childrenIds);
                  
                  // Get familyId from existing parent in the family
                  const existingParent = selectedFamily.find(p => !p.id.startsWith('temp_'));
                  const familyIdToUse = existingParent?.familyId || `FID${Date.now()}${Math.floor(Math.random() * 1000)}`;
                  
                  // Add as new parent with same familyId
                  const result = addParent({
                    type: parent.type,
                    name: parent.name,
                    photo: parent.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(parent.name)}`,
                    gender: parent.gender,
                    occupation: parent.occupation,
                    residentialAddress: parent.residentialAddress,
                    childrenIds: updates.childrenIds,
                    familyId: familyIdToUse
                  });
                  
                  // Show credentials modal after a small delay to ensure EditFamilyModal closes first
                  setTimeout(() => {
                    setNewParentCredentials({
                      parentName: parent.name,
                      parentType: parent.type,
                      parentId: result.parentId,
                      password: result.password
                    });
                    setShowCredentialsModal(true);
                  }, 300);
                } else {
                  console.log('Updating existing parent:', parent.id, 'with children:', updates.childrenIds);
                  // Update existing parent with updated children
                  updateParent(parent.id, {
                    ...parent,
                    childrenIds: updates.childrenIds
                  });
                }
              });
              // Close modal and reset selected family
              setShowEditFamilyModal(false);
              setSelectedFamily(null);
              toast.success('Family updated successfully!');
            } catch (error) {
              console.error('Error saving family:', error);
              toast.error('Failed to save family. Please try again.');
            }
          }}
        />
      )}

      <ChildAdditionRequestsModal
        isOpen={showChildRequestsModal}
        onClose={() => setShowChildRequestsModal(false)}
      />

      <DatabaseCleanupModal
        isOpen={showDatabaseCleanupModal}
        onClose={() => setShowDatabaseCleanupModal(false)}
        parents={parents}
        students={students}
        onCleanup={(cleanedParents) => {
          bulkUpdateParents(cleanedParents);
          setShowDatabaseCleanupModal(false);
        }}
      />

      {newParentCredentials && (
        <ParentCredentialsModal
          isOpen={showCredentialsModal}
          onClose={() => {
            setShowCredentialsModal(false);
            setNewParentCredentials(null);
          }}
          credentials={newParentCredentials}
        />
      )}

      {selectedStudent && (
        <StudentDetailsModal
          isOpen={showStudentDetailsModal}
          onClose={() => {
            setShowStudentDetailsModal(false);
            setSelectedStudent(null);
          }}
          student={selectedStudent}
        />
      )}

      {selectedStudent && (
        <EditStudentModal
          isOpen={showEditStudentModal}
          onClose={() => {
            setShowEditStudentModal(false);
            setSelectedStudent(null);
          }}
          student={selectedStudent}
          onSave={handleSaveStudent}
        />
      )}

      {selectedStudent && (
        <AttendanceRecordsModal
          isOpen={showAttendanceRecordsModal}
          onClose={() => {
            setShowAttendanceRecordsModal(false);
            setSelectedStudent(null);
          }}
          student={selectedStudent}
          attendanceLogs={attendanceLogs}
        />
      )}

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setFamilyToDelete(null);
        }}
        onConfirm={() => {
          if (familyToDelete && familyToDelete.length > 0) {
            // Get all parent IDs from the family
            const parentIds = familyToDelete.map(p => p.id);
            console.log('Deleting family with parent IDs:', parentIds);
            console.log('Current parents before delete:', parents);
            
            // Delete each parent in the family
            parentIds.forEach(parentId => {
              deleteParent(parentId);
            });
            
            console.log('Delete family completed');
            toast.success(`Family deleted successfully (${parentIds.length} parent${parentIds.length > 1 ? 's' : ''} removed)`);
            setShowDeleteModal(false);
            setFamilyToDelete(null);
          } else {
            console.log('familyToDelete is invalid:', familyToDelete);
            toast.error('Failed to delete family');
            setShowDeleteModal(false);
            setFamilyToDelete(null);
          }
        }}
        title="Delete Family"
        message="Are you sure you want to delete this family unit? This will remove all parents from the family but the children will remain in the school system as students. This action cannot be undone."
        itemName={familyToDelete ? `Family with ${familyToDelete.length} parent(s) - ${familyToDelete[0]?.childrenIds?.length || 0} child(ren) will remain in school` : ''}
      />
    </div>
  );
}