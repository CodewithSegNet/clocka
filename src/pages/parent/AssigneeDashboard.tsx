import React, { useState, useEffect, useMemo } from 'react';
import { LogIn, LogOut as LogOutIcon, Clock, CheckCircle, AlertCircle, User, UserCheck, Camera, Timer, Phone, CreditCard, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FacialCaptureModal } from '@/app/components/FacialCaptureModal';
import Badge from '@/components/Badge';
import * as supabaseApi from '@/utils/supabaseApi';

interface ChildStatus {
  id: string;
  status: 'not-clocked-in' | 'clocked-in' | 'clocked-out';
  lastClockIn?: Date;
  lastClockOut?: Date;
  lastActionBy?: {
    name: string;
    photo: string;
  };
  hasClockInToday?: boolean;
  hasClockOutToday?: boolean;
}

export default function AssigneeDashboard() {
  const { assignee, logout } = useAuth();
  const { addAttendanceLog, getStudentsByIds, attendanceLogs, parents } = useData();
  const navigate = useNavigate();
  const [showClockInModal, setShowClockInModal] = useState(false);
  const [showClockOutModal, setShowClockOutModal] = useState(false);
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showFacialCaptureModal, setShowFacialCaptureModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'clock-in' | 'clock-out' | null>(null);
  const [faceImage, setFaceImage] = useState<string>('');
  const [parentPortalBackground, setParentPortalBackground] = useState<any>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [childrenStatuses, setChildrenStatuses] = useState<Map<string, ChildStatus>>(new Map());

  // Get children data from assignee's childrenIds
  const children = useMemo(() => {
    if (!assignee?.childrenIds || assignee.childrenIds.length === 0) {
      return [];
    }
    return getStudentsByIds(assignee.childrenIds);
  }, [assignee?.childrenIds, getStudentsByIds]);

  // Track children's clock in/out status - SAME LOGIC AS PARENT DASHBOARD
  useEffect(() => {
    if (!assignee || !attendanceLogs || children.length === 0) return;

    const today = new Date().toDateString();
    
    // Get today's logs for children that this assignee can manage
    const todayLogs = attendanceLogs.filter(log => {
      const hasSharedChild = log.childrenIds.some(childId => assignee.childrenIds.includes(childId));
      const isToday = new Date(log.timestamp).toDateString() === today;
      return hasSharedChild && isToday;
    });

    const statusMap = new Map<string, ChildStatus>();

    children.forEach(child => {
      // Get today's logs for this child
      const childLogsToday = todayLogs.filter(log => log.childrenIds.includes(child.id));
      
      let status: 'not-clocked-in' | 'clocked-in' | 'clocked-out' = 'not-clocked-in';
      let lastClockIn: Date | undefined;
      let lastClockOut: Date | undefined;
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
          lastClockIn = new Date(log.timestamp);
          lastLog = log;
        } else if (log.type === 'clock-out') {
          hasClockOutToday = true;
          status = 'clocked-out';
          lastClockOut = new Date(log.timestamp);
          lastLog = log;
        }
      });

      // Get info about who performed the last action
      if (lastLog) {
        if (lastLog.assigneeId) {
          // Last action was by an assignee
          lastActionBy = {
            name: lastLog.assigneeName || 'Assignee',
            photo: lastLog.faceImage || lastLog.assigneePhoto || ''
          };
        } else {
          // Last action was by a parent
          const parentWhoActed = parents.find(p => p.id === lastLog.parentId);
          if (parentWhoActed) {
            lastActionBy = {
              name: parentWhoActed.name,
              photo: lastLog.faceImage || parentWhoActed.photo
            };
          }
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
  }, [assignee, attendanceLogs, children, parents]);

  // Check for session expiry
  useEffect(() => {
    if (!assignee) return;

    const checkExpiry = () => {
      const now = new Date();
      const expiry = new Date(assignee.expiresAt);
      
      if (expiry < now) {
        console.log('⏰ [ASSIGNEE] Session expired at:', expiry);
        setIsExpired(true);
      }
    };

    // Check immediately
    checkExpiry();

    // Check every second
    const interval = setInterval(checkExpiry, 1000);

    return () => clearInterval(interval);
  }, [assignee]);

  // Load and periodically refresh school background
  useEffect(() => {
    async function loadSchoolBackground() {
      if (!assignee?.schoolCode) {
        console.log('⚠️ [ASSIGNEE BG] No school code found on assignee:', assignee);
        setParentPortalBackground({
          backgroundType: 'gradient',
          gradientFrom: '#10b981',
          gradientTo: '#14b8a6'
        });
        return;
      }
      
      try {
        console.log('🎨 [ASSIGNEE BG] Fetching background for school:', assignee.schoolCode);
        const school = await supabaseApi.getSchoolInfo(assignee.schoolCode);
        
        if (school?.parentPortalAppearance) {
          console.log('✅ [ASSIGNEE BG] Background loaded:', school.parentPortalAppearance);
          setParentPortalBackground(school.parentPortalAppearance);
        } else {
          console.log('⚠️ [ASSIGNEE BG] No background settings, using default');
          setParentPortalBackground({
            backgroundType: 'gradient',
            gradientFrom: '#10b981',
            gradientTo: '#14b8a6'
          });
        }
      } catch (error) {
        console.error('❌ [ASSIGNEE BG] Error loading background:', error);
        setParentPortalBackground({
          backgroundType: 'gradient',
          gradientFrom: '#10b981',
          gradientTo: '#14b8a6'
        });
      }
    }
    
    loadSchoolBackground();
    
    // Refresh background every 60 seconds (reduced from 30s to reduce server load)
    const refreshInterval = setInterval(loadSchoolBackground, 60000);
    
    return () => clearInterval(refreshInterval);
  }, [assignee?.schoolCode]);

  useEffect(() => {
    // Update current time every second
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleClockIn = () => {
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

    // Close selection modal and open facial capture
    setShowClockInModal(false);
    setPendingAction('clock-in');
    setShowFacialCaptureModal(true);
  };

  const handleClockOut = () => {
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

    // Close selection modal and open facial capture
    setShowClockOutModal(false);
    setPendingAction('clock-out');
    setShowFacialCaptureModal(true);
  };

  const handleFacialCaptureComplete = (faceImage: string) => {
    if (!pendingAction || selectedChildren.length === 0 || !assignee) return;

    try {
      const childrenData = children.filter(c => selectedChildren.includes(c.id));
      
      addAttendanceLog({
        parentId: assignee.parentId, // ✅ USE THE ACTUAL PARENT ID, NOT ASSIGNEE ID
        parentName: assignee.parentName, // ✅ USE THE ACTUAL PARENT NAME, NOT ASSIGNEE NAME
        parentPhoto: assignee.parentPhoto, // ✅ INCLUDE PARENT'S PHOTO FOR DISPLAY
        childrenIds: selectedChildren,
        childrenNames: childrenData.map(c => c.name),
        type: pendingAction,
        assigneeId: assignee.id,
        assigneeName: assignee.fullName,
        assigneePhoto: assignee.photo,
        assignedBy: assignee.parentId,
        assignedByName: assignee.parentName,
        assignedByPhoto: assignee.parentPhoto, // ✅ INCLUDE PARENT'S PHOTO
        faceImage: faceImage // Store facial capture
      });

      const actionText = pendingAction === 'clock-in' ? 'clocked in' : 'clocked out';
      toast.success(`Children ${actionText} successfully!`, {
        description: `${selectedChildren.length} ${selectedChildren.length === 1 ? 'child' : 'children'} ${actionText}`
      });

      setShowFacialCaptureModal(false);
      setPendingAction(null);
      setSelectedChildren([]);
    } catch (error) {
      console.error(`Clock ${pendingAction} error:`, error);
      toast.error(`Failed to ${pendingAction === 'clock-in' ? 'clock in' : 'clock out'} children`);
    }
  };

  const handleLogout = () => {
    logout();
    toast.info('Logged out successfully');
    navigate('/assignee/login');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Calculate time remaining for assignee access
  const timeRemaining = useMemo(() => {
    if (!assignee) return 'N/A';
    
    const now = new Date();
    const expiry = new Date(assignee.expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours}h ${minutes}m ${seconds}s`;
  }, [assignee, currentTime]);

  // Check if there are children available to clock in
  const canClockIn = useMemo(() => {
    return children.some(child => {
      const status = childrenStatuses.get(child.id);
      // Can ONLY clock in if they haven't clocked in today yet
      return !status?.hasClockInToday;
    });
  }, [children, childrenStatuses]);

  // Check if there are children available to clock out
  const canClockOut = useMemo(() => {
    return children.some(child => {
      const status = childrenStatuses.get(child.id);
      // Can ONLY clock out if currently clocked in AND haven't clocked out today yet
      return status && status.status === 'clocked-in' && !status.hasClockOutToday;
    });
  }, [children, childrenStatuses]);

  if (!assignee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-6 px-4 sm:px-6 shadow-xl">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={assignee.photo}
                alt={assignee.fullName}
                className="w-16 h-16 rounded-full border-4 border-white/30 shadow-lg"
                onError={(e) => {
                  e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${assignee.fullName}`;
                }}
              />
              <div>
                <h1 className="text-2xl font-bold">{assignee.fullName}</h1>
                <p className="text-blue-100 text-sm">Assigned by {assignee.parentName}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 justify-center"
            >
              <LogOutIcon className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Time Remaining Warning */}
        <div className="mb-6">
          {(() => {
            const diff = new Date(assignee.expiresAt).getTime() - new Date().getTime();
            const hoursLeft = diff / (1000 * 60 * 60);
            
            if (hoursLeft < 1) {
              return (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-red-900">Access Expiring Soon!</p>
                    <p className="text-sm text-red-700 mt-1">
                      Time remaining: <span className="font-mono font-bold">{timeRemaining}</span>
                    </p>
                  </div>
                </div>
              );
            } else {
              return (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
                  <Timer className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-blue-900">Active Access</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Time remaining: <span className="font-mono font-bold">{timeRemaining}</span>
                    </p>
                  </div>
                </div>
              );
            }
          })()}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Info & Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Current Time */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 w-10 h-10 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-xs font-mono text-indigo-600">{formatTime(currentTime)}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setSelectedChildren([]);
                    setShowClockInModal(true);
                  }}
                  disabled={!canClockIn}
                  className={`w-full px-4 py-3 rounded-xl font-semibold shadow-lg transition-all flex items-center justify-center gap-2 ${
                    canClockIn
                      ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white hover:shadow-xl'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <LogIn className="w-5 h-5" />
                  {canClockIn ? 'Clock In' : 'All Children Clocked In'}
                </button>
                <button
                  onClick={() => {
                    setSelectedChildren([]);
                    setShowClockOutModal(true);
                  }}
                  disabled={!canClockOut}
                  className={`w-full px-4 py-3 rounded-xl font-semibold shadow-lg transition-all flex items-center justify-center gap-2 ${
                    canClockOut
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white hover:shadow-xl'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <LogOutIcon className="w-5 h-5" />
                  {canClockOut ? 'Clock Out' : 'No Children to Clock Out'}
                </button>
              </div>
            </div>

            {/* Your Info */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Your Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{assignee.phoneNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  <span>{assignee.idType}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Shield className="w-4 h-4 text-gray-400" />
                  <span className="font-mono">{assignee.accessCode}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Children */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Authorized Children</h3>
              <p className="text-gray-600">You can clock {children.length} {children.length === 1 ? 'child' : 'children'} in/out</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {children.map((child) => {
                const status = childrenStatuses.get(child.id) || { id: child.id, status: 'not-clocked-in' };
                return (
                  <div
                    key={child.id}
                    className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={child.image}
                        alt={child.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-indigo-200"
                        onError={(e) => {
                          e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${child.name}`;
                        }}
                      />
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-gray-900">{child.name}</h4>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-gray-600">{child.class}</span>
                          <span className="text-sm text-gray-600">Age {child.age}</span>
                          <Badge variant="default" size="sm">{child.gender}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      {status.status === 'clocked-in' && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Clocked in at {status.lastClockIn ? formatTime(status.lastClockIn) : 'N/A'}</span>
                          {status.lastActionBy && (
                            <div className="flex items-center gap-2">
                              <UserCheck className="w-4 h-4 text-gray-400" />
                              <span>by {status.lastActionBy.name}</span>
                              <img
                                src={status.lastActionBy.photo}
                                alt={status.lastActionBy.name}
                                className="w-4 h-4 rounded-full"
                              />
                            </div>
                          )}
                        </div>
                      )}
                      {status.status === 'clocked-out' && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-red-600" />
                          <span>Clocked out at {status.lastClockOut ? formatTime(status.lastClockOut) : 'N/A'}</span>
                          {status.lastActionBy && (
                            <div className="flex items-center gap-2">
                              <UserCheck className="w-4 h-4 text-gray-400" />
                              <span>by {status.lastActionBy.name}</span>
                              <img
                                src={status.lastActionBy.photo}
                                alt={status.lastActionBy.name}
                                className="w-4 h-4 rounded-full"
                              />
                            </div>
                          )}
                        </div>
                      )}
                      {status.status === 'not-clocked-in' && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <AlertCircle className="w-4 h-4 text-gray-400" />
                          <span>Not clocked in today</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Clock In Modal */}
      {showClockInModal && (() => {
        // Only show children who haven't clocked in today yet
        const availableChildren = children.filter(child => {
          const status = childrenStatuses.get(child.id);
          return !status?.hasClockInToday;
        });

        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-green-50">
                <h3 className="text-xl font-bold text-gray-900">Clock In Children</h3>
                <p className="text-sm text-gray-600 mt-1">{availableChildren.length} {availableChildren.length === 1 ? 'child' : 'children'} available to clock in</p>
              </div>
              <div className="p-6">
                {availableChildren.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-6">All children have been clocked in</p>
                    <button
                      onClick={() => {
                        setShowClockInModal(false);
                        setSelectedChildren([]);
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-6">
                      {availableChildren.map((child) => (
                        <label
                          key={child.id}
                          className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg hover:border-emerald-300 cursor-pointer transition-colors"
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
                            className="w-5 h-5 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500"
                          />
                          <img
                            src={child.image}
                            alt={child.name}
                            className="w-10 h-10 rounded-full"
                            onError={(e) => {
                              e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${child.name}`;
                            }}
                          />
                          <div>
                            <p className="font-semibold text-gray-900">{child.name}</p>
                            <p className="text-xs text-gray-500">{child.class}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowClockInModal(false);
                          setSelectedChildren([]);
                        }}
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleClockIn}
                        disabled={selectedChildren.length === 0}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-semibold hover:from-emerald-500 hover:to-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Clock In ({selectedChildren.length})
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Clock Out Modal */}
      {showClockOutModal && (() => {
        // Only show children who are currently clocked in AND haven't clocked out today
        const availableChildren = children.filter(child => {
          const status = childrenStatuses.get(child.id);
          return status && status.status === 'clocked-in' && !status.hasClockOutToday;
        });

        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-rose-50">
                <h3 className="text-xl font-bold text-gray-900">Clock Out Children</h3>
                <p className="text-sm text-gray-600 mt-1">{availableChildren.length} {availableChildren.length === 1 ? 'child' : 'children'} available to clock out</p>
              </div>
              <div className="p-6">
                {availableChildren.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-6">No children are currently clocked in</p>
                    <button
                      onClick={() => {
                        setShowClockOutModal(false);
                        setSelectedChildren([]);
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-6">
                      {availableChildren.map((child) => (
                        <label
                          key={child.id}
                          className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg hover:border-red-300 cursor-pointer transition-colors"
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
                            className="w-5 h-5 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                          />
                          <img
                            src={child.image}
                            alt={child.name}
                            className="w-10 h-10 rounded-full"
                            onError={(e) => {
                              e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${child.name}`;
                            }}
                          />
                          <div>
                            <p className="font-semibold text-gray-900">{child.name}</p>
                            <p className="text-xs text-gray-500">{child.class}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowClockOutModal(false);
                          setSelectedChildren([]);
                        }}
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleClockOut}
                        disabled={selectedChildren.length === 0}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-semibold hover:from-red-500 hover:to-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Clock Out ({selectedChildren.length})
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Facial Capture Modal */}
      {showFacialCaptureModal && (
        <FacialCaptureModal
          isOpen={true}
          onClose={() => {
            setShowFacialCaptureModal(false);
            setPendingAction(null);
            setSelectedChildren([]);
          }}
          onCapture={handleFacialCaptureComplete}
          parentName={assignee.fullName}
          action={pendingAction || 'clock-in'}
          childrenCount={selectedChildren.length}
        />
      )}

      {/* Session Expired Modal */}
      {isExpired && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="bg-gradient-to-br from-red-600 to-rose-600 px-8 py-10 text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <AlertCircle className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Session Expired</h2>
              <p className="text-red-100 text-sm">Your temporary access has ended</p>
            </div>

            {/* Body */}
            <div className="p-8">
              <div className="space-y-4 mb-6">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Timer className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-900 text-sm">Access Time Expired</p>
                      <p className="text-red-700 text-sm mt-1">
                        Your {assignee.fullName}'s temporary access has expired.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-900 text-sm">Need More Time?</p>
                      <p className="text-blue-700 text-sm mt-1">
                        Please contact <span className="font-semibold">{assignee.parentName}</span> to request a new access code.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <p className="text-xs text-gray-500">
                    Expired at: <span className="font-mono font-semibold">{new Date(assignee.expiresAt).toLocaleString()}</span>
                  </p>
                </div>
              </div>

              {/* Actions */}
              <button
                onClick={() => {
                  logout();
                  navigate(`/school/${assignee.schoolCode}/assignee-login`);
                }}
                className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <LogOutIcon className="w-5 h-5" />
                Return to Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}