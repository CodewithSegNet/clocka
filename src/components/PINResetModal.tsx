import React, { useState, useRef } from 'react';
import { X, ArrowRight, ArrowLeft, Camera, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useData } from '@/contexts/DataContext';

interface PINResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolCode: string;
  schoolName: string;
}

type Step = 'verify' | 'new-pin' | 'facial-capture' | 'submit';

export default function PINResetModal({ isOpen, onClose, schoolCode, schoolName }: PINResetModalProps) {
  const { students, parents } = useData();
  const [step, setStep] = useState<Step>('verify');
  
  // Step 1: Verification
  const [studentId, setStudentId] = useState('');
  const [childName, setChildName] = useState('');
  const [parentName, setParentName] = useState('');
  
  // Step 2: New PIN
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  
  // Step 3: Facial Capture
  const [capturedPhoto, setCapturedPhoto] = useState<string>('');
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Validated data
  const [validatedStudent, setValidatedStudent] = useState<any>(null);
  const [validatedParent, setValidatedParent] = useState<any>(null);
  
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleVerification = () => {
    setError('');
    
    // Trim inputs
    const trimmedStudentId = studentId.trim();
    const trimmedChildName = childName.trim().toLowerCase();
    const trimmedParentName = parentName.trim().toLowerCase();

    console.log('🔍 Verifying:', { trimmedStudentId, trimmedChildName, trimmedParentName });

    // Find student by ID
    const student = students.find(s => s.id === trimmedStudentId);
    
    if (!student) {
      setError('Student ID not found. Please check and try again.');
      return;
    }

    // Verify child's name matches
    if (student.name.toLowerCase() !== trimmedChildName) {
      setError("Child's name does not match the Student ID. Please check and try again.");
      return;
    }

    // Find parent for this student
    const parent = parents.find(p => 
      p.childrenIds.includes(trimmedStudentId) && 
      p.name.toLowerCase() === trimmedParentName
    );

    if (!parent) {
      setError("Parent's name does not match our records for this student. Please check and try again.");
      return;
    }

    console.log('✅ Verification successful:', { student: student.name, parent: parent.name });

    // Save validated data
    setValidatedStudent(student);
    setValidatedParent(parent);
    
    // Move to next step
    toast.success('Verification successful!');
    setStep('new-pin');
  };

  const handleNewPinSubmit = () => {
    setError('');

    if (newPin.length !== 4 || confirmPin.length !== 4) {
      setError('PIN must be exactly 4 digits.');
      return;
    }

    if (newPin !== confirmPin) {
      setError('PINs do not match. Please try again.');
      return;
    }

    if (!/^\d{4}$/.test(newPin)) {
      setError('PIN must contain only numbers.');
      return;
    }

    toast.success('PIN set successfully!');
    setStep('facial-capture');
  };

  const startCamera = async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Unable to access camera. Please check permissions.');
      setIsCapturing(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedPhoto(photoData);
        
        // Stop camera
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        setIsCapturing(false);
        toast.success('Photo captured successfully!');
      }
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto('');
    startCamera();
  };

  const handleSubmitRequest = () => {
    if (!capturedPhoto) {
      setError('Please capture a photo to continue.');
      return;
    }

    // Create PIN reset request
    const resetRequest = {
      id: `pin-reset-${Date.now()}`,
      parentId: validatedParent.id,
      parentName: validatedParent.name,
      parentPhoto: validatedParent.photo,
      studentId: validatedStudent.id,
      studentName: validatedStudent.name,
      newPin: newPin,
      verificationPhoto: capturedPhoto,
      schoolCode: schoolCode,
      status: 'pending',
      createdAt: new Date().toISOString(),
      submittedAt: new Date().toISOString()
    };

    // Get existing requests
    const existingRequests = JSON.parse(localStorage.getItem('pinResetRequests') || '[]');
    
    // Add new request
    existingRequests.push(resetRequest);
    
    // Save to localStorage
    localStorage.setItem('pinResetRequests', JSON.stringify(existingRequests));

    console.log('✅ PIN reset request submitted:', resetRequest);

    // Move to success step
    setStep('submit');
    toast.success('PIN reset request submitted successfully!');
  };

  const handleClose = () => {
    // Stop camera if running
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Reset all state
    setStep('verify');
    setStudentId('');
    setChildName('');
    setParentName('');
    setNewPin('');
    setConfirmPin('');
    setCapturedPhoto('');
    setIsCapturing(false);
    setValidatedStudent(null);
    setValidatedParent(null);
    setError('');
    
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between z-10">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">Reset PIN</h2>
              <p className="text-green-100 text-xs mt-1">
                {step === 'verify' && 'Step 1: Verify Identity'}
                {step === 'new-pin' && 'Step 2: Set New PIN'}
                {step === 'facial-capture' && 'Step 3: Facial Verification'}
                {step === 'submit' && 'Request Submitted'}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Step 1: Verify Identity */}
            {step === 'verify' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-900">
                    <strong>ℹ️ Verification Required</strong><br />
                    To reset your PIN, please verify your identity by providing the following information.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="Enter your child's Student ID"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Child's Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="Enter your child's full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parent's Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  onClick={handleVerification}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  Verify & Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Step 2: Set New PIN */}
            {step === 'new-pin' && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-green-900">
                    <strong>✅ Identity Verified</strong><br />
                    Parent: <strong>{validatedParent.name}</strong><br />
                    Child: <strong>{validatedStudent.name}</strong> ({validatedStudent.id})
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New 4-Digit PIN <span className="text-red-500">*</span>
                  </label>
                  <input
                    type={showNewPin ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none font-mono text-lg tracking-widest"
                    placeholder="••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPin(!showNewPin)}
                    className="text-xs text-gray-600 hover:text-gray-900 mt-1"
                  >
                    {showNewPin ? 'Hide PIN' : 'Show PIN'}
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New PIN <span className="text-red-500">*</span>
                  </label>
                  <input
                    type={showConfirmPin ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={4}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none font-mono text-lg tracking-widest"
                    placeholder="••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                    className="text-xs text-gray-600 hover:text-gray-900 mt-1"
                  >
                    {showConfirmPin ? 'Hide PIN' : 'Show PIN'}
                  </button>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('verify')}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                  </button>
                  <button
                    onClick={handleNewPinSubmit}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2"
                  >
                    Continue
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Facial Capture */}
            {step === 'facial-capture' && (
              <div className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-purple-900">
                    <strong>📸 Facial Verification Required</strong><br />
                    Please capture a clear photo of your face for verification. This will be reviewed by the school administrator.
                  </p>
                </div>

                {!capturedPhoto && !isCapturing && (
                  <button
                    onClick={startCamera}
                    className="w-full bg-purple-600 text-white py-4 rounded-lg hover:bg-purple-700 transition-colors font-semibold flex items-center justify-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    Start Camera
                  </button>
                )}

                {isCapturing && (
                  <div className="space-y-3">
                    <div className="relative bg-black rounded-lg overflow-hidden">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-auto"
                      />
                    </div>
                    <button
                      onClick={capturePhoto}
                      className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2"
                    >
                      <Camera className="w-5 h-5" />
                      Capture Photo
                    </button>
                  </div>
                )}

                {capturedPhoto && (
                  <div className="space-y-3">
                    <div className="relative bg-black rounded-lg overflow-hidden">
                      <img
                        src={capturedPhoto}
                        alt="Captured"
                        className="w-full h-auto"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={retakePhoto}
                        className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                      >
                        Retake Photo
                      </button>
                      <button
                        onClick={handleSubmitRequest}
                        className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2"
                      >
                        Submit Request
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                <canvas ref={canvasRef} className="hidden" />

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {!capturedPhoto && (
                  <button
                    onClick={() => setStep('new-pin')}
                    className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                  </button>
                )}
              </div>
            )}

            {/* Step 4: Success */}
            {step === 'submit' && (
              <div className="space-y-4 text-center py-8">
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-gray-900">Request Submitted!</h3>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-900">
                    Your PIN reset request has been submitted to <strong>{schoolName}</strong> for approval.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                  <p className="text-sm text-blue-900">
                    <strong>📋 What's Next?</strong>
                  </p>
                  <ul className="text-sm text-blue-900 mt-2 space-y-1 list-disc list-inside">
                    <li>School administrator will review your request</li>
                    <li>They will verify your identity using the photo you provided</li>
                    <li>Once approved, you can login with your new PIN</li>
                    <li>You may contact the school for status updates</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-xs text-yellow-900">
                    <strong>⏱️ Processing Time:</strong> PIN reset requests are typically processed within 24-48 hours during school operating hours.
                  </p>
                </div>

                <button
                  onClick={handleClose}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}