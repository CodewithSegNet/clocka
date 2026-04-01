import React, { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { toast } from 'sonner';
import type { Assignee, Student } from '@/contexts/DataContext';

interface EditAssigneeModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignee: Assignee;
  allChildren: Student[];
  onUpdate: (assigneeId: string, updates: Partial<Assignee>) => void;
}

export function EditAssigneeModal({ isOpen, onClose, assignee, allChildren, onUpdate }: EditAssigneeModalProps) {
  const [selectedChildrenIds, setSelectedChildrenIds] = useState<string[]>(assignee.childrenIds);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Filter children that belong to this assignee's family
  const familyChildren = allChildren.filter(child => 
    assignee.childrenIds.includes(child.id)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedChildrenIds.length === 0) {
      toast.error('Please select at least one child');
      return;
    }

    // Check if anything changed
    const childrenChanged = JSON.stringify(selectedChildrenIds.sort()) !== JSON.stringify(assignee.childrenIds.sort());
    
    if (!childrenChanged) {
      toast.info('No changes made');
      onClose();
      return;
    }

    setIsSubmitting(true);

    try {
      onUpdate(assignee.id, { childrenIds: selectedChildrenIds });
      toast.success('Assignee updated successfully!');
      onClose();
    } catch (error) {
      console.error('Error updating assignee:', error);
      toast.error('Failed to update assignee');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Modify Assignment</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 truncate">{assignee.fullName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-2"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className={`rounded-lg p-3 sm:p-4 border-2 transition-colors ${
            selectedChildrenIds.length === 0 
              ? 'bg-red-50 border-red-300' 
              : 'bg-emerald-50 border-emerald-300'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-900">
                Select Children * 
                {selectedChildrenIds.length > 0 && (
                  <span className="ml-2 text-emerald-600">
                    ({selectedChildrenIds.length} selected)
                  </span>
                )}
              </p>
              {familyChildren.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    if (selectedChildrenIds.length === familyChildren.length) {
                      setSelectedChildrenIds([]);
                    } else {
                      setSelectedChildrenIds(familyChildren.map(c => c.id));
                    }
                  }}
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 underline"
                >
                  {selectedChildrenIds.length === familyChildren.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>
            
            {selectedChildrenIds.length === 0 && (
              <p className="text-xs text-red-600 mb-3 font-medium">
                ⚠️ Please select at least one child
              </p>
            )}
            
            <div className="space-y-2">
              {familyChildren.map((child) => {
                const isSelected = selectedChildrenIds.includes(child.id);
                return (
                  <label
                    key={child.id}
                    className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg cursor-pointer transition-all border-2 ${
                      isSelected
                        ? 'bg-emerald-100 border-emerald-400 shadow-sm'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedChildrenIds([...selectedChildrenIds, child.id]);
                        } else {
                          setSelectedChildrenIds(selectedChildrenIds.filter(id => id !== child.id));
                        }
                      }}
                      className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 rounded border-gray-300 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <img
                        src={child.image}
                        alt={child.name}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${child.name}`;
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{child.name}</p>
                        <p className="text-[10px] sm:text-xs text-gray-600">{child.class} • {child.age} yrs</p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="bg-emerald-600 text-white rounded-full p-1 flex-shrink-0">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 text-sm sm:text-base"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || selectedChildrenIds.length === 0}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-sm sm:text-base"
            >
              <CheckCircle className="w-4 h-4 mr-1 sm:mr-2" />
              {isSubmitting ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
