import { useState } from 'react';
import { User, Users, Eye, Search, Filter, X, Calendar } from 'lucide-react';
import { Assignee, Student, Parent } from '@/contexts/DataContext';

interface AssigneeManagementTabProps {
  assignees: Assignee[];
  students: Student[];
  parents: Parent[];
}

interface ImageViewerState {
  isOpen: boolean;
  imageUrl: string;
  title: string;
  subtitle: string;
}

export default function AssigneeManagementTab({ assignees, students, parents }: AssigneeManagementTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [imageViewer, setImageViewer] = useState<ImageViewerState>({
    isOpen: false,
    imageUrl: '',
    title: '',
    subtitle: ''
  });

  // Filter and search assignees
  const filteredAssignees = assignees.filter(assignee => {
    // Status filter
    if (statusFilter === 'active' && new Date(assignee.expiresAt) <= new Date()) return false;
    if (statusFilter === 'expired' && new Date(assignee.expiresAt) > new Date()) return false;

    // Date range filter (based on creation date)
    if (fromDate || toDate) {
      const assigneeDate = new Date(assignee.createdAt);
      assigneeDate.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
      
      if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        if (assigneeDate < from) return false;
      }
      
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999); // End of day
        if (assigneeDate > to) return false;
      }
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const parent = parents.find(p => p.id === assignee.parentId);
      const children = students.filter(s => assignee.childrenIds.includes(s.id));
      
      return (
        assignee.fullName.toLowerCase().includes(query) ||
        assignee.phoneNumber.toLowerCase().includes(query) ||
        assignee.accessCode.toLowerCase().includes(query) ||
        assignee.idNumber.toLowerCase().includes(query) ||
        assignee.parentName.toLowerCase().includes(query) ||
        (assignee.parentEmail && assignee.parentEmail.toLowerCase().includes(query)) ||
        (assignee.parentPhone && assignee.parentPhone.toLowerCase().includes(query)) ||
        children.some(child => child.name.toLowerCase().includes(query)) ||
        (parent && parent.name.toLowerCase().includes(query))
      );
    }

    return true;
  });

  // Calculate counts for filter buttons
  const activeCount = assignees.filter(a => new Date(a.expiresAt) > new Date()).length;
  const expiredCount = assignees.filter(a => new Date(a.expiresAt) <= new Date()).length;

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Assignee Management</h3>
        <p className="text-gray-600">View and manage all assignees authorized by parents to pick up children</p>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by assignee name, phone, access code, ID number, parent name, or child name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-gray-700 placeholder-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <div className="flex gap-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All ({assignees.length})
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                    statusFilter === 'active'
                      ? 'bg-green-600 text-white'
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                >
                  Active ({activeCount})
                </button>
                <button
                  onClick={() => setStatusFilter('expired')}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                    statusFilter === 'expired'
                      ? 'bg-red-600 text-white'
                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                  }`}
                >
                  Expired ({expiredCount})
                </button>
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-500 flex-shrink-0" />
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">From:</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-gray-700 text-sm bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">To:</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-gray-700 text-sm bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results count and Clear All button */}
        {(searchQuery || statusFilter !== 'all' || fromDate || toDate) && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing <strong>{filteredAssignees.length}</strong> of <strong>{assignees.length}</strong> assignees
              {searchQuery && ` matching "${searchQuery}"`}
              {(fromDate || toDate) && (
                <span className="ml-1">
                  {fromDate && toDate && ` from ${new Date(fromDate).toLocaleDateString()} to ${new Date(toDate).toLocaleDateString()}`}
                  {fromDate && !toDate && ` from ${new Date(fromDate).toLocaleDateString()}`}
                  {!fromDate && toDate && ` up to ${new Date(toDate).toLocaleDateString()}`}
                </span>
              )}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setFromDate('');
                setToDate('');
              }}
              className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-sm font-medium"
            >
              <X className="w-4 h-4" />
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Assignees List */}
      {assignees.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Assignees Yet</h3>
          <p className="text-gray-600 mb-4">
            Parents can create assignees through their parent portal to authorize someone else to pick up their children.
          </p>
        </div>
      ) : filteredAssignees.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Found</h3>
          <p className="text-gray-600 mb-4">
            No assignees match your search criteria. Try adjusting your filters or search query.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssignees
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map(assignee => {
              const isExpired = new Date(assignee.expiresAt) <= new Date();
              const expiresAt = new Date(assignee.expiresAt);
              const children = students.filter(s => assignee.childrenIds.includes(s.id));
              const parent = parents.find(p => p.id === assignee.parentId);
              const timeRemaining = expiresAt.getTime() - Date.now();
              const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
              const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

              return (
                <div
                  key={assignee.id}
                  className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden transition-all hover:shadow-md ${
                    isExpired ? 'border-red-200 bg-red-50/30' : 'border-green-200 bg-green-50/30'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <img
                        src={assignee.photo}
                        alt={assignee.fullName}
                        className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setImageViewer({
                          isOpen: true,
                          imageUrl: assignee.photo,
                          title: assignee.fullName,
                          subtitle: 'Assignee Photo'
                        })}
                        onError={(e) => {
                          e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${assignee.fullName}`;
                        }}
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{assignee.fullName}</h3>
                            <p className="text-sm text-gray-600 mb-2">{assignee.phoneNumber}</p>
                          </div>
                          <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                            isExpired
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {isExpired ? '❌ EXPIRED' : `✓ ACTIVE`}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {!isExpired && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                              ⏱ {hoursRemaining}h {minutesRemaining}m remaining
                            </span>
                          )}
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                            {assignee.idType}
                          </span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                            ID: {assignee.idNumber}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Access Code */}
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-4 mb-4">
                      <p className="text-xs font-semibold text-indigo-900 mb-1">🔑 Access Code:</p>
                      <p className="font-mono font-bold text-2xl text-indigo-900">{assignee.accessCode}</p>
                    </div>

                    {/* Parent Contact Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <p className="text-xs font-semibold text-blue-900 mb-3 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Parent Who Authorized This Assignee:
                      </p>
                      
                      {/* Parent Photo and Name */}
                      <div className="flex items-center gap-3 mb-3">
                        <img 
                          src={parent?.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${assignee.parentName}`} 
                          alt={assignee.parentName} 
                          className="w-12 h-12 rounded-full border-2 border-blue-300 shadow-sm cursor-pointer hover:opacity-80 transition-opacity object-cover"
                          onClick={() => setImageViewer({
                            isOpen: true,
                            imageUrl: parent?.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${assignee.parentName}`,
                            title: assignee.parentName,
                            subtitle: 'Parent Photo'
                          })}
                        />
                        <div>
                          <p className="font-bold text-blue-900 text-sm">{assignee.parentName}</p>
                          {parent && (
                            <p className="text-xs text-blue-700">Parent ID: {parent.parentId}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Contact Details */}
                      <div className="space-y-1 text-sm text-blue-800">
                        {assignee.parentEmail && (
                          <p className="flex items-start gap-2">
                            <strong className="min-w-[60px]">Email:</strong> 
                            <span className="break-all">{assignee.parentEmail}</span>
                          </p>
                        )}
                        {assignee.parentPhone && (
                          <p className="flex items-start gap-2">
                            <strong className="min-w-[60px]">Phone:</strong> 
                            <span>{assignee.parentPhone}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Children */}
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        Authorized to pick up {children.length} {children.length === 1 ? 'child' : 'children'}:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {children.map(child => (
                          <div key={child.id} className="flex items-center gap-2 px-3 py-2 bg-purple-100 border border-purple-300 rounded-lg">
                            <img
                              src={child.image}
                              alt={child.name}
                              className="w-8 h-8 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setImageViewer({
                                isOpen: true,
                                imageUrl: child.image,
                                title: child.name,
                                subtitle: `Student - ${child.class}`
                              })}
                            />
                            <span className="text-xs font-medium text-purple-900">
                              {child.name} ({child.class})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Timestamps */}
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Created:</p>
                        <p className="font-medium">{new Date(assignee.createdAt).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Expires:</p>
                        <p className={`font-medium ${isExpired ? 'text-red-600' : 'text-green-600'}`}>
                          {expiresAt.toLocaleString()}
                          {isExpired && ' (EXPIRED)'}
                        </p>
                      </div>
                    </div>

                    {/* View ID Photo */}
                    {assignee.idPhoto && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => setImageViewer({
                            isOpen: true,
                            imageUrl: assignee.idPhoto!,
                            title: assignee.fullName,
                            subtitle: `Government ID - ${assignee.idType}`
                          })}
                          className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Government ID Photo
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Image Viewer Modal */}
      {imageViewer.isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/80 z-50 backdrop-blur-sm animate-in fade-in"
            onClick={() => setImageViewer({ isOpen: false, imageUrl: '', title: '', subtitle: '' })}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div 
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full pointer-events-auto animate-in zoom-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-t-2xl">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{imageViewer.title}</h3>
                    <p className="text-blue-100 text-sm mt-1">{imageViewer.subtitle}</p>
                  </div>
                  <button
                    onClick={() => setImageViewer({ isOpen: false, imageUrl: '', title: '', subtitle: '' })}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Image */}
              <div className="p-6 max-h-[70vh] overflow-auto">
                <img
                  src={imageViewer.imageUrl}
                  alt={imageViewer.title}
                  className="w-full h-auto rounded-lg"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}