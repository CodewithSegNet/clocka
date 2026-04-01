import React, { useState } from 'react';
import { AlertTriangle, Trash2, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { toast } from 'sonner';
import * as supabaseApi from '@/utils/supabaseApi';
import * as parentApi from '@/utils/parentApi';

export default function DataCleanupUtility() {
  const { parents, students, updateParent, deleteParent } = useData();
  const [issues, setIssues] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const scanForIssues = () => {
    setIsScanning(true);
    const foundIssues: any[] = [];

    // Create a map of students to their parents
    const studentParentMap = new Map<string, Array<{parent: any, type: string}>>();
    
    parents.forEach(parent => {
      parent.childrenIds.forEach(childId => {
        if (!studentParentMap.has(childId)) {
          studentParentMap.set(childId, []);
        }
        studentParentMap.get(childId)!.push({
          parent: parent,
          type: parent.type
        });
      });
    });

    // Check for students with more than 2 parents
    studentParentMap.forEach((parentsList, studentId) => {
      if (parentsList.length > 2) {
        const student = students.find(s => s.id === studentId);
        foundIssues.push({
          type: 'EXCESS_PARENTS',
          severity: 'critical',
          studentId,
          studentName: student?.name || 'Unknown',
          parents: parentsList,
          message: `Student "${student?.name}" has ${parentsList.length} parents (should have max 2)`
        });
      }

      // Check for students with duplicate parent types (e.g., 2 mothers or 2 fathers)
      const motherCount = parentsList.filter(p => p.type === 'mother').length;
      const fatherCount = parentsList.filter(p => p.type === 'father').length;

      if (motherCount > 1) {
        const student = students.find(s => s.id === studentId);
        const mothers = parentsList.filter(p => p.type === 'mother');
        foundIssues.push({
          type: 'DUPLICATE_MOTHER',
          severity: 'critical',
          studentId,
          studentName: student?.name || 'Unknown',
          duplicateParents: mothers,
          message: `Student "${student?.name}" has ${motherCount} mothers registered`
        });
      }

      if (fatherCount > 1) {
        const student = students.find(s => s.id === studentId);
        const fathers = parentsList.filter(p => p.type === 'father');
        foundIssues.push({
          type: 'DUPLICATE_FATHER',
          severity: 'critical',
          studentId,
          studentName: student?.name || 'Unknown',
          duplicateParents: fathers,
          message: `Student "${student?.name}" has ${fatherCount} fathers registered`
        });
      }
    });

    // Check for duplicate children across different families
    const childFamilyMap = new Map<string, Set<string>>();
    parents.forEach(parent => {
      parent.childrenIds.forEach(childId => {
        if (!childFamilyMap.has(childId)) {
          childFamilyMap.set(childId, new Set());
        }
        childFamilyMap.get(childId)!.add(parent.familyId);
      });
    });

    childFamilyMap.forEach((familyIds, childId) => {
      if (familyIds.size > 1) {
        const student = students.find(s => s.id === childId);
        const affectedParents = parents.filter(p => p.childrenIds.includes(childId));
        foundIssues.push({
          type: 'CHILD_IN_MULTIPLE_FAMILIES',
          severity: 'high',
          studentId: childId,
          studentName: student?.name || 'Unknown',
          familyIds: Array.from(familyIds),
          parents: affectedParents.map(p => ({ parent: p, type: p.type })),
          message: `Student "${student?.name}" appears in ${familyIds.size} different family units`
        });
      }
    });

    setIssues(foundIssues);
    setIsScanning(false);

    if (foundIssues.length === 0) {
      toast.success('No data integrity issues found! ✅');
    } else {
      toast.warning(`Found ${foundIssues.length} data integrity issue(s)`);
    }
  };

  const removeParentFromStudent = async (parentId: string, studentId: string) => {
    const parent = parents.find(p => p.id === parentId);
    if (!parent) {
      toast.error('Parent not found');
      return;
    }

    const student = students.find(s => s.id === studentId);
    const studentName = student?.name || 'Unknown';

    if (!confirm(`Remove "${studentName}" from "${parent.name}" (${parent.type})?\n\nThis action cannot be undone.`)) {
      return;
    }

    setIsProcessing(true);

    try {
      console.log('🔧 [DATA CLEANUP] Removing student', studentId, 'from parent', parentId);
      console.log('📊 [DATA CLEANUP] Current childrenIds:', parent.childrenIds);
      
      // Remove this student from the parent's children array
      const updatedChildrenIds = parent.childrenIds.filter(id => id !== studentId);
      
      console.log('📊 [DATA CLEANUP] Updated childrenIds:', updatedChildrenIds);
      
      // Update parent in Supabase first
      try {
        console.log('☁️ [DATA CLEANUP] Updating Supabase...');
        await parentApi.updateParent(parent.id, { childrenIds: updatedChildrenIds });
        console.log('✅ [DATA CLEANUP] Updated parent in Supabase');
      } catch (supabaseError) {
        console.error('❌ [DATA CLEANUP] Supabase update failed:', supabaseError);
        toast.error('Failed to update in database: ' + (supabaseError as Error).message);
        setIsProcessing(false);
        return;
      }
      
      // Update in DataContext (which updates localStorage and state)
      console.log('💾 [DATA CLEANUP] Updating local state...');
      updateParent(parent.id, { childrenIds: updatedChildrenIds });
      console.log('✅ [DATA CLEANUP] Updated local state');
      
      toast.success(`Removed "${studentName}" from "${parent.name}"`);
      
      // Rescan after a short delay to let state update
      setTimeout(() => {
        console.log('🔄 [DATA CLEANUP] Rescanning for issues...');
        scanForIssues();
        setIsProcessing(false);
      }, 1000);
      
    } catch (error) {
      console.error('❌ [DATA CLEANUP] Error removing parent from student:', error);
      toast.error('Failed to remove student from parent: ' + (error as Error).message);
      setIsProcessing(false);
    }
  };

  const permanentlyDeleteParent = async (parentId: string) => {
    const parent = parents.find(p => p.id === parentId);
    if (!parent) {
      toast.error('Parent not found');
      return;
    }

    const childrenNames = students
      .filter(s => parent.childrenIds.includes(s.id))
      .map(s => s.name)
      .join(', ');

    if (!confirm(
      `PERMANENTLY DELETE "${parent.name}" (${parent.type})?\n\n` +
      `Children: ${childrenNames || 'None'}\n\n` +
      `This will:\n` +
      `- Remove the parent account completely\n` +
      `- Delete all their login credentials\n` +
      `- Remove from both database and local storage\n` +
      `- This action CANNOT be undone\n\n` +
      `Are you absolutely sure?`
    )) {
      return;
    }

    setIsProcessing(true);

    try {
      console.log('🗑️ [DATA CLEANUP] Permanently deleting parent:', parentId);
      console.log('📊 [DATA CLEANUP] Parent data:', parent);
      
      // Delete from Supabase first
      try {
        console.log('☁️ [DATA CLEANUP] Deleting from Supabase...');
        await supabaseApi.deleteParent(parent.id);
        console.log('✅ [DATA CLEANUP] Deleted parent from Supabase');
      } catch (supabaseError) {
        console.error('❌ [DATA CLEANUP] Supabase delete failed:', supabaseError);
        toast.error('Failed to delete from database: ' + (supabaseError as Error).message);
        setIsProcessing(false);
        return;
      }
      
      // Delete from DataContext (which updates localStorage and state)
      console.log('💾 [DATA CLEANUP] Deleting from local state...');
      await deleteParent(parent.id);
      console.log('✅ [DATA CLEANUP] Deleted from local state');
      
      toast.success(`Parent "${parent.name}" has been permanently deleted`);
      
      // Rescan after a short delay to let state update
      setTimeout(() => {
        console.log('🔄 [DATA CLEANUP] Rescanning for issues...');
        scanForIssues();
        setIsProcessing(false);
      }, 1000);
      
    } catch (error) {
      console.error('❌ [DATA CLEANUP] Error deleting parent:', error);
      toast.error('Failed to delete parent: ' + (error as Error).message);
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              Data Integrity Scanner
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Scan for and fix data corruption issues like duplicate parents or children in multiple families
            </p>
          </div>
          <button
            onClick={scanForIssues}
            disabled={isScanning || isProcessing}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-5 h-5 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Scanning...' : 'Scan Now'}
          </button>
        </div>

        {/* Warning Banner */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-900 mb-1">Important:</p>
              <p className="text-sm text-yellow-800">
                Data cleanup actions update both the database and local storage. Changes take effect immediately.
              </p>
            </div>
          </div>
        </div>

        {/* Processing indicator */}
        {isProcessing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3 items-center">
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
              <p className="text-sm font-semibold text-blue-900">Processing changes...</p>
            </div>
          </div>
        )}

        {issues.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2 text-orange-700 bg-orange-50 border border-orange-200 rounded-lg p-3">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-semibold">Found {issues.length} issue(s) that need attention</span>
            </div>

            {issues.map((issue, index) => (
              <div
                key={index}
                className={`border-2 rounded-xl p-5 ${
                  issue.severity === 'critical'
                    ? 'border-red-300 bg-red-50'
                    : 'border-orange-300 bg-orange-50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">{issue.message}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Type: <span className="font-mono bg-white px-2 py-0.5 rounded">{issue.type}</span>
                      {' '} | Severity: <span className={`font-semibold ${issue.severity === 'critical' ? 'text-red-600' : 'text-orange-600'}`}>
                        {issue.severity.toUpperCase()}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Show affected parents */}
                {(issue.parents || issue.duplicateParents) && (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm font-semibold text-gray-700">Affected Parents:</p>
                    {(issue.duplicateParents || issue.parents || []).map((item: any) => {
                      const parent = item.parent || item;
                      return (
                        <div key={parent.id} className="bg-white border border-gray-300 rounded-lg p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img
                              src={parent.photo}
                              alt={parent.name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-gray-300"
                            />
                            <div>
                              <p className="font-bold text-gray-900">{parent.name}</p>
                              <p className="text-sm text-gray-600">
                                {parent.type} • Parent ID: {parent.parentId} • Family ID: {parent.familyId}
                              </p>
                              <p className="text-xs text-gray-500">
                                Children: {parent.childrenIds.length} • {parent.email || parent.phoneNumber}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => removeParentFromStudent(parent.id, issue.studentId)}
                              disabled={isProcessing}
                              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Remove from {issue.studentName}
                            </button>
                            <button
                              onClick={() => permanentlyDeleteParent(parent.id)}
                              disabled={isProcessing}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete Parent
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!isScanning && !isProcessing && issues.length === 0 && (
          <div className="mt-6 text-center py-8 bg-green-50 border border-green-200 rounded-xl">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <p className="text-green-900 font-semibold">No issues detected</p>
            <p className="text-sm text-green-700 mt-1">All data integrity checks passed!</p>
          </div>
        )}
      </div>
    </div>
  );
}