import React, { useState, useMemo } from 'react';
import { Filter, Users, Calendar, Clock, ClipboardList, UserCheck } from 'lucide-react';
import Badge from '@/components/Badge';
import ImageViewerModal from '@/components/ImageViewerModal';

interface DailyAttendanceLogProps {
  attendanceLogs: any[];
  parents: any[];
}

export default function DailyAttendanceLog({ attendanceLogs, parents }: DailyAttendanceLogProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'early' | 'late'>('all');
  const [tagFilter, setTagFilter] = useState<'all' | 'present' | 'incomplete' | 'absent'>('all');
  const [imageViewer, setImageViewer] = useState<{ isOpen: boolean; imageUrl: string; title: string; subtitle?: string }>({
    isOpen: false,
    imageUrl: '',
    title: '',
    subtitle: ''
  });

  // Filter today's logs
  const todayLogs = attendanceLogs.filter(log => {
    const logDate = new Date(log.timestamp);
    const today = new Date();
    return logDate.toDateString() === today.toDateString();
  });

  // Group logs by unique action (each log entry represents one action)
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

  // Calculate statistics and apply filters
  const filteredRecords = useMemo(() => {
    let records = [...groupedRecords];

    // Apply status filter (Early/Late) - only applies to clock-in actions
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

    // Apply tag filter - simplified for individual actions
    if (tagFilter !== 'all') {
      records = records.filter(record => {
        if (tagFilter === 'present') return record.actionType === 'clock-in'; // Show clock-in actions
        if (tagFilter === 'incomplete') return record.actionType === 'clock-in'; // Clock-in is considered incomplete until clock-out
        if (tagFilter === 'absent') return false; // Individual actions don't have "absent" state
        return true;
      });
    }

    return records;
  }, [groupedRecords, statusFilter, tagFilter]);

  // Calculate counts for filter chips
  const counts = useMemo(() => {
    // Count clock-in actions only for Early/Late
    const clockInActions = groupedRecords.filter(record => record.actionType === 'clock-in');
    
    const early = clockInActions.filter(record => {
      const clockInTime = new Date(record.clockIn!);
      return clockInTime.getHours() < 8 || (clockInTime.getHours() === 8 && clockInTime.getMinutes() === 0);
    }).length;

    const late = clockInActions.filter(record => {
      const clockInTime = new Date(record.clockIn!);
      return clockInTime.getHours() > 8 || (clockInTime.getHours() === 8 && clockInTime.getMinutes() > 0);
    }).length;

    // For action-based counts
    const clockInCount = groupedRecords.filter(record => record.actionType === 'clock-in').length;
    const clockOutCount = groupedRecords.filter(record => record.actionType === 'clock-out').length;

    return { 
      early, 
      late, 
      clockIn: clockInCount,
      clockOut: clockOutCount,
      // Keep these for compatibility with existing UI
      present: clockInCount,
      incomplete: clockInCount,
      absent: 0
    };
  }, [groupedRecords]);

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

        {/* Active Filters & Record Count */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between flex-wrap gap-2">
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
                  Clear all filters
                </button>
              )}
            </div>
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredRecords.length}</span> of <span className="font-semibold text-gray-900">{groupedRecords.length}</span> records
            </p>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
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
          {(statusFilter !== 'all' || tagFilter !== 'all') && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setTagFilter('all');
              }}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4">
            <h4 className="text-white font-bold text-lg">Attendance Records</h4>
            <p className="text-indigo-100 text-sm mt-1">{filteredRecords.length} {filteredRecords.length === 1 ? 'record' : 'records'} found</p>
          </div>

          {/* Table Body */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Parent</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Children</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Performed By</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Facial Capture</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecords.map((record, index) => {
                  const parent = parents.find(p => p.id === record.parentId);
                  const clockInTime = record.clockIn ? new Date(record.clockIn) : null;
                  const clockOutTime = record.clockOut ? new Date(record.clockOut) : null;
                  const isLate = clockInTime && (clockInTime.getHours() > 8 || (clockInTime.getHours() === 8 && clockInTime.getMinutes() > 0));
                  const actionTime = record.clockIn || record.clockOut;
                  const faceImage = record.clockInFaceImage || record.clockOutFaceImage;

                  return (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      {/* Parent Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative group">
                            <img
                              src={record.parentPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${parent?.name || record.parentName}`}
                              alt={parent?.name || record.parentName}
                              className="w-10 h-10 rounded-lg object-cover border-2 border-gray-200 cursor-pointer transform group-hover:scale-105 transition-transform"
                              onClick={() => setImageViewer({ 
                                isOpen: true, 
                                imageUrl: record.parentPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${parent?.name || record.parentName}`, 
                                title: parent?.name || record.parentName,
                                subtitle: 'Parent Photo'
                              })}
                              onError={(e) => {
                                e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${parent?.name || record.parentName}`;
                              }}
                            />
                            <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                              <span className="text-white text-[10px] font-medium">View</span>
                            </div>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{parent?.name || record.parentName}</p>
                          </div>
                        </div>
                      </td>

                      {/* Children */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {record.children.map((child: string, idx: number) => (
                            <span key={idx} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-md">
                              {child}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Action Type */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${record.actionType === 'clock-in' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                            <Clock className={`w-4 h-4 ${record.actionType === 'clock-in' ? 'text-blue-600' : 'text-purple-600'}`} />
                          </div>
                          <span className={`font-semibold text-sm ${record.actionType === 'clock-in' ? 'text-blue-700' : 'text-purple-700'}`}>
                            {record.actionType === 'clock-in' ? 'Clock In' : 'Clock Out'}
                          </span>
                        </div>
                      </td>

                      {/* Time */}
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="font-bold text-gray-900">
                            {new Date(actionTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(actionTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </td>

                      {/* Performed By */}
                      <td className="px-6 py-4">
                        {record.assigneeId ? (
                          <div className="flex items-center gap-3">
                            <div className="relative group">
                              <img
                                src={record.assigneePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${record.assigneeName}`}
                                alt={record.assigneeName}
                                className="w-10 h-10 rounded-lg object-cover border-2 border-orange-400 cursor-pointer transform group-hover:scale-105 transition-transform"
                                onClick={() => setImageViewer({ 
                                  isOpen: true, 
                                  imageUrl: record.assigneePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${record.assigneeName}`, 
                                  title: record.assigneeName,
                                  subtitle: `Assignee - ${record.actionType === 'clock-in' ? 'Clock In' : 'Clock Out'}`
                                })}
                                onError={(e) => {
                                  e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${record.assigneeName}`;
                                }}
                              />
                              <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                <span className="text-white text-[10px] font-medium">View</span>
                              </div>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{record.assigneeName}</p>
                              <p className="text-xs text-orange-600">Assignee</p>
                              <p className="text-xs text-gray-500">by {record.parentName}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="bg-green-100 p-1.5 rounded-lg">
                              <UserCheck className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{record.parentName}</p>
                              <p className="text-xs text-green-600">Parent</p>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {record.clockIn && (
                            <Badge variant={isLate ? 'error' : 'success'} size="sm">
                              {isLate ? 'Late' : 'Early'}
                            </Badge>
                          )}
                          <Badge variant={record.actionType === 'clock-in' ? 'warning' : 'success'} size="sm">
                            {record.actionType === 'clock-in' ? 'Incomplete' : 'Complete'}
                          </Badge>
                        </div>
                      </td>

                      {/* Facial Capture */}
                      <td className="px-6 py-4">
                        {faceImage ? (
                          <button
                            onClick={() => setImageViewer({ 
                              isOpen: true, 
                              imageUrl: faceImage, 
                              title: `${record.actionType === 'clock-in' ? 'Clock In' : 'Clock Out'} - Facial Capture`,
                              subtitle: `${record.assigneeId ? record.assigneeName : record.parentName} • ${new Date(actionTime).toLocaleString()}`
                            })}
                            className="px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                          >
                            <UserCheck className="w-3 h-3" />
                            View
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">Not available</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <span className="font-medium">
                Total Records: <span className="text-gray-900">{filteredRecords.length}</span>
              </span>
            </div>
          </div>
        </div>
      )}
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