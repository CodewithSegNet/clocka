import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle, RefreshCw, Database } from 'lucide-react';
import { Parent, Student } from '@/contexts/DataContext';
import { toast } from 'sonner';

interface DatabaseCleanupModalProps {
  isOpen: boolean;
  onClose: () => void;
  parents: Parent[];
  students: Student[];
  onCleanup: (cleanedParents: Parent[]) => void;
}

interface ConflictReport {
  childId: string;
  childName: string;
  families: {
    familyKey: string;
    parents: Parent[];
    parentNames: string[];
  }[];
}

export default function DatabaseCleanupModal({
  isOpen,
  onClose,
  parents,
  students,
  onCleanup
}: DatabaseCleanupModalProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictReport[]>([]);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  if (!isOpen) return null;

  // Analyze the database for conflicts
  const analyzeDatabase = () => {
    setIsAnalyzing(true);
    
    setTimeout(() => {
      // Group parents by their children to identify families
      const childToFamiliesMap = new Map<string, Parent[][]>();
      
      // First, group parents into families based on shared children
      const familyGroups: { [key: string]: Parent[] } = {};
      parents.forEach(parent => {
        const childrenKey = [...parent.childrenIds].sort().join(',');
        if (!familyGroups[childrenKey]) {
          familyGroups[childrenKey] = [];
        }
        familyGroups[childrenKey].push(parent);
      });

      // Now check each child to see if they appear in multiple families
      const conflictMap = new Map<string, ConflictReport>();
      
      students.forEach(student => {
        const familiesWithThisChild: {
          familyKey: string;
          parents: Parent[];
          parentNames: string[];
        }[] = [];

        Object.entries(familyGroups).forEach(([familyKey, familyParents]) => {
          // Check if any parent in this family has this child
          const hasChild = familyParents.some(parent => 
            parent.childrenIds.includes(student.id)
          );

          if (hasChild) {
            familiesWithThisChild.push({
              familyKey,
              parents: familyParents,
              parentNames: familyParents.map(p => `${p.name} (${p.type})`)
            });
          }
        });

        // If this child appears in more than one family, it's a conflict
        if (familiesWithThisChild.length > 1) {
          conflictMap.set(student.id, {
            childId: student.id,
            childName: student.name,
            families: familiesWithThisChild
          });
        }
      });

      setConflicts(Array.from(conflictMap.values()));
      setHasAnalyzed(true);
      setIsAnalyzing(false);
    }, 1000);
  };

  // Clean up the database by keeping children only in the first family
  const cleanupDatabase = () => {
    setIsCleaningUp(true);

    setTimeout(() => {
      const cleanedParents = [...parents];
      let totalRemoved = 0;
      const removalLog: string[] = [];

      conflicts.forEach(conflict => {
        // Keep the child in the first family only
        const firstFamily = conflict.families[0];
        const firstFamilyParentIds = firstFamily.parents.map(p => p.id);

        // Remove from all other families
        for (let i = 1; i < conflict.families.length; i++) {
          const familyToRemoveFrom = conflict.families[i];
          
          familyToRemoveFrom.parents.forEach(parent => {
            const parentIndex = cleanedParents.findIndex(p => p.id === parent.id);
            if (parentIndex !== -1) {
              const before = cleanedParents[parentIndex].childrenIds.length;
              cleanedParents[parentIndex].childrenIds = cleanedParents[parentIndex].childrenIds.filter(
                id => id !== conflict.childId
              );
              const after = cleanedParents[parentIndex].childrenIds.length;
              
              if (before > after) {
                totalRemoved++;
                removalLog.push(
                  `Removed "${conflict.childName}" from ${parent.name} (${parent.type})`
                );
              }
            }
          });
        }
      });

      onCleanup(cleanedParents);
      setIsCleaningUp(false);
      
      toast.success(
        `Database cleaned! Removed ${totalRemoved} duplicate child ${totalRemoved === 1 ? 'assignment' : 'assignments'}.`,
        { duration: 5000 }
      );

      // Log details to console for admin review
      console.log('=== DATABASE CLEANUP REPORT ===');
      console.log(`Total conflicts resolved: ${conflicts.length}`);
      console.log(`Total assignments removed: ${totalRemoved}`);
      console.log('\nDetailed removal log:');
      removalLog.forEach(log => console.log(`  - ${log}`));
      console.log('===============================');

      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Database className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Database Cleanup Utility</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Fix duplicate child assignments across families
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {!hasAnalyzed ? (
            <>
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-900 mb-1">What does this tool do?</p>
                  <p className="text-sm text-yellow-800">
                    This utility scans your parent database and identifies children who are assigned to multiple different families. 
                    It will automatically fix the issue by keeping each child in only the first family they were assigned to.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Current Database Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Total Parents</p>
                    <p className="text-3xl font-bold text-indigo-600">{parents.length}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Total Students</p>
                    <p className="text-3xl font-bold text-green-600">{students.length}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={analyzeDatabase}
                disabled={isAnalyzing}
                className="w-full px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Analyzing Database...
                  </>
                ) : (
                  <>
                    <Database className="w-5 h-5" />
                    Analyze Database
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              {conflicts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Database is Clean! ✨</h3>
                  <p className="text-gray-600 mb-6">
                    No duplicate child assignments found. Your database is properly configured.
                  </p>
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-900 mb-1">
                        {conflicts.length} Conflict{conflicts.length !== 1 ? 's' : ''} Detected
                      </p>
                      <p className="text-sm text-red-800">
                        The following children are assigned to multiple families. Click "Clean Up Database" to fix automatically.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    {conflicts.map((conflict, index) => (
                      <div key={conflict.childId} className="border border-gray-200 rounded-lg p-4 bg-white">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-gray-900 text-lg">{conflict.childName}</p>
                            <p className="text-sm text-gray-500">Conflict #{index + 1}</p>
                          </div>
                          <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                            {conflict.families.length} families
                          </div>
                        </div>

                        <div className="space-y-2">
                          {conflict.families.map((family, familyIndex) => (
                            <div 
                              key={family.familyKey}
                              className={`p-3 rounded-lg border-2 ${
                                familyIndex === 0 
                                  ? 'bg-green-50 border-green-300' 
                                  : 'bg-gray-50 border-gray-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-700 mb-1">
                                    Family {familyIndex + 1}: {family.parentNames.join(' & ')}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {family.parents[0].childrenIds.length} {family.parents[0].childrenIds.length === 1 ? 'child' : 'children'} total
                                  </p>
                                </div>
                                {familyIndex === 0 ? (
                                  <div className="px-2 py-1 bg-green-600 text-white rounded text-xs font-medium">
                                    Will Keep
                                  </div>
                                ) : (
                                  <div className="px-2 py-1 bg-red-600 text-white rounded text-xs font-medium">
                                    Will Remove
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                    <p className="text-sm text-blue-800">
                      <strong>Action Plan:</strong> Each child will be kept in the first family they were assigned to (marked in green), 
                      and removed from all other families (marked in red). This ensures no child belongs to multiple families.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={cleanupDatabase}
                      disabled={isCleaningUp}
                      className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isCleaningUp ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          Cleaning Up...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Clean Up Database
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
