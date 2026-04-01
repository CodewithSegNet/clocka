import React, { useState, useMemo } from 'react';
import { X, Calendar, Clock, TrendingUp, CheckCircle, AlertCircle, XCircle, Filter } from 'lucide-react';
import Badge from '@/components/Badge';

interface StudentAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
  attendanceLogs: any[];
  parents: any[];
}

export default function StudentAttendanceModal({ isOpen, onClose, student, attendanceLogs, parents }: StudentAttendanceModalProps) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  if (!isOpen || !student) return null;

  // Filter logs for this student
  const studentLogs = attendanceLogs.filter(log => 
    log.childrenIds.includes(student.id)
  );

  // Filter by selected month and year
  const filteredLogs = studentLogs.filter(log => {
    const logDate = new Date(log.timestamp);
    return logDate.getMonth() === selectedMonth && logDate.getFullYear() === selectedYear;
  });

  // Calculate statistics
  const statistics = useMemo(() => {
    // Group logs by date
    const logsByDate = new Map();
    
    filteredLogs.forEach(log => {
      const dateKey = new Date(log.timestamp).toDateString();
      if (!logsByDate.has(dateKey)) {
        logsByDate.set(dateKey, { clockIn: null, clockOut: null });
      }
      
      const dayRecord = logsByDate.get(dateKey);
      if (log.type === 'clock-in') {
        dayRecord.clockIn = log.timestamp;
      } else {
        dayRecord.clockOut = log.timestamp;
      }
    });

    let completeDays = 0;
    let incompleteDays = 0;
    let lateArrivals = 0;

    logsByDate.forEach((record) => {
      if (record.clockIn && record.clockOut) {
        completeDays++;
      } else if (record.clockIn && !record.clockOut) {
        incompleteDays++;
      }

      if (record.clockIn) {
        const clockInTime = new Date(record.clockIn);
        if (clockInTime.getHours() > 8 || (clockInTime.getHours() === 8 && clockInTime.getMinutes() > 0)) {
          lateArrivals++;
        }
      }
    });

    return {
      totalRecords: filteredLogs.length,
      completeDays,
      incompleteDays,
      lateArrivals,
      totalDays: logsByDate.size
    };
  }, [filteredLogs]);

  // Group logs by date for display
  const groupedLogs = useMemo(() => {
    const grouped = new Map();
    
    filteredLogs.forEach(log => {
      const dateKey = new Date(log.timestamp).toDateString();
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, {
          date: dateKey,
          clockIn: null,
          clockOut: null,
          parentName: log.parentName,
          parentId: log.parentId
        });
      }
      
      const record = grouped.get(dateKey);
      if (log.type === 'clock-in') {
        record.clockIn = log.timestamp;
      } else {
        record.clockOut = log.timestamp;
      }
    });

    return Array.from(grouped.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [filteredLogs]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full pointer-events-auto animate-in max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-5 flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={student.image}
                  alt={student.name}
                  className="w-16 h-16 rounded-full object-cover border-4 border-white/30 shadow-lg"
                />
                <div>
                  <h2 className="text-2xl font-bold mb-1">Attendance Records</h2>
                  <p className="text-indigo-100 text-sm">
                    {student.name} • {student.class} • {student.age} years old
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex-shrink-0">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">Filter by:</span>
              </div>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white text-sm"
              >
                {months.map((month, index) => (
                  <option key={index} value={index}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white text-sm"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <div className="ml-auto text-sm text-gray-600">
                <span className="font-semibold">{months[selectedMonth]} {selectedYear}</span>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="bg-white px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Executive Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Complete Days */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <p className="text-xs font-semibold text-emerald-900">Complete Days</p>
                </div>
                <p className="text-2xl font-bold text-emerald-700">{statistics.completeDays}</p>
              </div>

              {/* Total Records */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <p className="text-xs font-semibold text-blue-900">Total Records</p>
                </div>
                <p className="text-2xl font-bold text-blue-700">{statistics.totalRecords}</p>
              </div>

              {/* Incomplete Days */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <p className="text-xs font-semibold text-yellow-900">Incomplete Days</p>
                </div>
                <p className="text-2xl font-bold text-yellow-700">{statistics.incompleteDays}</p>
              </div>

              {/* Late Arrivals */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <p className="text-xs font-semibold text-red-900">Late Arrivals</p>
                </div>
                <p className="text-2xl font-bold text-red-700">{statistics.lateArrivals}</p>
              </div>
            </div>
          </div>

          {/* Attendance Records */}
          <div className="flex-1 overflow-y-auto p-6">
            {groupedLogs.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">No attendance records found</p>
                <p className="text-sm text-gray-400">
                  No records for {months[selectedMonth]} {selectedYear}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {groupedLogs.map((record, index) => {
                  const parent = parents.find(p => p.id === record.parentId);
                  const isIncomplete = record.clockIn && !record.clockOut;
                  const clockInTime = record.clockIn ? new Date(record.clockIn) : null;
                  const isLate = clockInTime && (clockInTime.getHours() > 8 || (clockInTime.getHours() === 8 && clockInTime.getMinutes() > 0));

                  return (
                    <div 
                      key={index}
                      className={`border-2 rounded-xl p-4 transition-all hover:shadow-md ${
                        isIncomplete ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-indigo-600" />
                          <div>
                            <p className="font-semibold text-gray-900">
                              {new Date(record.date).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                            <p className="text-xs text-gray-600">Parent: {record.parentName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isLate && (
                            <Badge variant="error" size="sm">Late</Badge>
                          )}
                          {isIncomplete ? (
                            <Badge variant="warning" size="sm">Incomplete</Badge>
                          ) : (
                            <Badge variant="success" size="sm">Complete</Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Clock In */}
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                              <Clock className="w-4 h-4 text-white" />
                            </div>
                            <p className="text-xs font-semibold text-emerald-900">Clock In</p>
                          </div>
                          {record.clockIn ? (
                            <p className="text-lg font-bold text-emerald-700">
                              {new Date(record.clockIn).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-400">-</p>
                          )}
                        </div>

                        {/* Clock Out */}
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                              <Clock className="w-4 h-4 text-white" />
                            </div>
                            <p className="text-xs font-semibold text-red-900">Clock Out</p>
                          </div>
                          {record.clockOut ? (
                            <p className="text-lg font-bold text-red-700">
                              {new Date(record.clockOut).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-400">-</p>
                          )}
                        </div>
                      </div>

                      {/* Parent Info */}
                      {parent && (
                        <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2">
                          <img
                            src={parent.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${parent.name}`}
                            alt={parent.name}
                            className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                          />
                          <div className="text-xs text-gray-600">
                            <p>Recorded by: <span className="font-semibold text-gray-900">{parent.name}</span></p>
                            <p className="capitalize">{parent.type}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
            <p className="text-sm text-gray-600">
              Showing {groupedLogs.length} day(s) • {statistics.totalRecords} total records
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
