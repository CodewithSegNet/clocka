import React from 'react';
import { Calendar, Clock, UserCheck, ClipboardList } from 'lucide-react';
import Badge from '@/components/Badge';

interface SecurityAttendanceTableProps {
  filteredRecords: any[];
  groupedRecords: any[];
  parents: any[];
  setImageViewer: (viewer: { isOpen: boolean; imageUrl: string; title: string; subtitle?: string }) => void;
  statusFilter: string;
  tagFilter: string;
  searchQuery: string;
  setStatusFilter: (filter: any) => void;
  setTagFilter: (filter: any) => void;
  setSearchQuery: (query: string) => void;
}

export default function SecurityAttendanceTable({
  filteredRecords,
  groupedRecords,
  parents,
  setImageViewer,
  statusFilter,
  tagFilter,
  searchQuery,
  setStatusFilter,
  setTagFilter,
  setSearchQuery
}: SecurityAttendanceTableProps) {
  if (filteredRecords.length === 0) {
    return (
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
    );
  }

  return (
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
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <UserCheck className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{record.parentName}</p>
                          <p className="text-xs text-emerald-600">Parent</p>
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

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <p className="text-sm text-gray-600">
            Total Records: <span className="font-semibold text-gray-900">{filteredRecords.length}</span>
          </p>
        </div>
      </div>
    </div>
  );
}