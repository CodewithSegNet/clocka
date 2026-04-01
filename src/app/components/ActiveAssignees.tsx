import React, { useState, useEffect } from 'react';
import { Trash2, Clock, User, Phone, CreditCard, CheckCircle2, XCircle, AlertTriangle, Copy, Edit2, Power } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { useData } from '@/contexts/DataContext';
import { toast } from 'sonner';
import { EditAssigneeModal } from '@/app/components/EditAssigneeModal';
import type { Parent, Assignee, Student } from '@/contexts/DataContext';

interface ActiveAssigneesProps {
  parent: Parent;
}

export function ActiveAssignees({ parent }: ActiveAssigneesProps) {
  const { getActiveAssigneesForFamily, deleteAssignee, updateAssignee, getStudentsByIds } = useData();
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [showIdModal, setShowIdModal] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<Record<string, string>>({});
  const [editingAssignee, setEditingAssignee] = useState<Assignee | null>(null);

  useEffect(() => {
    loadAssignees();
    const interval = setInterval(loadAssignees, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [parent.familyId]);

  useEffect(() => {
    // Update time remaining every second
    const interval = setInterval(() => {
      const times: Record<string, string> = {};
      assignees.forEach((assignee) => {
        times[assignee.id] = calculateTimeRemaining(assignee.expiresAt);
      });
      setTimeRemaining(times);
    }, 1000);

    return () => clearInterval(interval);
  }, [assignees]);

  const loadAssignees = () => {
    const active = getActiveAssigneesForFamily(parent.familyId);
    setAssignees(active);
  };

  const calculateTimeRemaining = (expiresAt: Date): string => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const handleDelete = (assigneeId: string, assigneeName: string) => {
    if (window.confirm(`Are you sure you want to remove ${assigneeName}'s access?`)) {
      try {
        deleteAssignee(assigneeId);
        toast.success('Assignee access revoked');
        loadAssignees();
      } catch (error) {
        console.error('Error deleting assignee:', error);
        toast.error('Failed to revoke access');
      }
    }
  };

  const copyAccessCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Access code copied to clipboard');
  };

  const getStatusBadge = (assignee: Assignee) => {
    const now = new Date();
    const expiry = new Date(assignee.expiresAt);
    const diff = expiry.getTime() - now.getTime();
    const hoursLeft = diff / (1000 * 60 * 60);

    if (!assignee.isActive) {
      return <Badge variant="destructive" size="sm">Revoked</Badge>;
    } else if (diff <= 0) {
      return <Badge variant="destructive" size="sm">Expired</Badge>;
    } else if (hoursLeft < 1) {
      return <Badge variant="warning" size="sm">Expiring Soon</Badge>;
    } else {
      return <Badge variant="success" size="sm">Active</Badge>;
    }
  };

  if (assignees.length === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-8 text-center border-2 border-dashed border-gray-200">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-600">No active assignees</p>
        <p className="text-xs text-gray-500 mt-1">Click "Assign Someone" to add a pickup person</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Active Assignees ({assignees.length})</h3>
      </div>

      <div className="grid gap-4">
        {assignees.map((assignee) => (
          <div
            key={assignee.id}
            className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
          >
            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
              <img
                src={assignee.photo}
                alt={assignee.fullName}
                className="w-16 h-16 rounded-full object-cover border-2 border-emerald-200 flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${assignee.fullName}`;
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900 text-base truncate">
                    {assignee.fullName}
                  </h4>
                  {getStatusBadge(assignee)}
                </div>
                <p className="text-xs text-gray-500">Assigned by {assignee.parentName}</p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>{assignee.phoneNumber}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CreditCard className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>{assignee.idType}: {assignee.idNumber}</span>
                <button
                  onClick={() => setShowIdModal(assignee.id)}
                  className="text-emerald-600 hover:text-emerald-700 text-xs font-medium ml-auto"
                >
                  View ID
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>
                  {timeRemaining[assignee.id] === 'Expired' ? (
                    <span className="text-red-600 font-medium">Expired</span>
                  ) : (
                    <>Time remaining: <span className="font-medium text-emerald-600">{timeRemaining[assignee.id]}</span></>
                  )}
                </span>
              </div>
            </div>

            {/* Access Code */}
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-3 mb-4">
              <p className="text-xs font-medium text-gray-600 mb-1">Access Code</p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-lg font-bold text-emerald-700 tracking-wider">
                  {assignee.accessCode}
                </code>
                <button
                  onClick={() => copyAccessCode(assignee.accessCode)}
                  className="text-emerald-600 hover:text-emerald-700 p-2 hover:bg-white/50 rounded transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(assignee.id, assignee.fullName)}
                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Revoke Access
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingAssignee(assignee)}
                className="flex-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Assignee
              </Button>
            </div>

            {/* ID Photo Modal */}
            {showIdModal === assignee.id && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                onClick={() => setShowIdModal(null)}
              >
                <div
                  className="bg-white rounded-2xl p-6 max-w-2xl w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">
                      {assignee.idType} - {assignee.idNumber}
                    </h3>
                    <button
                      onClick={() => setShowIdModal(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>
                  <img
                    src={assignee.idPhoto}
                    alt={`${assignee.idType} - ${assignee.idNumber}`}
                    className="w-full rounded-lg shadow-lg"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Warning for expired assignees */}
      {assignees.some((a) => new Date(a.expiresAt) < new Date()) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold">Some assignees have expired</p>
            <p className="mt-1">
              Expired assignees can no longer access the system. Remove them to keep the list clean.
            </p>
          </div>
        </div>
      )}

      {/* Edit Assignee Modal */}
      {editingAssignee && (
        <EditAssigneeModal
          isOpen={true}
          assignee={editingAssignee}
          allChildren={getStudentsByIds(parent.childrenIds)}
          onClose={() => setEditingAssignee(null)}
          onUpdate={(assigneeId, updates) => {
            updateAssignee(assigneeId, updates);
            setEditingAssignee(null);
            loadAssignees();
          }}
        />
      )}
    </div>
  );
}