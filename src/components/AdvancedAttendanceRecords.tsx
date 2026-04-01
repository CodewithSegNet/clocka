import React, { useState, useMemo } from 'react';
import { Filter, Search, Calendar, Clock, X, Download, ChevronDown, Users, UserCheck, FileText } from 'lucide-react';
import Badge from '@/components/Badge';
import ImageViewerModal from '@/components/ImageViewerModal';

interface AdvancedAttendanceRecordsProps {
  attendanceLogs: any[];
  parents: any[];
  students: any[];
}

export default function AdvancedAttendanceRecords({ attendanceLogs, parents, students }: AdvancedAttendanceRecordsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [attendanceType, setAttendanceType] = useState<'all' | 'clock-in' | 'clock-out'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'early' | 'late' | 'on-time'>('all');
  const [performedBy, setPerformedBy] = useState<'all' | 'parent' | 'assignee'>('all');
  const [completionFilter, setCompletionFilter] = useState<'all' | 'complete' | 'incomplete'>('all');
  const [showFilters, setShowFilters] = useState(true);
  const [imageViewer, setImageViewer] = useState<{ isOpen: boolean; imageUrl: string; title: string; subtitle?: string }>({
    isOpen: false,
    imageUrl: '',
    title: '',
    subtitle: ''
  });

  // Get unique classes from students
  const classes = useMemo(() => {
    const uniqueClasses = new Set(students.map(s => s.class));
    return Array.from(uniqueClasses).sort();
  }, [students]);

  // Group logs by unique action (each log entry represents one action) - SAME AS DailyAttendanceLog
  const groupedRecords = useMemo(() => {
    const groupedLogs = new Map();
    attendanceLogs.forEach(log => {
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
  }, [attendanceLogs, parents]);

  // Apply all filters
  const filteredRecords = useMemo(() => {
    let records = [...groupedRecords];

    // Date range filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      records = records.filter(record => new Date(record.date) >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      records = records.filter(record => new Date(record.date) <= toDate);
    }

    // Search filter (parent name or child name)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      records = records.filter(record => 
        record.parentName.toLowerCase().includes(query) ||
        record.children.some((name: string) => name.toLowerCase().includes(query))
      );
    }

    // Class filter
    if (selectedClass !== 'all') {
      records = records.filter(record => {
        // Check if any of the children in this record are in the selected class
        const childrenInClass = record.childrenIds?.some((childId: string) => {
          const student = students.find(s => s.id === childId);
          return student?.class === selectedClass;
        });
        return childrenInClass;
      });
    }

    // Attendance type filter
    if (attendanceType !== 'all') {
      records = records.filter(record => {
        if (attendanceType === 'clock-in') return record.clockIn !== null;
        if (attendanceType === 'clock-out') return record.clockOut !== null;
        return true;
      });
    }

    // Status filter (early/late/on-time)
    if (statusFilter !== 'all') {
      records = records.filter(record => {
        if (!record.clockIn) return false;
        const clockInTime = new Date(record.clockIn);
        const hours = clockInTime.getHours();
        const minutes = clockInTime.getMinutes();
        
        const isEarly = hours < 8;
        const isLate = hours > 8 || (hours === 8 && minutes > 0);
        const isOnTime = hours === 8 && minutes === 0;
        
        if (statusFilter === 'early') return isEarly;
        if (statusFilter === 'late') return isLate;
        if (statusFilter === 'on-time') return isOnTime;
        return true;
      });
    }

    // Performed by filter
    if (performedBy !== 'all') {
      records = records.filter(record => {
        if (performedBy === 'parent') {
          return !record.assigneeId;
        }
        if (performedBy === 'assignee') {
          return record.assigneeId;
        }
        return true;
      });
    }

    // Completion filter
    if (completionFilter !== 'all') {
      records = records.filter(record => {
        const isComplete = record.clockIn && record.clockOut;
        if (completionFilter === 'complete') return isComplete;
        if (completionFilter === 'incomplete') return !isComplete;
        return true;
      });
    }

    // Sort by date descending (newest first)
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [groupedRecords, searchQuery, dateFrom, dateTo, selectedClass, attendanceType, statusFilter, performedBy, completionFilter, students]);

  // Calculate statistics
  const stats = useMemo(() => {
    return {
      total: groupedRecords.length,
      filtered: filteredRecords.length,
      complete: filteredRecords.filter(r => r.clockIn && r.clockOut).length,
      incomplete: filteredRecords.filter(r => r.clockIn && !r.clockOut).length,
      byAssignee: filteredRecords.filter(r => r.assigneeId).length,
      byParent: filteredRecords.filter(r => !r.assigneeId).length
    };
  }, [groupedRecords, filteredRecords]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
    setSelectedClass('all');
    setAttendanceType('all');
    setStatusFilter('all');
    setPerformedBy('all');
    setCompletionFilter('all');
  };

  const hasActiveFilters = searchQuery || dateFrom || dateTo || selectedClass !== 'all' || 
    attendanceType !== 'all' || statusFilter !== 'all' || performedBy !== 'all' || completionFilter !== 'all';

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Parent Name', 'Children', 'Clock In Time', 'Clock Out Time', 'Status', 'Performed By', 'Duration'];
    const rows = filteredRecords.map(record => {
      const clockInTime = record.clockIn ? new Date(record.clockIn).toLocaleString() : 'N/A';
      const clockOutTime = record.clockOut ? new Date(record.clockOut).toLocaleString() : 'N/A';
      const status = !record.clockIn ? 'Absent' : record.clockIn && !record.clockOut ? 'Incomplete' : 'Complete';
      const performedBy = record.assigneeId ? `Assignee: ${record.assigneeName}` : 'Parent';
      
      let duration = 'N/A';
      if (record.clockIn && record.clockOut) {
        const hours = Math.round((new Date(record.clockOut).getTime() - new Date(record.clockIn).getTime()) / (1000 * 60 * 60));
        const minutes = Math.round(((new Date(record.clockOut).getTime() - new Date(record.clockIn).getTime()) % (1000 * 60 * 60)) / (1000 * 60));
        duration = `${hours}h ${minutes}m`;
      }
      
      return [
        new Date(record.date).toLocaleDateString(),
        record.parentName,
        record.children.join('; '),
        clockInTime,
        clockOutTime,
        status,
        performedBy,
        duration
      ];
    });
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-records-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">Advanced Attendance Records</h3>
            <p className="text-sm text-gray-600">
              Search and filter all attendance records with advanced options
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors font-medium text-sm"
          >
            <Filter className="w-4 h-4" />
            {showFilters ? 'Hide' : 'Show'} Filters
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Statistics Row */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Total Records</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
            <p className="text-xs text-indigo-600 mb-1">Filtered</p>
            <p className="text-2xl font-bold text-indigo-700">{stats.filtered}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <p className="text-xs text-green-600 mb-1">Complete</p>
            <p className="text-2xl font-bold text-green-700">{stats.complete}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
            <p className="text-xs text-yellow-600 mb-1">Incomplete</p>
            <p className="text-2xl font-bold text-yellow-700">{stats.incomplete}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <p className="text-xs text-blue-600 mb-1">By Parent</p>
            <p className="text-2xl font-bold text-blue-700">{stats.byParent}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
            <p className="text-xs text-purple-600 mb-1">By Assignee</p>
            <p className="text-2xl font-bold text-purple-700">{stats.byAssignee}</p>
          </div>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            {/* Row 1: Search and Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search parent or child name..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Row 2: Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Class</label>
                <div className="relative">
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm appearance-none bg-white"
                  >
                    <option value="all">All Classes</option>
                    {classes.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                <div className="relative">
                  <select
                    value={attendanceType}
                    onChange={(e) => setAttendanceType(e.target.value as any)}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm appearance-none bg-white"
                  >
                    <option value="all">All Types</option>
                    <option value="clock-in">Clock In Only</option>
                    <option value="clock-out">Clock Out Only</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm appearance-none bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="early">Early</option>
                    <option value="on-time">On Time</option>
                    <option value="late">Late</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Performed By</label>
                <div className="relative">
                  <select
                    value={performedBy}
                    onChange={(e) => setPerformedBy(e.target.value as any)}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm appearance-none bg-white"
                  >
                    <option value="all">All</option>
                    <option value="parent">Parent Only</option>
                    <option value="assignee">Assignee Only</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Completion</label>
                <div className="relative">
                  <select
                    value={completionFilter}
                    onChange={(e) => setCompletionFilter(e.target.value as any)}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm appearance-none bg-white"
                  >
                    <option value="all">All</option>
                    <option value="complete">Complete</option>
                    <option value="incomplete">Incomplete</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Active Filters & Actions */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-700">Active Filters:</span>
                  {searchQuery && (
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-md">
                      Search: {searchQuery}
                    </span>
                  )}
                  {dateFrom && (
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-md">
                      From: {new Date(dateFrom).toLocaleDateString()}
                    </span>
                  )}
                  {dateTo && (
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-md">
                      To: {new Date(dateTo).toLocaleDateString()}
                    </span>
                  )}
                  {selectedClass !== 'all' && (
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-md">
                      Class: {selectedClass}
                    </span>
                  )}
                  {attendanceType !== 'all' && (
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-md">
                      Type: {attendanceType}
                    </span>
                  )}
                  {statusFilter !== 'all' && (
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-md">
                      Status: {statusFilter}
                    </span>
                  )}
                  {performedBy !== 'all' && (
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-md">
                      By: {performedBy}
                    </span>
                  )}
                  {completionFilter !== 'all' && (
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-md">
                      {completionFilter}
                    </span>
                  )}
                </div>
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                >
                  <X className="w-4 h-4" />
                  Clear All
                </button>
              </div>
            )}
          </div>
        )}

        {/* Export Button */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{stats.filtered}</span> of <span className="font-semibold text-gray-900">{stats.total}</span> records
          </p>
          <button
            onClick={exportToCSV}
            disabled={filteredRecords.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export to CSV
          </button>
        </div>
      </div>

      {/* Records Display */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-gray-200 shadow-sm">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">
            {groupedRecords.length === 0 ? 'No attendance records found' : 'No records match your filters'}
          </p>
          <p className="text-sm text-gray-400 mb-6">
            {groupedRecords.length === 0 
              ? 'Attendance records will appear here when parents clock in/out'
              : 'Try adjusting your filters to see more results'
            }
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Clear All Filters
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
                            {new Date(actionTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
                <span>Advanced Search Results</span>
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