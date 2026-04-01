import React, { useState } from 'react';
import { X, Search, UserPlus, AlertCircle, Send, CheckCircle } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { toast } from 'sonner';

interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentParent: any;
}

export default function AddChildModal({ isOpen, onClose, currentParent }: AddChildModalProps) {
  const { students, parents, addChildAdditionRequest, childAdditionRequests } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  if (!isOpen) return null;

  // Filter students that are not already assigned to ANY parent
  const getUnassignedStudents = () => {
    // Get all students with their parent assignments
    const studentParentMap = new Map<string, Array<{type: 'father' | 'mother', parentId: string}>>();
    
    parents.forEach(parent => {
      parent.childrenIds.forEach(childId => {
        if (!studentParentMap.has(childId)) {
          studentParentMap.set(childId, []);
        }
        studentParentMap.get(childId)!.push({
          type: parent.type,
          parentId: parent.id
        });
      });
    });

    // Get all student IDs with pending requests from this parent
    const pendingRequestStudentIds = new Set<string>();
    childAdditionRequests
      .filter(req => req.parentId === currentParent.id && req.status === 'pending')
      .forEach(req => {
        pendingRequestStudentIds.add(req.studentId);
      });

    // ✅ CRITICAL VALIDATION: Filter out students who already have BOTH mother AND father
    return students.filter(student => {
      // Skip if already in current parent's list
      if (currentParent.childrenIds.includes(student.id)) {
        return false;
      }
      
      // Skip if pending request exists
      if (pendingRequestStudentIds.has(student.id)) {
        return false;
      }
      
      // Check if this student already has both mother and father
      const studentParents = studentParentMap.get(student.id) || [];
      const hasMother = studentParents.some(p => p.type === 'mother');
      const hasFather = studentParents.some(p => p.type === 'father');
      
      // ✅ BLOCK if BOTH mother and father are already assigned
      if (hasMother && hasFather) {
        return false;
      }
      
      // ✅ Allow if neither parent is assigned OR only one parent is assigned
      return true;
    });
  };

  const unassignedStudents = getUnassignedStudents();

  // Filter by search query
  const filteredStudents = unassignedStudents.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.class.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmitRequest = () => {
    if (!selectedStudent) {
      toast.error('Please select a student first');
      return;
    }

    // Create child addition request
    addChildAdditionRequest({
      parentId: currentParent.id,
      parentName: currentParent.name,
      parentPhone: currentParent.phoneNumber || 'Not provided',
      parentEmail: currentParent.email || 'Not provided',
      parentType: currentParent.type,
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      status: 'pending'
    });

    toast.success(
      `Request submitted and is now pending approval. The school will review and contact you for verification.`,
      { duration: 4000 }
    );

    onClose();
    setSearchQuery('');
    setSelectedStudent(null);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
        <div 
          className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg pointer-events-auto animate-in max-h-[92vh] sm:max-h-[85vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Minimal & Classy */}
          <div className="bg-gradient-to-br from-green-600 to-emerald-600 px-4 sm:px-6 py-4 sm:py-5 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                  <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">Add Child</h2>
                  <p className="text-xs sm:text-sm text-green-100">Request school approval</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4">
            {/* Info Banner - Minimal */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-3.5">
              <div className="flex gap-2.5">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-blue-900 leading-relaxed">
                    Select your child below. The school will verify and contact you at <span className="font-semibold">{currentParent.phoneNumber || currentParent.email || 'your contact'}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Search */}
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm sm:text-base"
                  placeholder="Search by name, ID, or class..."
                />
              </div>
            </div>

            {/* Students List - Compact & Mobile Optimized */}
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-2.5 px-0.5">
                Available Students ({filteredStudents.length})
              </p>
              
              {filteredStudents.length === 0 ? (
                <div className="text-center py-10 sm:py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                  {unassignedStudents.length === 0 ? (
                    <>
                      <UserPlus className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2.5" />
                      <p className="text-sm sm:text-base text-gray-600 font-medium">No students available</p>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1 px-4">
                        All students are already assigned
                      </p>
                    </>
                  ) : (
                    <>
                      <Search className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2.5" />
                      <p className="text-sm sm:text-base text-gray-600 font-medium">No matches found</p>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1 px-4">
                        Try a different search term
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-[280px] sm:max-h-80 overflow-y-auto overscroll-contain pr-1">
                  {filteredStudents.map(student => (
                    <button
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      className={`w-full p-3 sm:p-3.5 border-2 rounded-xl transition-all text-left group ${
                        selectedStudent?.id === student.id
                          ? 'border-green-500 bg-green-50/80 shadow-sm'
                          : 'border-gray-200 hover:border-green-300 hover:bg-green-50/40 active:bg-green-50/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={student.image}
                          alt={student.name}
                          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{student.name}</h3>
                          <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 text-xs sm:text-sm text-gray-600 overflow-hidden">
                            <span className="truncate">{student.class}</span>
                            <span>•</span>
                            <span className="flex-shrink-0">{student.age}yo</span>
                            <span>•</span>
                            <span className="flex-shrink-0">{student.gender}</span>
                          </div>
                        </div>
                        {selectedStudent?.id === student.id && (
                          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Student Summary - Minimal */}
            {selectedStudent && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 sm:p-3.5">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedStudent.image}
                    alt={selectedStudent.name}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-green-700 font-medium">Selected:</p>
                    <p className="font-semibold text-green-900 text-sm sm:text-base truncate">{selectedStudent.name}</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                </div>
              </div>
            )}
          </div>

          {/* Footer - Mobile Optimized Buttons */}
          <div className="bg-white px-4 sm:px-5 py-3 sm:py-4 border-t border-gray-100 flex flex-col sm:flex-row gap-2 sm:gap-3 flex-shrink-0 safe-bottom">
            <button
              onClick={onClose}
              className="w-full sm:flex-1 px-4 py-2.5 sm:py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors font-semibold text-sm sm:text-base order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitRequest}
              disabled={!selectedStudent}
              className="w-full sm:flex-1 px-4 py-2.5 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 active:scale-[0.98] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 inline-flex items-center justify-center gap-2 text-sm sm:text-base shadow-lg shadow-green-600/20 disabled:shadow-none order-1 sm:order-2"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              Submit Request
            </button>
          </div>
        </div>
      </div>
    </>
  );
}