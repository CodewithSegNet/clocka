import { useState } from 'react';
import { X, CheckCircle, XCircle, Calendar, User, Phone, Mail, UserCheck, AlertCircle, Clock } from 'lucide-react';
import { useData, ChildAdditionRequest } from '@/contexts/DataContext';
import { toast } from 'sonner';
import { Search } from 'lucide-react';

interface ChildAdditionRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChildAdditionRequestsModal({ isOpen, onClose }: ChildAdditionRequestsModalProps) {
  const { childAdditionRequests, updateChildAdditionRequest, deleteChildAdditionRequest, updateParent, students, parents, refreshChildRequests } = useData();
  const [selectedRequest, setSelectedRequest] = useState<ChildAdditionRequest | null>(null);
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Filter function based on search query
  const filterRequests = (requests: ChildAdditionRequest[]) => {
    if (!searchQuery.trim()) return requests;
    
    const query = searchQuery.toLowerCase();
    return requests.filter(request => {
      const student = students.find(s => s.id === request.studentId);
      
      return (
        request.studentName.toLowerCase().includes(query) ||
        request.studentId.toLowerCase().includes(query) ||
        request.parentName.toLowerCase().includes(query) ||
        request.parentPhone.toLowerCase().includes(query) ||
        request.parentEmail.toLowerCase().includes(query) ||
        request.parentType.toLowerCase().includes(query) ||
        (student?.class || '').toLowerCase().includes(query) ||
        (request.notes || '').toLowerCase().includes(query)
      );
    });
  };

  const pendingRequests = filterRequests(childAdditionRequests.filter(r => r.status === 'pending'));
  const approvedRequests = filterRequests(childAdditionRequests.filter(r => r.status === 'approved'));
  const rejectedRequests = filterRequests(childAdditionRequests.filter(r => r.status === 'rejected'));
  
  const handleRefresh = async () => {
    try {
      await refreshChildRequests();
      toast.success('Requests refreshed from database!');
    } catch (error) {
      toast.error('Failed to refresh requests');
      console.error('Refresh error:', error);
    }
  };

  const handleApprove = (request: ChildAdditionRequest) => {
    // Get the parent's current children
    const parent = parents.find(p => p.id === request.parentId);
    
    if (!parent) {
      toast.error('Parent not found. Cannot approve request.');
      return;
    }
    
    // Check if child is already added
    if (parent.childrenIds.includes(request.studentId)) {
      toast.error('This child is already linked to this parent.');
      return;
    }
    
    console.log('🎉 Approving child addition:', {
      parent: parent.name,
      currentChildren: parent.childrenIds,
      addingChild: request.studentId
    });

    // Add child to parent's childrenIds (FIXED)
    const updatedChildrenIds = [...parent.childrenIds, request.studentId];
    
    updateParent(request.parentId, {
      childrenIds: updatedChildrenIds
    });
    
    console.log('✅ Updated children:', updatedChildrenIds);

    // Update request status
    updateChildAdditionRequest(request.id, {
      status: 'approved',
      reviewDate: new Date(),
      reviewedBy: 'School Admin',
      notes: notes || 'Approved after verification'
    });

    toast.success(`${request.studentName} has been added to ${request.parentName}'s account!`, {
      duration: 5000
    });
    
    setSelectedRequest(null);
    setNotes('');
    
    // Automatically switch to approved tab to show the approved request
    setActiveTab('approved');
  };

