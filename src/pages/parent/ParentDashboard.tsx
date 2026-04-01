import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { 
  Users, LogOut, LogIn, LogOut as LogOutIcon, X, Lock, CheckCircle2, 
  Clock, Calendar, History, User, MapPin, Briefcase, Phone, Mail,
  TrendingUp, Activity, AlertCircle, ChevronRight, Timer, Award, UserCircle, Search, Filter, Navigation, RefreshCw, School, UserPlus, XCircle, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import Badge from '@/components/Badge';
import { useTheme } from '@/hooks/useTheme';
import AddChildModal from '@/components/AddChildModal';
import { AssignSomeoneModal } from '@/app/components/AssignSomeoneModal';
import { ActiveAssignees } from '@/app/components/ActiveAssignees';
import { FacialCaptureModal } from '@/app/components/FacialCaptureModal';
import * as supabaseApi from '@/utils/supabaseApi';

interface ChildStatus {
  id: string;
  status: 'not-clocked-in' | 'clocked-in' | 'clocked-out';
  lastClockIn?: string;
  lastClockOut?: string;
  totalHoursToday?: number;
  lastActionBy?: {
    name: string;
    photo: string;
  };
  hasClockInToday?: boolean;
  hasClockOutToday?: boolean;
}

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { currentParent, logout, updateCurrentParent, isLoading } = useAuth();
  const { getStudentsByIds, addAttendanceLog, attendanceLogs, updateParentPassword, parents, childAdditionRequests, deleteChildAdditionRequest, refreshChildRequests, loading: dataLoading } = useData();
  
  // Apply theme
  useTheme();
  
  const [showClockInModal, setShowClockInModal] = useState(false);
  const [showClockOutModal, setShowClockOutModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [showAssignSomeoneModal, setShowAssignSomeoneModal] = useState(false);
  const [showFacialCaptureModal, setShowFacialCaptureModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'clock-in' | 'clock-out' | null>(null);
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [childrenStatuses, setChildrenStatuses] = useState<Map<string, ChildStatus>>(new Map());
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [parentPortalBackground, setParentPortalBackground] = useState<any>(null);
  
  // Removed forced password change - parents can change password from profile whenever they want
  
  // Fetch school info and background appearance settings
  useEffect(() => {
    async function loadSchoolBackground() {
      if (!currentParent?.schoolCode) {
        console.log('⚠️ [DASHBOARD BG] No school code found on parent:', currentParent);
        
        // Try loading from localStorage as fallback
        const storedAppearance = localStorage.getItem('parentPortalAppearance');
        if (storedAppearance) {
          console.log('✅ [DASHBOARD BG] Loaded from localStorage (no schoolCode):', JSON.parse(storedAppearance));
          setParentPortalBackground(JSON.parse(storedAppearance));
        } else {
          console.log('⚠️ [DASHBOARD BG] Using default gradient');
          setParentPortalBackground({
            backgroundType: 'gradient',
            gradientFrom: '#10b981',
            gradientTo: '#14b8a6'
          });
        }
        return;
      }
      
      try {
        console.log('🎨 [DASHBOARD BG] Fetching parent portal background for school:', currentParent.schoolCode);
        const school = await supabaseApi.getSchoolInfo(currentParent.schoolCode);
        
        if (school?.parentPortalAppearance) {
          console.log('✅ [DASHBOARD BG] Background settings loaded from Supabase:', school.parentPortalAppearance);
          setParentPortalBackground(school.parentPortalAppearance);
        } else {
          // Fallback to localStorage
          console.log('⚠️ [DASHBOARD BG] No Supabase background, trying localStorage...');
          const storedAppearance = localStorage.getItem('parentPortalAppearance');
          if (storedAppearance) {
            console.log('✅ [DASHBOARD BG] Loaded from localStorage:', JSON.parse(storedAppearance));
            setParentPortalBackground(JSON.parse(storedAppearance));
          } else {
            // Use default gradient if not set
            console.log('⚠️ [DASHBOARD BG] No background settings found, using default');
            setParentPortalBackground({
              backgroundType: 'gradient',
              gradientFrom: '#10b981',
              gradientTo: '#14b8a6'
            });
          }
        }
      } catch (error) {
        console.error('❌ [DASHBOARD BG] Error loading background settings:', error);
        // Fallback to localStorage on error
        const storedAppearance = localStorage.getItem('parentPortalAppearance');
        if (storedAppearance) {
          console.log('🔄 [DASHBOARD BG] Using localStorage fallback');
          setParentPortalBackground(JSON.parse(storedAppearance));
        } else {
          // Use default on error
          setParentPortalBackground({
            backgroundType: 'gradient',
            gradientFrom: '#10b981',
            gradientTo: '#14b8a6'
          });
        }
      }
    }
    
    loadSchoolBackground();
    
    // Refresh background every 60 seconds (reduced from 30s to reduce server load)
    const refreshInterval = setInterval(loadSchoolBackground, 60000);
    
    return () => clearInterval(refreshInterval);
  }, [currentParent?.schoolCode]);
  
  // Heartbeat check - verify account still exists every 5 seconds
  useEffect(() => {
    if (!currentParent) return;
    
    // Don't run heartbeat until parents data is loaded (to avoid false positives on initial load)
    if (dataLoading || parents.length === 0) {
      console.log('⏳ [HEARTBEAT] Skipping check - data still loading or no parents loaded yet');
      return;
    }
    
    const checkAccountStatus = () => {
      console.log('💓 [HEARTBEAT] Checking if parent account still exists:', currentParent.id);
      console.log('📊 [HEARTBEAT] Total parents in database:', parents.length);
      
      // Check if the current parent still exists in the parents array
      const accountStillExists = parents.some(p => p.id === currentParent.id);
      
      if (!accountStillExists) {
        console.error('🚨 [HEARTBEAT] Account not found - has been deleted by school admin!');
        toast.error('Your account has been deleted by the school. You will be logged out.', { duration: 5000 });
        
        // Wait 2 seconds for user to see the message, then logout
        setTimeout(() => {
          logout();
          navigate('/');
        }, 2000);
      } else {
        console.log('✅ [HEARTBEAT] Account still exists');
      }
    };
    
    // Don't check immediately - wait 3 seconds to ensure data is fully loaded
    const initialTimeout = setTimeout(checkAccountStatus, 3000);
    
    // Then check every 5 seconds
    const heartbeatInterval = setInterval(checkAccountStatus, 5000);
    
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(heartbeatInterval);
    };
  }, [currentParent, parents, dataLoading, logout, navigate]);
  
  // Update last activity time on any user interaction
  useEffect(() => {
    const updateActivity = () => {
      if (currentParent) {
        localStorage.setItem('lastActivityTime', Date.now().toString());
      }
    };
    
    // Track various user interactions
    window.addEventListener('click', updateActivity);
    window.addEventListener('keypress', updateActivity);
    window.addEventListener('scroll', updateActivity);
    window.addEventListener('touchstart', updateActivity);
    
    return () => {
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('keypress', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
    };
  }, [currentParent]);
  
  // Auto-refresh child requests from Supabase every 10 seconds
  useEffect(() => {
    if (!currentParent) return;
    
    console.log('🔄 [INTERVAL] Setting up auto-refresh interval for parent:', currentParent.id);
    
    // Initial refresh
    refreshChildRequests();
    
    // Set up periodic refresh
    const interval = setInterval(() => {
      console.log('⏰ [INTERVAL] 10 seconds elapsed - auto-refreshing child requests...');
      refreshChildRequests();
    }, 10000); // Refresh every 10 seconds
    
    return () => {
      console.log('🛑 [INTERVAL] Clearing auto-refresh interval');
      clearInterval(interval);
    };
  }, [currentParent]); // Only depend on currentParent, not refreshChildRequests
  
  // Sync currentParent with latest data from DataContext when parent data updates
  useEffect(() => {
    if (!currentParent || dataLoading) return;
    
    // Find the latest version of this parent in the parents array
    const latestParentData = parents.find(p => p.id === currentParent.id);
    
    if (latestParentData) {
      // Check if childrenIds have changed (child was approved by school admin)
      const childrenIdsChanged = JSON.stringify(latestParentData.childrenIds) !== JSON.stringify(currentParent.childrenIds);
      
      if (childrenIdsChanged) {
        console.log('🔄 [SYNC] Parent data changed! Updating currentParent...');
        console.log('📊 [SYNC] Old childrenIds:', currentParent.childrenIds);
        console.log('📊 [SYNC] New childrenIds:', latestParentData.childrenIds);
        
        // Update the currentParent in AuthContext with latest data
        updateCurrentParent(latestParentData);
        
        toast.success('Your children list has been updated!', { duration: 3000 });
      }
    }
  }, [parents, currentParent, dataLoading, updateCurrentParent]);
  
  // School logo (from localStorage or default)
  const schoolLogo = localStorage.getItem('schoolLogo') || '';
  const schoolName = localStorage.getItem('schoolName') || 'School';
  
  // History filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'clock-in' | 'clock-out'>('all');
  const [filterDate, setFilterDate] = useState('');
  
  // GPS location states
  const [gpsLocation, setGpsLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(true);
  const [gpsSamples, setGpsSamples] = useState<Array<{
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
  }>>([]);
  const [isGpsActive, setIsGpsActive] = useState(false);

  const children = currentParent ? getStudentsByIds(currentParent.childrenIds) : [];

  // School location configuration
  // TODO: Update these coordinates to match your actual school location
  // You can get coordinates from Google Maps by right-clicking on the school location
  const SCHOOL_LOCATION = {
    latitude: 6.5244,  // Example: Lagos, Nigeria coordinates - UPDATE THIS
    longitude: 3.3792, // Example: Lagos, Nigeria coordinates - UPDATE THIS
    radius: 100 // School boundary radius in meters (100m = ~328 feet)
  };

  // Calculate distance between two GPS coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Check if parent is inside school
  const isInsideSchool = gpsLocation
    ? calculateDistance(
        gpsLocation.latitude,
        gpsLocation.longitude,
        SCHOOL_LOCATION.latitude,
        SCHOOL_LOCATION.longitude
      ) <= SCHOOL_LOCATION.radius
    : false;

  const distanceToSchool = gpsLocation
    ? calculateDistance(
        gpsLocation.latitude,
        gpsLocation.longitude,
        SCHOOL_LOCATION.latitude,
        SCHOOL_LOCATION.longitude
      )
    : null;

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Continuous GPS tracking with 5 samples
  useEffect(() => {
    if ('geolocation' in navigator) {
      let watchId: number;
      
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newSample = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          };

          setGpsSamples((prevSamples) => {
            // Add new sample and keep only the last 5
            const updatedSamples = [...prevSamples, newSample].slice(-5);
            
            // Calculate average location from samples
            if (updatedSamples.length > 0) {
              const avgLat = updatedSamples.reduce((sum, s) => sum + s.latitude, 0) / updatedSamples.length;
              const avgLng = updatedSamples.reduce((sum, s) => sum + s.longitude, 0) / updatedSamples.length;
              const bestAccuracy = Math.min(...updatedSamples.map(s => s.accuracy));
              
              setGpsLocation({
                latitude: avgLat,
                longitude: avgLng,
                accuracy: bestAccuracy
              });
            }
            
            return updatedSamples;
          });

          setGpsLoading(false);
          setGpsError(null);
          setIsGpsActive(true);
        },
        (error) => {
          setGpsLoading(false);
          setIsGpsActive(false);
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setGpsError('Location permission denied');
              break;
            case error.POSITION_UNAVAILABLE:
              setGpsError('Location unavailable');
              break;
            case error.TIMEOUT:
              setGpsError('Location request timed out');
              break;
            default:
              setGpsError('Unknown location error');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );

      // Cleanup function to stop watching position
      return () => {
        if (watchId !== undefined) {
          navigator.geolocation.clearWatch(watchId);
          setIsGpsActive(false);
        }
      };
    } else {
      setGpsLoading(false);
      setGpsError('Geolocation not supported');
    }
  }, []);

  useEffect(() => {
    // Don't redirect while still loading session from localStorage
    if (isLoading) return;
    
    if (!currentParent) {
      // Get the school code that was stored during login
      const schoolCode = localStorage.getItem('currentParentSchoolCode');
      
      // Redirect to school-specific login if school code exists
      if (schoolCode) {
        navigate(`/school/${schoolCode}/parent-login`);
      } else {
        // Fallback to generic parent login
        navigate('/parent/login');
      }
      return;
    }

    const today = new Date().toDateString();
    // Get logs for ALL children in this family (from any parent), not just logs created by this parent
    const todayLogs = attendanceLogs.filter(
      log => {
        // Check if any of the log's children match this parent's children
        const hasSharedChild = log.childrenIds.some(childId => currentParent.childrenIds.includes(childId));
        const isToday = new Date(log.timestamp).toDateString() === today;
        return hasSharedChild && isToday;
      }
    );

    const statusMap = new Map<string, ChildStatus>();
    const currentChildren = getStudentsByIds(currentParent.childrenIds);

    currentChildren.forEach(child => {
      // Get today's logs for this child
      const childLogsToday = todayLogs.filter(log => log.childrenIds.includes(child.id));
      
      let status: 'not-clocked-in' | 'clocked-in' | 'clocked-out' = 'not-clocked-in';
      let lastClockIn: string | undefined;
      let lastClockOut: string | undefined;
      let lastActionBy: { name: string; photo: string } | undefined;
      let hasClockInToday = false;
      let hasClockOutToday = false;

      // Sort today's logs by timestamp
      childLogsToday.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      let lastLog: typeof todayLogs[0] | undefined;
      
      // Process today's logs to determine current status
      childLogsToday.forEach(log => {
        if (log.type === 'clock-in') {
          hasClockInToday = true;
          status = 'clocked-in';
          lastClockIn = log.timestamp;
          lastLog = log;
        } else if (log.type === 'clock-out') {
          hasClockOutToday = true;
          status = 'clocked-out';
          lastClockOut = log.timestamp;
          lastLog = log;
        }
      });

      // Get parent info from the last log
      if (lastLog) {
        const parentWhoActed = parents.find(p => p.id === lastLog.parentId);
        if (parentWhoActed) {
          lastActionBy = {
            name: parentWhoActed.name,
            photo: lastLog.faceImage || parentWhoActed.photo // Use facial capture photo, fallback to parent profile photo
          };
        }
      }

      statusMap.set(child.id, {
        id: child.id,
        status,
        lastClockIn,
        lastClockOut,
        lastActionBy,
        hasClockInToday,
        hasClockOutToday
      });
    });

    setChildrenStatuses(statusMap);
  }, [currentParent, attendanceLogs, navigate, getStudentsByIds, isLoading, parents]);

  const handleLogout = () => {
    // Get the school code that was stored during login
    const schoolCode = localStorage.getItem('currentParentSchoolCode');
    
    logout();
    
    // Redirect to school-specific login if school code exists
    if (schoolCode) {
      navigate(`/school/${schoolCode}/parent-login`);
    } else {
      // Fallback to generic parent login
      navigate('/parent/login');
    }
  };

  const handleClockIn = () => {
    if (!currentParent) return;
    
    if (selectedChildren.length === 0) {
      toast.error('Please select at least one child');
      return;
    }

    // Validate that all selected children haven't clocked in today
    const invalidChildren = selectedChildren.filter(childId => {
      const status = childrenStatuses.get(childId);
      return status?.hasClockInToday;
    });

    if (invalidChildren.length > 0) {
      const childNames = children
        .filter(c => invalidChildren.includes(c.id))
        .map(c => c.name)
        .join(', ');
      toast.error(`Cannot clock in: ${childNames} already clocked in today`);
      return;
    }

    // Close child selection modal and show facial capture
    setShowClockInModal(false);
    setPendingAction('clock-in');
    setShowFacialCaptureModal(true);
  };

  const handleClockOut = () => {
    if (!currentParent) return;
    
    if (selectedChildren.length === 0) {
      toast.error('Please select at least one child');
      return;
    }

    // Validate that all selected children are clocked in and haven't clocked out today
    const notClockedIn = selectedChildren.filter(childId => {
      const status = childrenStatuses.get(childId);
      return status?.status !== 'clocked-in';
    });

    const alreadyClockedOut = selectedChildren.filter(childId => {
      const status = childrenStatuses.get(childId);
      return status?.hasClockOutToday;
    });

    if (notClockedIn.length > 0) {
      const childNames = children
        .filter(c => notClockedIn.includes(c.id))
        .map(c => c.name)
        .join(', ');
      toast.error(`Cannot clock out: ${childNames} not clocked in yet`);
      return;
    }

    if (alreadyClockedOut.length > 0) {
      const childNames = children
        .filter(c => alreadyClockedOut.includes(c.id))
        .map(c => c.name)
        .join(', ');
      toast.error(`Cannot clock out: ${childNames} already clocked out today`);
      return;
    }

    // Close child selection modal and show facial capture
    setShowClockOutModal(false);
    setPendingAction('clock-out');
    setShowFacialCaptureModal(true);
  };

  const handleFacialCaptureComplete = (faceImageData: string) => {
    if (!currentParent || !pendingAction) return;

    const childrenNames = children
      .filter(c => selectedChildren.includes(c.id))
      .map(c => c.name);

    addAttendanceLog({
      parentId: currentParent.id,
      parentName: currentParent.name,
      childrenIds: selectedChildren,
      childrenNames,
      type: pendingAction,
      faceImage: faceImageData
    });

    setSelectedChildren([]);
    setShowFacialCaptureModal(false);
    setPendingAction(null);
    toast.success(`Successfully ${pendingAction === 'clock-in' ? 'clocked in' : 'clocked out'}: ${childrenNames.join(', ')}`);
  };

  const handlePasswordChange = () => {
    if (!currentParent) return;
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    // Update password in database
    updateParentPassword(currentParent.id, newPassword);
    
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordModal(false);
    toast.success('Password updated successfully! You can now login with your new password.');
  };

  const availableForClockIn = children.filter(child => {
    const status = childrenStatuses.get(child.id);
    // Can ONLY clock in if they haven't clocked in today yet
    // Once clocked in today, they cannot clock in again (even after clock out)
    return !status?.hasClockInToday;
  });

  const availableForClockOut = children.filter(child => {
    const status = childrenStatuses.get(child.id);
    // Can ONLY clock out if currently clocked in AND haven't clocked out today yet
    return status?.status === 'clocked-in' && !status?.hasClockOutToday;
  });

  // Count logs for THIS WEEK for all children this parent has access to
  // This should match what's displayed in the history modal
  const weekLogs = currentParent
    ? attendanceLogs.filter(log => {
        // Show logs for any children that this parent has access to
        const hasSharedChild = log.childrenIds.some(childId => currentParent.childrenIds.includes(childId));
        const isThisWeek = new Date(log.timestamp) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return hasSharedChild && isThisWeek;
      })
    : [];

  // Get all history for the modal - show logs from ALL parents for shared children
  const allHistory = currentParent
    ? attendanceLogs
        .filter(log => {
          // Show logs for any children that this parent has access to
          return log.childrenIds.some(childId => currentParent.childrenIds.includes(childId));
        })
        .flatMap(log => {
          // Get parent info from log
          const parentWhoActed = parents.find(p => p.id === log.parentId);
          
          return log.childrenNames.map((childName, index) => {
            const childId = log.childrenIds[index];
            const child = getStudentsByIds([childId])[0];
            
            return {
              id: `${log.id}-${index}`,
              childId,
              childName,
              childPhoto: child?.image || '',
              parentName: log.parentName, // Include which parent performed the action
              parentPhoto: log.faceImage || parentWhoActed?.photo || '', // Use facial capture photo, fallback to parent profile photo
              type: log.type,
              timestamp: log.timestamp,
              // Assignee fields
              assigneeId: log.assigneeId,
              assigneeName: log.assigneeName,
              assigneePhoto: log.assigneePhoto,
              assignedBy: log.assignedBy,
              assignedByName: log.assignedByName
            };
          });
        })
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    : [];

  // Show loading screen while restoring session
  if (isLoading) {
    const loadingBgStyle = parentPortalBackground 
      ? (() => {
          const { backgroundType, backgroundColor, backgroundImage, gradientFrom, gradientTo } = parentPortalBackground;
          if (backgroundType === 'gradient') {
            return { background: `linear-gradient(to bottom right, ${gradientFrom || '#10b981'}, ${gradientTo || '#14b8a6'})` };
          } else if (backgroundType === 'image' && backgroundImage) {
            return {
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            };
          } else if (backgroundType === 'color') {
            return { backgroundColor: backgroundColor || '#10b981' };
          }
          return { background: 'linear-gradient(to bottom right, #10b981, #14b8a6)' };
        })()
      : { background: 'linear-gradient(to bottom right, #10b981, #14b8a6)' };

    return (
      <div className="min-h-screen flex items-center justify-center" style={loadingBgStyle}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
          <p className="text-white font-semibold">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!currentParent) return null;

  // Generate background style based on school settings
  const getBackgroundStyle = () => {
    if (!parentPortalBackground) {
      // Default gradient while loading
      console.log('🎨 [DASHBOARD BG STYLE] No background data, using default');
      return {
        background: 'linear-gradient(to bottom right, #10b981, #14b8a6)'
      };
    }

    const { backgroundType, backgroundColor, backgroundImage, gradientFrom, gradientTo } = parentPortalBackground;
    
    console.log('🎨 [DASHBOARD BG STYLE] Applying background:', { backgroundType, backgroundColor, gradientFrom, gradientTo, hasImage: !!backgroundImage });

    if (backgroundType === 'gradient') {
      const style = {
        background: `linear-gradient(to bottom right, ${gradientFrom || '#10b981'}, ${gradientTo || '#14b8a6'})`
      };
      console.log('🎨 [DASHBOARD BG STYLE] Using gradient:', style.background);
      return style;
    } else if (backgroundType === 'image' && backgroundImage) {
      console.log('🎨 [DASHBOARD BG STYLE] Using image:', backgroundImage);
      return {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      };
    } else if (backgroundType === 'color') {
      const style = {
        backgroundColor: backgroundColor || '#10b981'
      };
      console.log('🎨 [DASHBOARD BG STYLE] Using solid color:', style.backgroundColor);
      return style;
    }

    // Fallback
    console.log('🎨 [DASHBOARD BG STYLE] Using fallback gradient');
    return {
      background: 'linear-gradient(to bottom right, #10b981, #14b8a6)'
    };
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTimeDifference = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="min-h-screen" style={getBackgroundStyle()}>
      {/* Header */}
      <header className="bg-white backdrop-blur-xl border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {schoolLogo ? (
                <img
                  src={schoolLogo}
                  alt={schoolName}
                  className="w-12 h-12 rounded-xl object-cover shadow-lg"
                />
              ) : (
                <div className="parent-gradient-primary w-12 h-12 rounded-xl flex items-center justify-center shadow-lg">
                  <School className="w-7 h-7 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">{schoolName} Attendance Portal</h1>
                <p className="text-sm text-gray-600">Real-time attendance tracking</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowProfileModal(true)}
                className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                title="My Profile"
              >
                <UserCircle className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-emerald-100 w-12 h-12 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <Badge variant="success">{children.length}</Badge>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{children.length}</p>
            <p className="text-sm text-gray-600">Total Children</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <Badge variant="success">{availableForClockOut.length}</Badge>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{availableForClockOut.length}</p>
            <p className="text-sm text-gray-600">Currently In School</p>
          </div>
        </div>

        {/* Subscription Expired Notice */}
        {(() => {
          const subscriptionExpiry = localStorage.getItem('subscriptionExpiryDate');
          if (subscriptionExpiry) {
            const expiryDate = new Date(subscriptionExpiry);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            expiryDate.setHours(0, 0, 0, 0);
            const isExpired = expiryDate < today;
            
            if (isExpired) {
              return (
                <div className="bg-red-50 border-2 border-red-300 rounded-xl p-5 mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-red-900 mb-1">
                        School Subscription Expired
                      </h3>
                      <p className="text-sm text-red-700">
                        The school's subscription has expired. Some features may be limited until the subscription is renewed. 
                        Please contact the school administration for more information.
                      </p>
                    </div>
                  </div>
                </div>
              );
            }
          }
          return null;
        })()}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Quick Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Date & Time Card */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 w-10 h-10 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-xs font-mono text-emerald-600">
                    {formatTime(currentTime)}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Timer className="w-5 h-5 text-emerald-600" />
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setSelectedChildren([]);
                    setShowClockInModal(true);
                  }}
                  disabled={availableForClockIn.length === 0}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                    availableForClockIn.length === 0
                      ? 'bg-gray-200 cursor-not-allowed opacity-50'
                      : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 shadow-lg hover:shadow-xl'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      availableForClockIn.length === 0 ? 'bg-gray-300' : 'bg-white/20'
                    }`}>
                      <LogIn className={`w-5 h-5 ${
                        availableForClockIn.length === 0 ? 'text-emerald-600' : 'text-white'
                      }`} />
                    </div>
                    <div className="text-left">
                      <p className={`font-semibold ${
                        availableForClockIn.length === 0 ? 'text-emerald-600' : 'text-white'
                      }`}>Clock In</p>
                      <p className={`text-xs ${
                        availableForClockIn.length === 0 ? 'text-gray-600' : 'text-white/70'
                      }`}>{availableForClockIn.length} available</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/70" />
                </button>

                <button
                  onClick={() => {
                    setSelectedChildren([]);
                    setShowClockOutModal(true);
                  }}
                  disabled={availableForClockOut.length === 0}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                    availableForClockOut.length === 0
                      ? 'bg-gray-200 cursor-not-allowed opacity-50'
                      : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-lg hover:shadow-xl'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 w-10 h-10 rounded-lg flex items-center justify-center">
                      <LogOutIcon className={`w-5 h-5 ${availableForClockOut.length === 0 ? 'text-red-400' : 'text-white'}`} />
                    </div>
                    <div className="text-left">
                      <p className={`font-semibold ${availableForClockOut.length === 0 ? 'text-red-600' : 'text-white'}`}>Clock Out</p>
                      <p className={`text-xs ${availableForClockOut.length === 0 ? 'text-gray-500' : 'text-white/70'}`}>{availableForClockOut.length} available</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 ${availableForClockOut.length === 0 ? 'text-gray-400' : 'text-white/70'}`} />
                </button>

                <button
                  onClick={() => {
                    console.log('📊 [HISTORY] Opening history modal');
                    console.log('📊 [HISTORY] Week logs count:', weekLogs.length);
                    console.log('📊 [HISTORY] Total attendance logs:', attendanceLogs.length);
                    console.log('📊 [HISTORY] Current parent children:', currentParent?.childrenIds);
                    setShowHistoryModal(true);
                  }}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center">
                      <History className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">View History</p>
                      <p className="text-xs text-gray-600">{weekLogs.length} this week</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* GPS Location Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-blue-600" />
                  GPS Location
                </h3>
                {/* Refresh Location Button - Always refreshing with continuous tracking */}
                {isGpsActive && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-lg">
                      <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                      <span className="text-xs font-semibold text-blue-700">Refreshing</span>
                    </div>
                  </div>
                )}
              </div>
              {gpsLoading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600 mb-3"></div>
                  <p className="text-sm text-gray-600">Getting your location...</p>
                </div>
              ) : gpsError ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm font-semibold text-red-900">Location Error</p>
                  </div>
                  <p className="text-xs text-red-700">{gpsError}</p>
                </div>
              ) : gpsLocation ? (
                <div className="space-y-3">
                  {/* Continuous Tracking Status */}
                  {isGpsActive && (
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="relative flex-shrink-0">
                          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                          <div className="absolute inset-0 w-3 h-3 bg-emerald-500 rounded-full animate-ping opacity-75"></div>
                        </div>
                        <p className="text-sm font-bold text-emerald-900">Continuous GPS Tracking Active</p>
                      </div>
                      <p className="text-xs text-emerald-700 ml-5">
                        Using {gpsSamples.length}/5 GPS samples for improved accuracy. Location updates automatically.
                      </p>
                    </div>
                  )}

                  {/* Coordinates */}
                  <div className="border-l-4 border-blue-500 pl-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Coordinates</p>
                    <p className="text-sm text-gray-700">
                      <span className="font-mono">{gpsLocation.latitude.toFixed(6)}°</span>
                      <span className="text-gray-400 mx-1.5">,</span>
                      <span className="font-mono">{gpsLocation.longitude.toFixed(6)}°</span>
                    </p>
                  </div>

                  {/* School Location Status */}
                  <div className={`border-l-4 pl-3 ${
                    isInsideSchool ? 'border-emerald-500' : 'border-orange-500'
                  }`}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">School Location Status</p>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-bold ${
                        isInsideSchool ? 'text-emerald-600' : 'text-orange-600'
                      }`}>
                        {isInsideSchool ? '✓ Inside School' : '✗ Outside School'}
                      </p>
                    </div>
                    {distanceToSchool !== null && (
                      <p className="text-xs text-gray-600 mt-1">
                        {isInsideSchool ? (
                          <>Within school premises ({distanceToSchool.toFixed(0)}m from center)</>
                        ) : (
                          <>Distance: {distanceToSchool >= 1000 
                            ? `${(distanceToSchool / 1000).toFixed(2)} km` 
                            : `${distanceToSchool.toFixed(0)} m`} from school</>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Accuracy */}
                  <div className="border-l-4 border-gray-400 pl-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Accuracy</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-700 font-semibold">
                        ±{gpsLocation.accuracy.toFixed(1)}m
                      </p>
                      {gpsLocation.accuracy < 20 && (
                        <span className="text-xs text-emerald-600 font-medium">(Excellent)</span>
                      )}
                      {gpsLocation.accuracy >= 20 && gpsLocation.accuracy < 50 && (
                        <span className="text-xs text-gray-600 font-medium">(Good)</span>
                      )}
                      {gpsLocation.accuracy >= 50 && (
                        <span className="text-xs text-orange-600 font-medium">(Fair)</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Right Column - Children Cards */}
          <div className="lg:col-span-2">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Your Children</h3>
                <p className="text-gray-600">Manage attendance for {children.length} {children.length === 1 ? 'child' : 'children'}</p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={() => {
                    console.log('🔵 Assign Someone button clicked');
                    console.log('Current parent:', currentParent);
                    console.log('Children:', children);
                    if (!currentParent) {
                      toast.error('Parent information not loaded');
                      return;
                    }
                    if (!children || children.length === 0) {
                      toast.error('No children found. Please add a child first.');
                      return;
                    }
                    setShowAssignSomeoneModal(true);
                  }}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2 flex-shrink-0"
                >
                  <Users className="w-5 h-5" />
                  <span>Assign Someone</span>
                </button>
                <button
                  onClick={() => setShowAddChildModal(true)}
                  className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-green-600/25 hover:shadow-xl hover:shadow-green-600/30 transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2 flex-shrink-0"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Add Child</span>
                </button>
              </div>
            </div>

            {/* Child Addition Requests */}
            {(() => {
              const pendingRequests = childAdditionRequests.filter(
                req => req.parentId === currentParent?.id && req.status === 'pending'
              );
              
              const approvedRequests = childAdditionRequests.filter(
                req => req.parentId === currentParent?.id && req.status === 'approved'
              );
              
              const rejectedRequests = childAdditionRequests.filter(
                req => req.parentId === currentParent?.id && req.status === 'rejected'
              );
              
              // Debug logging
              console.log('🔍 Current parent ID:', currentParent?.id);
              console.log('🔍 All child requests:', childAdditionRequests.map(r => ({
                id: r.id,
                parentId: r.parentId,
                status: r.status,
                studentName: r.studentName
              })));
              console.log('🔍 Pending requests for this parent:', pendingRequests.length);
              console.log('🔍 Approved requests for this parent:', approvedRequests.length);
              console.log('🔍 Rejected requests for this parent:', rejectedRequests.length);
              
              if (pendingRequests.length > 0 || approvedRequests.length > 0 || rejectedRequests.length > 0) {
                return (
                  <div className="mb-6 space-y-6">
                    {/* Pending Requests */}
                    {pendingRequests.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                          Pending Approval ({pendingRequests.length})
                        </h4>
                        <div className="space-y-3">
                          {pendingRequests.map((request) => {
                            const student = getStudentsByIds([request.studentId])[0];
                            
                            return (
                              <div
                                key={request.id}
                                className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 shadow-sm"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {student ? (
                                      <div className="relative flex-shrink-0">
                                        <img
                                          src={student.image}
                                          alt={student.name}
                                          className="w-14 h-14 rounded-full object-cover border-2 border-amber-300 shadow-sm"
                                          onError={(e) => {
                                            e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`;
                                          }}
                                        />
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shadow-sm">
                                          <Clock className="w-3.5 h-3.5 text-white" />
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="bg-amber-100 w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-amber-300">
                                        <Clock className="w-6 h-6 text-amber-600" />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <h5 className="font-bold text-gray-900 truncate">
                                          {request.studentName}
                                        </h5>
                                        <Badge variant="warning" size="sm">Pending</Badge>
                                      </div>
                                      <p className="text-sm text-gray-600 truncate">
                                        Student ID: {request.studentId}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        Requested on {new Date(request.requestDate).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric'
                                        })} at {new Date(request.requestDate).toLocaleTimeString('en-US', {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      deleteChildAdditionRequest(request.id);
                                    }}
                                    className="w-full sm:w-auto px-3 py-2 bg-red-100 hover:bg-red-200 active:bg-red-300 text-red-700 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-1.5 flex-shrink-0"
                                  >
                                    <X className="w-4 h-4" />
                                    <span>Cancel</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Rejected Requests - Show First for Visibility */}
                    {rejectedRequests.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          Rejected Requests ({rejectedRequests.length})
                        </h4>
                        <div className="space-y-3">
                          {rejectedRequests.map((request) => {
                            const student = getStudentsByIds([request.studentId])[0];
                            
                            return (
                              <div
                                key={request.id}
                                className="bg-red-50 border-2 border-red-200 rounded-xl p-4 shadow-sm"
                              >
                                <div className="flex flex-col gap-3">
                                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      {student ? (
                                        <div className="relative flex-shrink-0">
                                          <img
                                            src={student.image}
                                            alt={student.name}
                                            className="w-14 h-14 rounded-full object-cover border-2 border-red-300 shadow-sm"
                                            onError={(e) => {
                                              e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`;
                                            }}
                                          />
                                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
                                            <XCircle className="w-3.5 h-3.5 text-white" />
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="bg-red-100 w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-red-300">
                                          <XCircle className="w-6 h-6 text-red-600" />
                                        </div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                          <h5 className="font-bold text-gray-900 truncate">
                                            {request.studentName}
                                          </h5>
                                          <Badge variant="danger" size="sm">Rejected</Badge>
                                        </div>
                                        <p className="text-sm text-gray-600 truncate">
                                          Student ID: {request.studentId}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                          Rejected on {new Date(request.reviewDate!).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                          })} by {request.reviewedBy}
                                        </p>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => {
                                        deleteChildAdditionRequest(request.id);
                                      }}
                                      className="w-full sm:w-auto px-3 py-2 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-1.5 flex-shrink-0"
                                    >
                                      <X className="w-4 h-4" />
                                      <span>Dismiss</span>
                                    </button>
                                  </div>
                                  
                                  {/* Rejection Reason - Prominent Display */}
                                  {request.notes && (
                                    <div className="bg-white border-2 border-red-300 rounded-lg p-3">
                                      <p className="text-xs font-bold text-red-800 mb-1.5 flex items-center gap-1.5">
                                        <AlertCircle className="w-4 h-4" />
                                        Reason for Rejection:
                                      </p>
                                      <p className="text-sm text-gray-800 leading-relaxed">
                                        "{request.notes}"
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Approved Requests */}
                    {approvedRequests.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          Approved Requests ({approvedRequests.length})
                        </h4>
                        <div className="space-y-3">
                          {approvedRequests.map((request) => {
                            const student = getStudentsByIds([request.studentId])[0];
                            
                            return (
                              <div
                                key={request.id}
                                className="bg-green-50 border-2 border-green-200 rounded-xl p-4 shadow-sm"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {student ? (
                                      <div className="relative flex-shrink-0">
                                        <img
                                          src={student.image}
                                          alt={student.name}
                                          className="w-14 h-14 rounded-full object-cover border-2 border-green-300 shadow-sm"
                                          onError={(e) => {
                                            e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`;
                                          }}
                                        />
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                                          <CheckCircle className="w-3.5 h-3.5 text-white" />
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="bg-green-100 w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-green-300">
                                        <CheckCircle className="w-6 h-6 text-green-600" />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <h5 className="font-bold text-gray-900 truncate">
                                          {request.studentName}
                                        </h5>
                                        <Badge variant="success" size="sm">Approved</Badge>
                                      </div>
                                      <p className="text-sm text-gray-600 truncate">
                                        Student ID: {request.studentId}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        Approved on {new Date(request.reviewDate!).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric'
                                        })} by {request.reviewedBy}
                                      </p>
                                      {request.notes && (
                                        <div className="mt-2 bg-white border border-green-200 rounded-lg p-2">
                                          <p className="text-xs text-gray-600">
                                            <span className="font-semibold">Note:</span> {request.notes}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      deleteChildAdditionRequest(request.id);
                                    }}
                                    className="w-full sm:w-auto px-3 py-2 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-1.5 flex-shrink-0"
                                  >
                                    <X className="w-4 h-4" />
                                    <span>Dismiss</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            })()}

            {/* Active Assignees Section */}
            <div className="mb-8">
              <ActiveAssignees parent={currentParent!} />
            </div>

            {children.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 border border-gray-200 text-center shadow-sm">
                <div className="bg-gray-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-xl text-gray-900 font-semibold mb-2">No Children Assigned</p>
                <p className="text-gray-600">Please contact the school administrator to link your children</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {children.map((child) => {
                  const status = childrenStatuses.get(child.id);
                  const isIn = status?.status === 'clocked-in';
                  const isOut = status?.status === 'clocked-out';
                  
                  return (
                    <div 
                      key={child.id} 
                      className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all"
                    >
                      {/* Header with Status */}
                      <div className={`px-6 py-3 border-b ${
                        isIn ? 'bg-emerald-50 border-emerald-100' : 
                        isOut ? 'bg-red-50 border-red-100' : 
                        'bg-gray-50 border-gray-100'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              isIn ? 'bg-emerald-500 animate-pulse' : 
                              isOut ? 'bg-red-500' : 
                              'bg-gray-400'
                            }`} />
                            <span className={`text-sm font-semibold ${
                              isIn ? 'text-emerald-700' : 
                              isOut ? 'text-red-700' : 
                              'text-gray-700'
                            }`}>
                              {isIn ? 'In School' : isOut ? 'Checked Out' : 'Not Checked In'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-600">ID: {child.id}</span>
                        </div>
                      </div>

                      <div className="p-6">
                        {/* Child Info Section */}
                        <div className="flex items-center gap-4 mb-6">
                          <div className="relative flex-shrink-0">
                            <img
                              src={child.image}
                              alt={child.name}
                              className="w-20 h-20 rounded-full bg-gray-100 border-2 border-gray-200 shadow-sm object-cover"
                            />
                            <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-lg flex items-center justify-center shadow-lg ${
                              isIn ? 'bg-emerald-500' : isOut ? 'bg-red-500' : 'bg-gray-400'
                            }`}>
                              {isIn ? (
                                <CheckCircle2 className="w-4 h-4 text-white" />
                              ) : isOut ? (
                                <LogOutIcon className="w-4 h-4 text-white" />
                              ) : (
                                <Clock className="w-4 h-4 text-white" />
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xl font-bold text-gray-900 mb-1 truncate">{child.name}</h4>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="info" size="sm">{child.class}</Badge>
                              <Badge variant={child.gender === 'Male' ? 'blue' : 'pink'} size="sm">
                                {child.gender}
                              </Badge>
                              <Badge variant="default" size="sm">{child.age} yrs</Badge>
                            </div>
                          </div>
                        </div>

                        {/* Activity Timeline */}
                        {(status?.lastClockIn || status?.lastClockOut) && (
                          <div className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-200">
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                              Today's Activity
                            </p>
                            <div className="space-y-3">
                              {status?.lastClockIn && (
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                  {/* Icon and Time Info */}
                                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                    <div className="bg-emerald-100 w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0">
                                      <LogIn className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs sm:text-sm font-semibold text-gray-900">Clocked In</p>
                                      <p className="text-[10px] sm:text-xs text-gray-600">
                                        {new Date(status.lastClockIn).toLocaleTimeString([], { 
                                          hour: '2-digit', 
                                          minute: '2-digit' 
                                        })} • {getTimeDifference(status.lastClockIn)}
                                      </p>
                                    </div>
                                  </div>
                                  {/* Parent Info */}
                                  {status.lastActionBy && (
                                    <div className="flex items-center gap-2 pl-10 sm:pl-0 sm:flex-shrink-0">
                                      <img 
                                        src={status.lastActionBy.photo} 
                                        alt={status.lastActionBy.name}
                                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-emerald-200 shadow-sm"
                                        onError={(e) => {
                                          e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${status.lastActionBy?.name}`;
                                        }}
                                      />
                                      <div className="text-left sm:text-right">
                                        <p className="text-[10px] sm:text-xs font-medium text-gray-700 truncate max-w-[120px]">
                                          {status.lastActionBy.name}{' '}
                                          {status.lastActionBy.name === currentParent?.name && (
                                            <span className="text-emerald-600">(You)</span>
                                          )}
                                        </p>
                                        <p className="text-[9px] sm:text-xs text-gray-500">
                                          Parent
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              {status?.lastClockOut && (
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                  {/* Icon and Time Info */}
                                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                    <div className="bg-red-100 w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0">
                                      <LogOutIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs sm:text-sm font-semibold text-gray-900">Clocked Out</p>
                                      <p className="text-[10px] sm:text-xs text-gray-600">
                                        {new Date(status.lastClockOut).toLocaleTimeString([], { 
                                          hour: '2-digit', 
                                          minute: '2-digit' 
                                        })} • {getTimeDifference(status.lastClockOut)}
                                      </p>
                                    </div>
                                  </div>
                                  {/* Parent Info */}
                                  {status.lastActionBy && (
                                    <div className="flex items-center gap-2 pl-10 sm:pl-0 sm:flex-shrink-0">
                                      <img 
                                        src={status.lastActionBy.photo} 
                                        alt={status.lastActionBy.name}
                                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-red-200 shadow-sm"
                                        onError={(e) => {
                                          e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${status.lastActionBy?.name}`;
                                        }}
                                      />
                                      <div className="text-left sm:text-right">
                                        <p className="text-[10px] sm:text-xs font-medium text-gray-700 truncate max-w-[120px]">
                                          {status.lastActionBy.name}{' '}
                                          {status.lastActionBy.name === currentParent?.name && (
                                            <span className="text-emerald-600">(You)</span>
                                          )}
                                        </p>
                                        <p className="text-[9px] sm:text-xs text-gray-500">
                                          Parent
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Child Modal */}
      <AddChildModal
        isOpen={showAddChildModal}
        onClose={() => setShowAddChildModal(false)}
        currentParent={currentParent}
      />

      {/* Assign Someone Modal */}
      {currentParent && (
        <AssignSomeoneModal
          isOpen={showAssignSomeoneModal}
          onClose={() => setShowAssignSomeoneModal(false)}
          parent={currentParent}
          children={children}
        />
      )}

      {/* Facial Capture Modal */}
      <FacialCaptureModal
        isOpen={showFacialCaptureModal}
        onClose={() => {
          setShowFacialCaptureModal(false);
          setPendingAction(null);
          setSelectedChildren([]);
        }}
        onCapture={handleFacialCaptureComplete}
        parentName={currentParent?.name || ''}
        action={pendingAction || 'clock-in'}
        childrenCount={selectedChildren.length}
      />

      {/* Clock In Modal */}
      {showClockInModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-green-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-600 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg">
                    <LogIn className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Clock In Children</h3>
                    <p className="text-sm text-gray-600">{availableForClockIn.length} children available</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowClockInModal(false);
                    setSelectedChildren([]);
                  }}
                  className="p-2 hover:bg-white/60 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-3">
                {availableForClockIn.map((child) => (
                  <label
                    key={child.id}
                    className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all border-2 ${
                      selectedChildren.includes(child.id)
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 bg-gray-50 hover:border-emerald-300 hover:bg-emerald-50/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedChildren.includes(child.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedChildren([...selectedChildren, child.id]);
                        } else {
                          setSelectedChildren(selectedChildren.filter(id => id !== child.id));
                        }
                      }}
                      className="w-5 h-5 text-emerald-600 bg-white rounded border-2 border-gray-300 focus:ring-emerald-500 focus:ring-offset-white cursor-pointer mt-1 flex-shrink-0"
                    />
                    <img
                      src={child.image}
                      alt={child.name}
                      className="w-14 h-14 rounded-full bg-gray-100 border-2 border-gray-200 object-cover shadow-sm flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-base truncate">{child.name}</p>
                      <p className="text-sm text-gray-600 truncate">{child.class} • Age {child.age}</p>
                      <div className="mt-2">
                        <Badge variant={child.gender === 'Male' ? 'blue' : 'pink'}>
                          {child.gender}
                        </Badge>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  setShowClockInModal(false);
                  setSelectedChildren([]);
                }}
                className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 hover:border-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClockIn}
                disabled={selectedChildren.length === 0}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-semibold hover:from-emerald-500 hover:to-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                Clock In {selectedChildren.length > 0 && `(${selectedChildren.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clock Out Modal */}
      {showClockOutModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-rose-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-red-600 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg">
                    <LogOutIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Clock Out Children</h3>
                    <p className="text-sm text-gray-600">{availableForClockOut.length} children available</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowClockOutModal(false);
                    setSelectedChildren([]);
                  }}
                  className="p-2 hover:bg-white/60 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-3">
                {availableForClockOut.map((child) => (
                  <label
                    key={child.id}
                    className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all border-2 ${
                      selectedChildren.includes(child.id)
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 bg-gray-50 hover:border-red-300 hover:bg-red-50/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedChildren.includes(child.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedChildren([...selectedChildren, child.id]);
                        } else {
                          setSelectedChildren(selectedChildren.filter(id => id !== child.id));
                        }
                      }}
                      className="w-5 h-5 text-red-600 bg-white rounded border-2 border-gray-300 focus:ring-red-500 focus:ring-offset-white cursor-pointer mt-1 flex-shrink-0"
                    />
                    <img
                      src={child.image}
                      alt={child.name}
                      className="w-14 h-14 rounded-full bg-gray-100 border-2 border-gray-200 object-cover shadow-sm flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-base truncate">{child.name}</p>
                      <p className="text-sm text-gray-600 truncate">{child.class} • Age {child.age}</p>
                      <div className="mt-2">
                        <Badge variant={child.gender === 'Male' ? 'blue' : 'pink'}>
                          {child.gender}
                        </Badge>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  setShowClockOutModal(false);
                  setSelectedChildren([]);
                }}
                className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 hover:border-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClockOut}
                disabled={selectedChildren.length === 0}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-semibold hover:from-red-500 hover:to-rose-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                Clock Out {selectedChildren.length > 0 && `(${selectedChildren.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (() => {
        try {
          // Group history by date and child
          const groupedHistory = new Map<string, Map<string, {
            childId: string;
            childName: string;
            childPhoto: string;
            clockIn?: {
              timestamp: string;
              parentName: string;
              parentPhoto: string;
              status: 'early' | 'late' | 'on-time';
            };
            clockOut?: {
              timestamp: string;
              parentName: string;
              parentPhoto: string;
              status: 'early' | 'on-time';
            };
            isIncomplete: boolean;
          }>>();

          // Process all history records
          allHistory.forEach((record) => {
            if (!record || !record.timestamp) return;
            const dateKey = new Date(record.timestamp).toDateString();
          
          if (!groupedHistory.has(dateKey)) {
            groupedHistory.set(dateKey, new Map());
          }
          
          const dayRecords = groupedHistory.get(dateKey)!;
          
          if (!dayRecords.has(record.childId)) {
            dayRecords.set(record.childId, {
              childId: record.childId,
              childName: record.childName,
              childPhoto: record.childPhoto || '',
              isIncomplete: false
            });
          }
          
          const childRecord = dayRecords.get(record.childId)!;
          const recordTime = new Date(record.timestamp);
          const hours = recordTime.getHours();
          const minutes = recordTime.getMinutes();
          
          if (record.type === 'clock-in') {
            // Determine if early or late (school starts at 8:00 AM)
            let status: 'early' | 'late' | 'on-time' = 'on-time';
            if (hours < 8) {
              status = 'early';
            } else if (hours > 8 || (hours === 8 && minutes > 0)) {
              status = 'late';
            }
            
            childRecord.clockIn = {
              timestamp: typeof record.timestamp === 'string' ? record.timestamp : record.timestamp.toISOString(),
              parentName: record.parentName,
              parentPhoto: record.parentPhoto || '',
              status,
              assigneeId: record.assigneeId,
              assigneeName: record.assigneeName,
              assigneePhoto: record.assigneePhoto,
              assignedByName: record.assignedByName
            };
          } else if (record.type === 'clock-out') {
            // Determine if early or on-time (school ends at 3:00 PM / 15:00)
            let status: 'early' | 'on-time' = 'on-time';
            if (hours < 15 || (hours === 15 && minutes < 0)) {
              status = 'early';
            }
            
            childRecord.clockOut = {
              timestamp: typeof record.timestamp === 'string' ? record.timestamp : record.timestamp.toISOString(),
              parentName: record.parentName,
              parentPhoto: record.parentPhoto || '',
              status,
              assigneeId: record.assigneeId,
              assigneeName: record.assigneeName,
              assigneePhoto: record.assigneePhoto,
              assignedByName: record.assignedByName
            };
          }
          
          // Mark as incomplete if has clock-in but no clock-out
          childRecord.isIncomplete = !!childRecord.clockIn && !childRecord.clockOut;
        });

        // Convert to sorted array for display
        const sortedDays = Array.from(groupedHistory.entries())
          .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());

        // Apply filters
        let filteredDays = sortedDays;
        if (searchQuery) {
          filteredDays = sortedDays.map(([date, children]) => {
            const filteredChildren = new Map(
              Array.from(children.entries()).filter(([_, child]) =>
                child.childName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                child.clockIn?.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                child.clockOut?.parentName.toLowerCase().includes(searchQuery.toLowerCase())
              )
            );
            return [date, filteredChildren] as [string, typeof children];
          }).filter(([_, children]) => children.size > 0);
        }
        
        if (filterDate) {
          filteredDays = filteredDays.filter(([date]) => 
            new Date(date).toISOString().split('T')[0] === filterDate
          );
        }

        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-green-50">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="bg-emerald-600 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-lg">
                      <History className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900">Attendance History</h3>
                      <p className="text-xs sm:text-sm text-gray-600">{allHistory.length} total records</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowHistoryModal(false);
                      setSearchQuery('');
                      setFilterDate('');
                    }}
                    className="p-2 hover:bg-white/60 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* Filters Section */}
                <div className="space-y-2 sm:space-y-3">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by child or parent name..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
                    />
                  </div>

                  {/* Date Filter */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Filter by Date
                    </label>
                    <input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
                    />
                  </div>

                  {/* Clear Filters Button */}
                  {(searchQuery || filterDate) && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setFilterDate('');
                      }}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1.5"
                    >
                      <X className="w-4 h-4" />
                      Clear all filters
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 sm:p-6">
                <div className="space-y-4 sm:space-y-6">
                  {filteredDays.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <div className="bg-gray-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <History className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                      </div>
                      <p className="text-sm sm:text-base text-gray-500 font-medium px-4">
                        {allHistory.length === 0 ? 'No attendance history yet' : 'No records match your filters'}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-400 mt-1.5 sm:mt-2 px-4">
                        {allHistory.length === 0 ? 'Clock in/out records will appear here' : 'Try adjusting your search criteria'}
                      </p>
                    </div>
                  ) : (
                    filteredDays.map(([date, dayChildren]) => (
                      <div key={date} className="space-y-3">
                        {/* Children Records for this day */}
                        {Array.from(dayChildren.values()).map((childRecord) => {
                          const child = children.find(c => c.id === childRecord.childId);
                          return (
                            <div 
                              key={`${date}-${childRecord.childId}`}
                              className={`bg-white rounded-xl p-3 sm:p-4 border-2 shadow-sm hover:shadow-md transition-all ${
                                childRecord.isIncomplete ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200'
                              }`}
                            >
                              {/* Date Badge - At Top of Card */}
                              <div className="flex items-center justify-between mb-2 sm:mb-3 pb-2 sm:pb-3 border-b border-gray-100">
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                                  <p className="text-[10px] sm:text-xs font-semibold text-gray-700">
                                    {new Date(date).toLocaleDateString('en-US', { 
                                      weekday: 'short', 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })}
                                  </p>
                                </div>
                                {childRecord.isIncomplete && (
                                  <Badge variant="warning" size="sm">
                                    Incomplete
                                  </Badge>
                                )}
                              </div>
                              
                              {/* Child Header */}
                              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-gray-200">
                                {child && (
                                  <img
                                    src={child.image}
                                    alt={child.name}
                                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-gray-200 shadow-sm flex-shrink-0"
                                    onError={(e) => {
                                      e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${child.name}`;
                                    }}
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-bold text-sm sm:text-base text-gray-900 truncate">{childRecord.childName}</h5>
                                  <p className="text-[10px] sm:text-xs text-gray-500">{child?.class} • {child?.age} years</p>
                                </div>
                              </div>

                              {/* Attendance Details */}
                              <div className="space-y-2 sm:space-y-3">
                                {/* Clock In */}
                                {childRecord.clockIn && (
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                                    <div className="flex items-center gap-2 sm:gap-3 flex-1">
                                      <div className="bg-emerald-100 w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs sm:text-sm font-semibold text-gray-900">Time In</p>
                                        <p className="text-[11px] sm:text-xs font-mono text-gray-600">
                                          {new Date(childRecord.clockIn.timestamp).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </p>
                                      </div>
                                      <Badge 
                                        variant={childRecord.clockIn.status === 'early' ? 'success' : childRecord.clockIn.status === 'late' ? 'error' : 'default'}
                                        size="sm"
                                      >
                                        {childRecord.clockIn.status === 'early' ? 'Early' : childRecord.clockIn.status === 'late' ? 'Late' : 'On Time'}
                                      </Badge>
                                    </div>
                                    {/* Parent/Assignee Who Clocked In - Mobile Optimized */}
                                    <div className="flex items-center gap-2 flex-shrink-0 bg-emerald-50 rounded-lg px-2 py-1.5 sm:bg-transparent sm:px-0 sm:py-0">
                                      <img 
                                        src={childRecord.clockIn.assigneeId ? childRecord.clockIn.assigneePhoto : childRecord.clockIn.parentPhoto}
                                        alt={childRecord.clockIn.assigneeId ? childRecord.clockIn.assigneeName : childRecord.clockIn.parentName}
                                        className="w-7 h-7 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-emerald-200 shadow-sm flex-shrink-0"
                                        onError={(e) => {
                                          e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${childRecord.clockIn?.assigneeId ? childRecord.clockIn?.assigneeName : childRecord.clockIn?.parentName}`;
                                        }}
                                      />
                                      <div className="text-left sm:text-right min-w-0 flex-1 sm:flex-initial">
                                        {childRecord.clockIn.assigneeId ? (
                                          <>
                                            <p className="text-xs font-semibold text-gray-800 truncate">
                                              {childRecord.clockIn.assigneeName}
                                            </p>
                                            <span className="text-[10px] text-blue-600 font-medium block">
                                              Assignee by {childRecord.clockIn.assignedByName}
                                            </span>
                                          </>
                                        ) : (
                                          <>
                                            <p className="text-xs font-semibold text-gray-800 truncate">
                                              {childRecord.clockIn.parentName}
                                            </p>
                                            {childRecord.clockIn.parentName === currentParent.name && (
                                              <span className="text-[10px] sm:text-xs text-emerald-600 font-medium">You</span>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Clock Out */}
                                {childRecord.clockOut ? (
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                                    <div className="flex items-center gap-2 sm:gap-3 flex-1">
                                      <div className="bg-red-100 w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <LogOutIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs sm:text-sm font-semibold text-gray-900">Time Out</p>
                                        <p className="text-[11px] sm:text-xs font-mono text-gray-600">
                                          {new Date(childRecord.clockOut.timestamp).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </p>
                                      </div>
                                      <Badge 
                                        variant={childRecord.clockOut.status === 'early' ? 'warning' : 'success'}
                                        size="sm"
                                      >
                                        {childRecord.clockOut.status === 'early' ? 'Early Timeout' : 'On Time'}
                                      </Badge>
                                    </div>
                                    {/* Parent Who Clocked Out - Mobile Optimized */}
                                    <div className="flex items-center gap-2 flex-shrink-0 bg-red-50 rounded-lg px-2 py-1.5 sm:bg-transparent sm:px-0 sm:py-0">
                                      <img 
                                        src={childRecord.clockOut.assigneeId ? childRecord.clockOut.assigneePhoto : childRecord.clockOut.parentPhoto}
                                        alt={childRecord.clockOut.assigneeId ? childRecord.clockOut.assigneeName : childRecord.clockOut.parentName}
                                        className="w-7 h-7 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-red-200 shadow-sm flex-shrink-0"
                                        onError={(e) => {
                                          e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${childRecord.clockOut?.assigneeId ? childRecord.clockOut?.assigneeName : childRecord.clockOut?.parentName}`;
                                        }}
                                      />
                                      <div className="text-left sm:text-right min-w-0 flex-1 sm:flex-initial">
                                        {childRecord.clockOut.assigneeId ? (
                                          <>
                                            <p className="text-xs font-semibold text-gray-800 truncate">
                                              {childRecord.clockOut.assigneeName}
                                            </p>
                                            <span className="text-[10px] text-blue-600 font-medium block">
                                              Assignee by {childRecord.clockOut.assignedByName}
                                            </span>
                                          </>
                                        ) : (
                                          <>
                                            <p className="text-xs font-semibold text-gray-800 truncate">
                                              {childRecord.clockOut.parentName}
                                            </p>
                                            {childRecord.clockOut.parentName === currentParent.name && (
                                              <span className="text-[10px] sm:text-xs text-emerald-600 font-medium">You</span>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ) : childRecord.isIncomplete && (
                                  <div className="flex items-center gap-2 sm:gap-3 bg-amber-50 border border-amber-200 rounded-lg p-2 sm:p-3">
                                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs sm:text-sm font-semibold text-amber-900">Not Clocked Out</p>
                                      <p className="text-[10px] sm:text-xs text-amber-700">No clock-out record for this day</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        );
        } catch (error) {
          console.error('Error rendering history modal:', error);
          return (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 p-6">
                <div className="text-center">
                  <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Error Loading History</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    There was an error loading the attendance history. Please try again.
                  </p>
                  <button
                    onClick={() => setShowHistoryModal(false)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          );
        }
      })()}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl max-w-md w-full shadow-2xl border border-slate-700">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-500/10 w-12 h-12 rounded-xl flex items-center justify-center">
                    <Lock className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Change Password</h3>
                </div>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-700 flex gap-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="flex-1 px-6 py-3 bg-slate-700 text-white rounded-xl font-semibold hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                className="flex-1 px-6 py-3 parent-gradient-primary text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-100 w-12 h-12 rounded-xl flex items-center justify-center">
                    <UserCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">My Profile</h3>
                </div>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            
            {/* Profile Content */}
            <div className="p-6">
              <div className="flex flex-col items-center mb-6">
                <img
                  src={currentParent.photo}
                  alt={currentParent.name}
                  className="w-24 h-24 rounded-full bg-gray-100 border-2 border-gray-200 shadow-lg mb-4"
                />
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{currentParent.name}</h2>
                <Badge variant={currentParent.type === 'father' ? 'blue' : 'pink'} size="md">
                  {currentParent.type === 'father' ? 'Father' : 'Mother'}
                </Badge>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-gray-200 w-10 h-10 rounded-lg flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 mb-1">Occupation</p>
                      <p className="text-gray-900 font-semibold">{currentParent.occupation}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-gray-200 w-10 h-10 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 mb-1">Residential Address</p>
                      <p className="text-gray-900 font-semibold">{currentParent.residentialAddress}</p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowProfileModal(false);
                  setShowPasswordModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-semibold hover:from-emerald-500 hover:to-green-500 transition-all shadow-lg"
              >
                <Lock className="w-5 h-5" />
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}