import React, { useRef, useState } from 'react';
import { X, Download, Copy, ExternalLink, Calendar, Clock, Shield, User, AlertTriangle, Printer } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { toast } from 'sonner';
import type { Assignee, Student } from '@/contexts/DataContext';
import clockaLogo from 'figma:asset/c6c92aab0f7d59ff7afbce0ebd8b122d9715bdde.png';

interface AssigneeCredentialsModalProps {
  assignee: Assignee;
  parentName: string;
  parentPhoto: string;
  schoolCode: string;
  children: Student[]; // Add children prop
  onClose: () => void;
  onFinalClose?: () => void; // Callback to close parent modal
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

  const loginUrl = `${window.location.origin}/school/${schoolCode}/assignee-login`;

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
    // Also close the parent assign modal
    if (onFinalClose) {
      onFinalClose();
    }
  };

  const handleExportPDF = () => {
    if (isGeneratingPDF) return;

    setIsGeneratingPDF(true);
    
    // Show instructions
    toast.info('Opening print dialog...');
    toast.info('Select "Save as PDF" or "Microsoft Print to PDF" as your printer', { duration: 7000 });
    
    // Small delay to let toasts show, then open print
    setTimeout(() => {
      try {
        window.print();
      } catch (error) {
        console.error('Print error:', error);
        toast.error('Failed to open print dialog');
      } finally {
        setIsGeneratingPDF(false);
      }
    }, 300);
  };

  const expiresAt = new Date(assignee.expiresAt);
  const durationHours = Math.round((expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60));

  return (
    <>
      {/* Print-specific styles */}
      <style>{`
        @media print {
          /* Hide everything by default */
          body * {
            visibility: hidden !important;
          }
          
          /* Show only the PDF content */
          #pdf-content-only,
          #pdf-content-only * {
            visibility: visible !important;
          }
          
          /* Position PDF content at top left */
          #pdf-content-only {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background: white !important;
            margin: 0 !important;
            padding: 20px !important;
          }
          
          /* Hide screen-only sections completely */
          .screen-only {
            display: none !important;
            visibility: hidden !important;
          }
          
          /* Prevent page breaks inside sections */
          .print-section {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin-bottom: 20px !important;
          }
          
          /* Remove problematic CSS for printing */
          #pdf-content-only * {
            box-shadow: none !important;
            text-shadow: none !important;
          }
          
          /* Ensure images fit and don't break */
          #pdf-content-only img {
            max-width: 100% !important;
            height: auto !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          /* Page margins */
          @page {
            margin: 0.5in;
            size: A4;
          }
          
          /* Reset positioning for print */
          #pdf-content-only .rounded-xl,
          #pdf-content-only .rounded-lg,
          #pdf-content-only .rounded-full {
            border-radius: 8px !important;
          }
          
          /* Simplify backgrounds for print */
          #pdf-content-only .bg-gradient-to-br,
          #pdf-content-only .bg-gradient-to-r {
            background: #f3f4f6 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 max-h-[95vh] flex flex-col overflow-hidden">
          {/* Header - Fixed at top with higher z-index */}
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

          {/* Scrollable Credentials Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              
              {/* PDF CONTENT ONLY - Everything inside this ref will be in PDF */}
              <div ref={credentialsRef} className="space-y-6 bg-white" id="pdf-content-only">
                {/* Clocka Branding for PDF */}
                <div className="text-center border-b border-gray-200 pb-4 print-section">
                  <div className="inline-flex items-center gap-3 mb-2">
                    <img 
                      src={clockaLogo} 
                      alt="Clocka Logo" 
                      className="w-12 h-12"
                    />
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-[#0039E6] to-[#3366FF] bg-clip-text text-transparent">
                      Clocka
                    </h1>
                  </div>
                  <p className="text-sm text-gray-600">School Attendance & Security System</p>
                  <p className="text-xs text-gray-500 mt-1">Temporary Assignee Authorization</p>
                </div>

                {/* 1. ASSIGNEE INFORMATION */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200 print-section">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Assignee Information
                  </h4>
                  
                  <div className="flex items-start gap-4">
                    <img
                      src={assignee.photo}
                      alt={assignee.fullName}
                      className="w-24 h-24 rounded-xl object-cover border-4 border-white shadow-lg"
                      onError={(e) => {
                        e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${assignee.fullName}`;
                      }}
                    />
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Full Name</p>
                        <p className="text-base font-bold text-gray-900">{assignee.fullName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Phone Number</p>
                        <p className="text-sm text-gray-900">{assignee.phoneNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">ID Type & Number</p>
                        <p className="text-sm text-gray-900">
                          {assignee.idType}: {assignee.idNumber}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ID Card Photo */}
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <p className="text-xs text-gray-600 font-medium mb-2">Government-Issued ID Card</p>
                    <img
                      src={assignee.idPhoto}
                      alt="ID Card"
                      className="w-full max-w-xs rounded-lg border-2 border-white shadow-lg"
                    />
                  </div>
                </div>

                {/* 2. SCHEDULE OF ASSIGNMENT */}
                <div className="bg-amber-50 rounded-xl p-6 border border-amber-200 print-section">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-amber-600" />
                    Schedule of Assignment
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 font-medium mb-1">Duration</p>
                      <p className="text-base font-bold text-gray-900">{durationHours} hours</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium mb-1">Valid Until</p>
                      <p className="text-sm text-gray-900">
                        {expiresAt.toLocaleDateString()} {expiresAt.toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-600 font-medium mb-1">Created On</p>
                      <p className="text-sm text-gray-900">
                        {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. PARENT AUTHORIZATION */}
                <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200 print-section">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">Parent Authorization</h4>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={parentPhoto}
                      alt={parentName}
                      className="w-16 h-16 rounded-xl object-cover border-4 border-white shadow-lg"
                      onError={(e) => {
                        e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${parentName}`;
                      }}
                    />
                    <div>
                      <p className="text-base font-bold text-gray-900">{parentName}</p>
                      <p className="text-sm text-gray-600">Parent/Guardian</p>
                    </div>
                  </div>
                  
                  <div className="bg-emerald-100 rounded-lg p-3">
                    <p className="text-xs text-emerald-900 font-semibold">
                      I, {parentName}, hereby authorize {assignee.fullName} to pick up and drop off my child(ren) 
                      as listed below for the duration specified in this document.
                    </p>
                  </div>
                </div>

                {/* 4. CHILD INFORMATION */}
                <div className="bg-purple-50 rounded-xl p-6 border border-purple-200 print-section">
                  <h4 className="text-lg font-bold text-gray-900 mb-3">Child Information</h4>
                  <p className="text-sm text-gray-700 mb-4">
                    The assignee is authorized to pick up and drop off the following child(ren):
                  </p>
                  
                  {/* Children List with Photos */}
                  <div className="space-y-3">
                    {children.map((child) => (
                      <div key={child.id} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-purple-200">
                        <img
                          src={child.image}
                          alt={child.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-purple-300"
                          onError={(e) => {
                            e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${child.name}`;
                          }}
                        />
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">{child.name}</p>
                          <p className="text-xs text-gray-600">{child.class} • Age {child.age}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-purple-300">
                    <p className="text-sm font-bold text-purple-900 text-center">
                      Total: {children.length} {children.length === 1 ? 'child' : 'children'}
                    </p>
                  </div>
                </div>

                {/* PDF Footer */}
                <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-200">
                  <p className="font-semibold text-gray-700">Official Clocka Authorization Document</p>
                  <p className="mt-1">School Code: {schoolCode}</p>
                  <p>Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
                </div>
              </div>

              {/* SCREEN-ONLY CONTENT - NOT INCLUDED IN PDF */}
              <div className="space-y-6 mt-6 pt-6 border-t-4 border-gray-300 screen-only">
                
                {/* Access Code & Login Info - Screen Only */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-gray-600" />
                    Assignee Login Details (Not included in PDF)
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-600 font-medium mb-2">Access Code (Login ID & Password)</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white border-2 border-blue-500 rounded-lg p-3 font-mono text-xl font-bold text-blue-600 text-center tracking-widest">
                          {assignee.accessCode}
                        </div>
                        <button
                          onClick={handleCopyAccessCode}
                          className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Use this code to login at the assignee portal
                      </p>
                    </div>

                    <div className="pt-4 border-t border-gray-300">
                      <p className="text-xs text-gray-600 font-medium mb-2">Login URL</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white border border-gray-300 rounded-lg p-2 text-sm text-blue-600 truncate">
                          {loginUrl}
                        </div>
                        <button
                          onClick={handleCopyLoginUrl}
                          className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                        <a
                          href={loginUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PDF Download Disclaimer */}
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
                      onClick={handleExportPDF}
                      disabled={isGeneratingPDF}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                    >
                      {isGeneratingPDF ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Generating PDF...
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5" />
                          DOWNLOAD PDF NOW - REQUIRED FOR PICKUP
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}