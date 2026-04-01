// Alternative implementation with Print-to-PDF fallback
import React, { useRef, useState } from 'react';
import { X, Download, Copy, ExternalLink, Calendar, Clock, Shield, User, AlertTriangle, Printer } from 'lucide-react';
import { toast } from 'sonner';
import type { Assignee, Student } from '@/contexts/DataContext';

interface AssigneeCredentialsModalProps {
  assignee: Assignee;
  parentName: string;
  parentPhoto: string;
  schoolCode: string;
  children: Student[];
  onClose: () => void;
  onFinalClose?: () => void;
}

export function AssigneeCredentialsModal({
  assignee,
  parentName,
  parentPhoto,
  schoolCode,
  children,
  onClose,
  onFinalClose
}: AssigneeCredentialsModalProps) {
  const credentialsRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const loginUrl = `${window.location.origin}/#/assignee/login`;

  const handleCopyAccessCode = () => {
    navigator.clipboard.writeText(assignee.accessCode);
    toast.success('Access code copied to clipboard!');
  };

  const handleCopyLoginUrl = () => {
    navigator.clipboard.writeText(loginUrl);
    toast.success('Login URL copied to clipboard!');
  };

  const handleClose = () => {
    onClose();
    if (onFinalClose) {
      onFinalClose();
    }
  };

  // Print-to-PDF fallback - more reliable
  const handlePrintPDF = () => {
    toast.info('Opening print dialog...');
    toast.info('Select "Save as PDF" as your printer', { duration: 5000 });
    window.print();
  };

  const expiresAt = new Date(assignee.expiresAt);
  const durationHours = Math.round((expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60));

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-credentials, #printable-credentials * {
            visibility: visible;
          }
          #printable-credentials {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
      
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 max-h-[95vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="relative z-10 bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-2xl flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Assignee Created Successfully!</h3>
                  <p className="text-sm text-white/80">Save or print these credentials for school security</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div id="printable-credentials" ref={credentialsRef} className="p-6 space-y-6">
              {/* Rest of the content - same as before */}
              <div className="text-center border-b border-gray-200 pb-4">
                <div className="inline-flex items-center gap-2 mb-2">
                  <div className="bg-gradient-to-br from-emerald-500 to-green-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                    Clocka
                  </h1>
                </div>
                <p className="text-sm text-gray-600">School Attendance & Security System</p>
                <p className="text-xs text-gray-500 mt-1">Temporary Assignee Authorization</p>
              </div>

              {/* All other sections remain the same */}
              {/* ... */}
              
              {/* Modified Download Button */}
              <div className="bg-red-50 border-2 border-red-500 rounded-xl p-6">
                <div className="flex gap-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-base font-bold text-red-900">⚠️ IMPORTANT - DOWNLOAD REQUIRED</p>
                    <p className="text-sm text-red-800 mt-2 font-semibold">
                      You MUST download and print this PDF document. The school will ONLY release the child(ren) to the assignee upon presentation of this printed authorization document.
                    </p>
                  </div>
                </div>
                
                <div className="bg-red-100 rounded-lg p-4 mt-3">
                  <p className="text-xs text-red-900 font-medium">
                    📋 <strong>School Security Protocol:</strong>
                  </p>
                  <ul className="mt-2 text-xs text-red-800 space-y-1 ml-4 list-disc">
                    <li>Assignee must present this printed PDF at school gate</li>
                    <li>School security will verify photo, ID details, and assigned children</li>
                    <li>Without this document, the child(ren) will NOT be released</li>
                    <li>This is the official authorization document required by the school</li>
                  </ul>
                </div>

                <div className="mt-4 flex items-center justify-center">
                  <button
                    onClick={handlePrintPDF}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                  >
                    <Printer className="w-5 h-5" />
                    PRINT TO PDF - REQUIRED FOR PICKUP
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-200">
                <p>Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
                <p className="mt-1">This is an official Clocka temporary authorization document</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