  const handleReject = (request: ChildAdditionRequest) => {
    if (!notes.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    // Update request status
    updateChildAdditionRequest(request.id, {
      status: 'rejected',
      reviewDate: new Date(),
      reviewedBy: 'School Admin',
      notes
    });

    toast.info(`Request rejected: ${request.parentName} will be notified`);
    setSelectedRequest(null);
    setNotes('');
  };

  const handleDelete = (requestId: string) => {
    deleteChildAdditionRequest(requestId);
  };

  const handleDeleteAll = () => {
    const requestsToDelete = activeTab === 'pending' 
      ? pendingRequests 
      : activeTab === 'approved' 
      ? approvedRequests 
      : rejectedRequests;

    if (requestsToDelete.length === 0) {
      toast.info(`No ${activeTab} requests to delete`);
      return;
    }

    const confirmMessage = `Are you sure you want to delete all ${requestsToDelete.length} ${activeTab} request${requestsToDelete.length !== 1 ? 's' : ''}? This action cannot be undone.`;
    
    if (window.confirm(confirmMessage)) {
      requestsToDelete.forEach(request => {
        deleteChildAdditionRequest(request.id);
      });
      
      toast.success(`All ${activeTab} requests have been deleted`, {
        duration: 3000
      });
    }
  };

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
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full pointer-events-auto animate-in max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-5 flex-shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Child Addition Requests</h2>
                <p className="text-blue-100">
                  {pendingRequests.length} pending • {approvedRequests.length} approved • {rejectedRequests.length} rejected
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 px-6 pt-4 flex-shrink-0 bg-gray-50">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-6 py-3 font-semibold transition-all border-b-2 ${
                  activeTab === 'pending'
                    ? 'border-orange-500 text-orange-600 bg-white'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Pending
                  {pendingRequests.length > 0 && (
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                      {pendingRequests.length}
                    </span>
                  )}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`px-6 py-3 font-semibold transition-all border-b-2 ${
                  activeTab === 'approved'
                    ? 'border-green-500 text-green-600 bg-white'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Approved
                  {approvedRequests.length > 0 && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                      {approvedRequests.length}
                    </span>
                  )}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('rejected')}
                className={`px-6 py-3 font-semibold transition-all border-b-2 ${
                  activeTab === 'rejected'
                    ? 'border-red-500 text-red-600 bg-white'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Rejected
                  {rejectedRequests.length > 0 && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                      {rejectedRequests.length}
                    </span>
                  )}
                </span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Search Bar - Appears in all tabs */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by student name, ID, parent name, phone, email, class..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-gray-700 placeholder-gray-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              {searchQuery && (
                <p className="text-sm text-gray-600 mt-2">
                  {activeTab === 'pending' && `Found ${pendingRequests.length} pending request${pendingRequests.length !== 1 ? 's' : ''}`}
                  {activeTab === 'approved' && `Found ${approvedRequests.length} approved request${approvedRequests.length !== 1 ? 's' : ''}`}
                  {activeTab === 'rejected' && `Found ${rejectedRequests.length} rejected request${rejectedRequests.length !== 1 ? 's' : ''}`}
                </p>
              )}
            </div>

            {/* Pending Tab */}
            {activeTab === 'pending' && (
              <div>
                {pendingRequests.length > 0 ? (
                <div className="space-y-4">
                  {pendingRequests.map(request => {
                    const student = students.find(s => s.id === request.studentId);
                    const parent = parents.find(p => p.id === request.parentId);
                    
                    return (
                      <div key={request.id} className="border-2 border-orange-200 bg-orange-50 rounded-xl p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-4">
                            {student && (
                              <img
                                src={student.image}
                                alt={student.name}
                                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow"
                              />
                            )}
                            <div>
                              <h4 className="font-bold text-gray-900 text-lg">{request.studentName}</h4>
                              <p className="text-sm text-gray-600">Student ID: {request.studentId}</p>
                              {student && (
                                <p className="text-sm text-gray-600">{student.class} • {student.age} years old</p>
                              )}
                            </div>
                          </div>
                          <div className="bg-orange-100 px-3 py-1 rounded-full">
                            <p className="text-xs font-semibold text-orange-700">PENDING</p>
                          </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 mb-4">
                          <p className="text-sm font-semibold text-gray-700 mb-3">Parent Information:</p>
                          
                          {/* Parent Photo - At the top */}
                          {parent && parent.photo && (
                            <div className="mb-4 pb-4 border-b border-gray-200">
                              <p className="text-xs text-gray-500 mb-2">Parent Photo:</p>
                              <div className="flex items-center gap-3">
                                <img
                                  src={parent.photo}
                                  alt={parent.name}
                                  className="w-20 h-20 rounded-full object-cover border-2 border-blue-500 shadow-md"
                                />
                                <div className="text-sm">
                                  <p className="font-semibold text-gray-900">{parent.name}</p>
                                  <p className="text-gray-600 capitalize">{parent.type}</p>
                                  <div className="mt-1 inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                                    <UserCheck className="w-3 h-3" />
                                    Verified Account
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-gray-500">Name</p>
                                <p className="font-semibold text-gray-900">{request.parentName}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-gray-500">Role</p>
                                <p className="font-semibold text-gray-900 capitalize">{request.parentType}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-gray-500">Phone</p>
                                <p className="font-semibold text-gray-900">{request.parentPhone}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-gray-500">Email</p>
                                <p className="font-semibold text-gray-900 text-xs break-all">{request.parentEmail}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-gray-500">Request Date</p>
                                <p className="font-semibold text-gray-900">
                                  {new Date(request.requestDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="text-xs text-blue-800">
                              <p className="font-semibold mb-1">⚠️ Verification Required</p>
                              <p>Please contact this parent at <strong>{request.parentPhone}</strong> or <strong>{request.parentEmail}</strong> to verify they initiated this request before approving.</p>
                            </div>
                          </div>
                        </div>

                        {selectedRequest?.id === request.id ? (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Notes (required for rejection, optional for approval)
                              </label>
                              <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                rows={3}
                                placeholder="Add notes about verification or reason for decision..."
                              />
                            </div>
                            <div className="flex gap-3">
                              <button
                                onClick={() => {
                                  setSelectedRequest(null);
                                  setNotes('');
                                }}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleReject(request)}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold inline-flex items-center justify-center gap-2"
                              >
                                <XCircle className="w-5 h-5" />
                                Reject
                              </button>
                              <button
                                onClick={() => handleApprove(request)}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold inline-flex items-center justify-center gap-2"
                              >
                                <CheckCircle className="w-5 h-5" />
                                Approve
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedRequest(request)}
                            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                          >
                            Review Request
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium">No pending requests</p>
                    <p className="text-sm text-gray-500 mt-1">
                      New requests from parents will appear here
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Approved Tab */}
            {activeTab === 'approved' && (
              <div>
                {approvedRequests.length > 0 ? (
                  <div className="space-y-4">
                    {approvedRequests.map(request => {
                      const student = students.find(s => s.id === request.studentId);
                      const parent = parents.find(p => p.id === request.parentId);
                      
                      return (
                        <div key={request.id} className="border-2 border-green-200 bg-green-50 rounded-xl p-5">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-4 flex-1">
                              {student && (
                                <img
                                  src={student.image}
                                  alt={student.name}
                                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow"
                                />
                              )}
                              <div className="flex-1">
                                <h4 className="font-bold text-gray-900 text-lg mb-1">{request.studentName}</h4>
                                <p className="text-sm text-gray-600 mb-1">Student ID: {request.studentId}</p>
                                {student && (
                                  <p className="text-sm text-gray-600">{student.class} • {student.age} years old</p>
                                )}
                                <div className="mt-3 pt-3 border-t border-green-200">
                                  <div className="flex items-center gap-3 mb-2">
                                    {parent && parent.photo && (
                                      <img
                                        src={parent.photo}
                                        alt={parent.name}
                                        className="w-12 h-12 rounded-full object-cover border-2 border-green-300 shadow-sm"
                                      />
                                    )}
                                    <div>
                                      <p className="text-sm text-gray-700">
                                        <strong>Parent:</strong> {request.parentName}
                                      </p>
                                      <p className="text-xs text-gray-600 capitalize">{request.parentType}</p>
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    <strong>Approved on:</strong> {new Date(request.reviewDate!).toLocaleDateString()} by {request.reviewedBy}
                                  </p>
                                  {request.notes && (
                                    <div className="mt-2 bg-white border border-green-200 rounded-lg p-3">
                                      <p className="text-xs text-gray-600">
                                        <span className="font-semibold">Note:</span> {request.notes}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <div className="bg-green-100 px-3 py-1 rounded-full">
                                <p className="text-xs font-semibold text-green-700">APPROVED</p>
                              </div>
                              <button
                                onClick={() => handleDelete(request.id)}
                                className="text-gray-400 hover:text-red-600 transition-colors p-2"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium">No approved requests</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Approved requests will appear here
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Rejected Tab */}
            {activeTab === 'rejected' && (
              <div>
                {rejectedRequests.length > 0 ? (
                  <div className="space-y-4">
                    {rejectedRequests.map(request => {
                      const student = students.find(s => s.id === request.studentId);
                      const parent = parents.find(p => p.id === request.parentId);
                      
                      return (
                        <div key={request.id} className="border-2 border-red-200 bg-red-50 rounded-xl p-5">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-4 flex-1">
                              {student && (
                                <img
                                  src={student.image}
                                  alt={student.name}
                                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow"
                                />
                              )}
                              <div className="flex-1">
                                <h4 className="font-bold text-gray-900 text-lg mb-1">{request.studentName}</h4>
                                <p className="text-sm text-gray-600 mb-1">Student ID: {request.studentId}</p>
                                {student && (
                                  <p className="text-sm text-gray-600">{student.class} • {student.age} years old</p>
                                )}
                                <div className="mt-3 pt-3 border-t border-red-200">
                                  <p className="text-sm text-gray-700 mb-1">
                                    <strong>Parent:</strong> {request.parentName} ({request.parentType})
                                  </p>
                                  <p className="text-sm text-gray-600 mb-2">
                                    <strong>Rejected on:</strong> {new Date(request.reviewDate!).toLocaleDateString()} by {request.reviewedBy}
                                  </p>
                                  {request.notes && (
                                    <div className="bg-white border-2 border-red-300 rounded-lg p-3">
                                      <p className="text-xs font-bold text-red-800 mb-1 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        Reason for Rejection:
                                      </p>
                                      <p className="text-sm text-gray-800">"{request.notes}"</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <div className="bg-red-100 px-3 py-1 rounded-full">
                                <p className="text-xs font-semibold text-red-700">REJECTED</p>
                              </div>
                              <button
                                onClick={() => handleDelete(request.id)}
                                className="text-gray-400 hover:text-red-600 transition-colors p-2"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <XCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium">No rejected requests</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Rejected requests will appear here
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
            <button
              onClick={handleDeleteAll}
              disabled={(activeTab === 'pending' ? pendingRequests.length : activeTab === 'approved' ? approvedRequests.length : rejectedRequests.length) === 0}
              className={`px-6 py-3 rounded-lg transition-colors font-semibold inline-flex items-center gap-2 ${
                (activeTab === 'pending' ? pendingRequests.length : activeTab === 'approved' ? approvedRequests.length : rejectedRequests.length) === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              <X className="w-5 h-5" />
              Delete All {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </button>
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