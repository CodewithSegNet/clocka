import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Eye, KeyRound, User, Users as UsersIcon, Calendar, Image as ImageIcon, Search, Filter, X } from 'lucide-react';
import { toast } from 'sonner';
import { useData } from '@/contexts/DataContext';

export default function PINResetRequestsTab() {
  const { parents, updateParent } = useData();
  const [requests, setRequests] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [imageViewer, setImageViewer] = useState<{ isOpen: boolean; imageUrl: string; title: string; subtitle: string }>({
    isOpen: false,
    imageUrl: '',
    title: '',
    subtitle: ''
  });

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = () => {
    const storedRequests = JSON.parse(localStorage.getItem('pinResetRequests') || '[]');
    setRequests(storedRequests);
    console.log('📋 Loaded PIN reset requests:', storedRequests.length);
  };

  const handleApprove = (request: any) => {
    // Update parent's PIN
    const parent = parents.find(p => p.id === request.parentId);
    
    if (!parent) {
      toast.error('Parent not found');
      return;
    }

    // Update parent's PIN and password
    const updatedParent = {
      ...parent,
      pin: request.newPin,
      password: request.newPin // For backwards compatibility
    };

    updateParent(updatedParent);

    // Update request status
    const updatedRequests = requests.map(req =>
      req.id === request.id
        ? { ...req, status: 'approved', approvedAt: new Date().toISOString() }
        : req
    );

    setRequests(updatedRequests);
    localStorage.setItem('pinResetRequests', JSON.stringify(updatedRequests));

    // Trigger storage event to update count in other components
    window.dispatchEvent(new Event('storage'));

    toast.success(`PIN reset approved for ${request.parentName}`);
    console.log('✅ PIN reset approved:', request.parentName, 'New PIN:', request.newPin);
  };

  const handleReject = (request: any) => {
    // Update request status
    const updatedRequests = requests.map(req =>
      req.id === request.id
        ? { ...req, status: 'rejected', rejectedAt: new Date().toISOString() }
        : req
    );

    setRequests(updatedRequests);
    localStorage.setItem('pinResetRequests', JSON.stringify(updatedRequests));

    // Trigger storage event to update count in other components
    window.dispatchEvent(new Event('storage'));

    toast.success(`PIN reset rejected for ${request.parentName}`);
    console.log('❌ PIN reset rejected:', request.parentName);
  };

  const filteredRequests = requests.filter(req => {
    // Status filter
    if (statusFilter !== 'all' && req.status !== statusFilter) return false;
    
    // Date range filter
    if (fromDate || toDate) {
      const requestDate = new Date(req.submittedAt);
      requestDate.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
      
      if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        if (requestDate < from) return false;
      }
      
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999); // End of day
        if (requestDate > to) return false;
      }
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        req.parentName.toLowerCase().includes(query) ||
        req.parentId.toLowerCase().includes(query) ||
        req.studentName.toLowerCase().includes(query) ||
        req.studentId.toLowerCase().includes(query) ||
        req.newPin.includes(query)
      );
    }
    
    return true;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">PIN Reset Requests</h2>
          <p className="text-gray-600 mt-1">Review and approve parent PIN reset requests</p>
        </div>
      </div>

      {/* Search and Date Filter */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by parent name, student name, ID, or PIN..."
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

        {/* Results count and Clear All button */}
        {(searchQuery || fromDate || toDate) && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing <strong>{filteredRequests.length}</strong> of <strong>{requests.length}</strong> requests
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

      {/* Status Filter Buttons */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                statusFilter === 'all'
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({requests.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-orange-600 text-white'
                  : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                statusFilter === 'approved'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              Approved ({approvedCount})
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                statusFilter === 'rejected'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              Rejected ({rejectedCount})
            </button>
          </div>
          
          {/* Clear All Filters Button */}
          {statusFilter !== 'all' && (
            <button
              onClick={() => setStatusFilter('all')}
              className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-sm font-medium"
            >
              <XCircle className="w-4 h-4" />
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <KeyRound className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Requests Found</h3>
          <p className="text-gray-600">
            {statusFilter === 'all'
              ? 'No PIN reset requests have been submitted yet.'
              : `No ${statusFilter} requests found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map(request => (
              <div
                key={request.id}
                className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden ${
                  request.status === 'pending'
                    ? 'border-orange-200'
                    : request.status === 'approved'
                    ? 'border-green-200'
                    : 'border-red-200'
                }`}
              >
                <div className="p-6">
                  {/* Header with Status Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={request.parentPhoto}
                        alt={request.parentName}
                        className="w-14 h-14 rounded-full border-2 border-gray-200 object-cover"
                      />
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{request.parentName}</h3>
                        <p className="text-sm text-gray-600">Parent ID: {request.parentId}</p>
                      </div>
                    </div>
                    <div>
                      {request.status === 'pending' && (
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Pending Review
                        </span>
                      )}
                      {request.status === 'approved' && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full inline-flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Approved
                        </span>
                      )}
                      {request.status === 'rejected' && (
                        <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full inline-flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          Rejected
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Student Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-xs font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <UsersIcon className="w-4 h-4" />
                        Student Information
                      </p>
                      <div className="space-y-1 text-sm">
                        <p className="text-blue-900">
                          <strong>Name:</strong> {request.studentName}
                        </p>
                        <p className="text-blue-900">
                          <strong>Student ID:</strong> {request.studentId}
                        </p>
                      </div>
                    </div>

                    {/* New PIN - Only show for pending requests */}
                    {request.status === 'pending' && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <p className="text-xs font-semibold text-purple-900 mb-2 flex items-center gap-2">
                          <KeyRound className="w-4 h-4" />
                          New PIN
                        </p>
                        <p className="font-mono font-bold text-2xl text-purple-900">{request.newPin}</p>
                      </div>
                    )}
                  </div>

                  {/* Verification Photo */}
                  <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Facial Verification Photo
                    </p>
                    <div className="relative inline-block">
                      <img
                        src={request.verificationPhoto}
                        alt="Verification"
                        className="w-32 h-32 rounded-lg object-cover border-2 border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() =>
                          setImageViewer({
                            isOpen: true,
                            imageUrl: request.verificationPhoto,
                            title: request.parentName,
                            subtitle: 'Verification Photo'
                          })
                        }
                      />
                      <button
                        onClick={() =>
                          setImageViewer({
                            isOpen: true,
                            imageUrl: request.verificationPhoto,
                            title: request.parentName,
                            subtitle: 'Verification Photo'
                          })
                        }
                        className="absolute top-1 right-1 p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                      >
                        <Eye className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="mt-4 text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Submitted: {new Date(request.submittedAt).toLocaleString()}
                  </div>

                  {/* Action Buttons */}
                  {request.status === 'pending' && (
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => handleApprove(request)}
                        className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Approve PIN Reset
                      </button>
                      <button
                        onClick={() => handleReject(request)}
                        className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-5 h-5" />
                        Reject Request
                      </button>
                    </div>
                  )}

                  {request.status === 'approved' && (
                    <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                      <p className="text-sm text-green-900">
                        ✅ <strong>Approved</strong> on {new Date(request.approvedAt).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {request.status === 'rejected' && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                      <p className="text-sm text-red-900">
                        ❌ <strong>Rejected</strong> on {new Date(request.rejectedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Image Viewer Modal */}
      {imageViewer.isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/80 z-50 backdrop-blur-sm"
            onClick={() => setImageViewer({ isOpen: false, imageUrl: '', title: '', subtitle: '' })}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full pointer-events-auto overflow-hidden">
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4">
                <h3 className="text-xl font-bold text-white">{imageViewer.title}</h3>
                <p className="text-gray-300 text-sm">{imageViewer.subtitle}</p>
              </div>
              <div className="p-6 flex justify-center bg-gray-100">
                <img
                  src={imageViewer.imageUrl}
                  alt={imageViewer.title}
                  className="max-w-full max-h-[70vh] rounded-lg shadow-lg object-contain"
                />
              </div>
              <div className="p-4 bg-gray-50 flex justify-end">
                <button
                  onClick={() => setImageViewer({ isOpen: false, imageUrl: '', title: '', subtitle: '' })}
                  className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}