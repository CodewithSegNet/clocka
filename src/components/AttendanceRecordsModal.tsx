import React, { useState, useMemo } from 'react';
import { X, Calendar, Clock, CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { Student, AttendanceLog } from '@/contexts/DataContext';

interface AttendanceRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  attendanceLogs: AttendanceLog[];
}

interface DayRecord {
  date: string;
  clockInTime?: Date;
  clockOutTime?: Date;
  status: 'complete' | 'incomplete' | 'late';
  parentName?: string;
}

export default function AttendanceRecordsModal({ 
  isOpen, 
  onClose, 
  student, 
  attendanceLogs 
}: AttendanceRecordsModalProps) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  // Generate month and year options
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

  // Filter logs for this student
  const studentLogs = useMemo(() => {
    return attendanceLogs.filter(log => 
      log.childrenIds.includes(student.id)
    );
  }, [attendanceLogs, student.id]);

  // Process attendance records by day
  const dailyRecords = useMemo(() => {
    const recordsMap = new Map<string, DayRecord>();

    // Filter logs for selected month and year
    const filteredLogs = studentLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate.getMonth() === selectedMonth && logDate.getFullYear() === selectedYear;
    });

    // Group by date
    filteredLogs.forEach(log => {
      const dateKey = new Date(log.timestamp).toDateString();
      
      if (!recordsMap.has(dateKey)) {
        recordsMap.set(dateKey, {
          date: dateKey,
          status: 'incomplete',
          parentName: log.parentName
        });
      }

      const record = recordsMap.get(dateKey)!;
      
      if (log.type === 'clock-in') {
        record.clockInTime = new Date(log.timestamp);
      } else if (log.type === 'clock-out') {
        record.clockOutTime = new Date(log.timestamp);
      }

      // Update status
      if (record.clockInTime && record.clockOutTime) {
        // Check if late (after 8:30 AM)
        const clockInHour = record.clockInTime.getHours();
        const clockInMinute = record.clockInTime.getMinutes();
        const isLate = clockInHour > 8 || (clockInHour === 8 && clockInMinute > 30);
        
        record.status = isLate ? 'late' : 'complete';
      } else {
        record.status = 'incomplete';
      }

      record.parentName = log.parentName;
    });

    return Array.from(recordsMap.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [studentLogs, selectedMonth, selectedYear]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const completeDays = dailyRecords.filter(r => r.status === 'complete').length;
    const incompleteDays = dailyRecords.filter(r => r.status === 'incomplete').length;
    const lateArrivals = dailyRecords.filter(r => r.status === 'late').length;
    const totalRecords = dailyRecords.length;

    return {
      completeDays,
      incompleteDays,
      lateArrivals,
      totalRecords
    };
  }, [dailyRecords]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-gray-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src={student.image}
                alt={student.name}
                className="w-16 h-16 rounded-full border-4 border-white shadow-lg object-cover"
              />
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{student.name}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-gray-600">{student.class}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-sm text-gray-600">{student.age} years</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-sm text-gray-600">{student.gender}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/60 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <h4 className="font-semibold text-gray-900">Filter Records</h4>
            </div>
            <div className="flex gap-3">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white text-sm font-medium"
              >
                {months.map((month, index) => (
                  <option key={month} value={index}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white text-sm font-medium"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="p-6 bg-gradient-to-br from-gray-50 to-white border-b border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h4 className="font-bold text-gray-900">Executive Summary</h4>
            <span className="text-sm text-gray-500">
              ({months[selectedMonth]} {selectedYear})
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Complete Days */}
            <div className="bg-white rounded-xl p-4 border border-green-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-3 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Complete Days</p>
                  <p className="text-2xl font-bold text-green-600">{summary.completeDays}</p>
                </div>
              </div>
            </div>

            {/* Total Records */}
            <div className="bg-white rounded-xl p-4 border border-indigo-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-3 rounded-lg">
                  <Calendar className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Records</p>
                  <p className="text-2xl font-bold text-indigo-600">{summary.totalRecords}</p>
                </div>
              </div>
            </div>

            {/* Incomplete Days */}
            <div className="bg-white rounded-xl p-4 border border-orange-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <XCircle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Incomplete Days</p>
                  <p className="text-2xl font-bold text-orange-600">{summary.incompleteDays}</p>
                </div>
              </div>
            </div>

            {/* Late Arrivals */}
            <div className="bg-white rounded-xl p-4 border border-red-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-3 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Late Arrivals</p>
                  <p className="text-2xl font-bold text-red-600">{summary.lateArrivals}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Records Table */}
        <div className="flex-1 overflow-y-auto p-6">
          {dailyRecords.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Records Found</h3>
              <p className="text-gray-600">
                No attendance records for {months[selectedMonth]} {selectedYear}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Clock In
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Clock Out
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Parent
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dailyRecords.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {formatDate(record.date)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {record.clockInTime ? (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-green-500" />
                            <span className="text-gray-900">{formatTime(record.clockInTime)}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Not recorded</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {record.clockOutTime ? (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-red-500" />
                            <span className="text-gray-900">{formatTime(record.clockOutTime)}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Not recorded</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-gray-700">{record.parentName || 'Unknown'}</span>
                      </td>
                      <td className="px-4 py-4">
                        {record.status === 'complete' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Complete
                          </span>
                        )}
                        {record.status === 'incomplete' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                            <XCircle className="w-3.5 h-3.5" />
                            Incomplete
                          </span>
                        )}
                        {record.status === 'late' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Late Arrival
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
