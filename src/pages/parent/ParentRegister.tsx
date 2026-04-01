import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { ArrowLeft, User, Mail, Phone, Home, Camera, Check, AlertCircle, Upload } from 'lucide-react';
import { toast } from 'sonner';
import CameraCapture from '@/components/CameraCapture';

type RegistrationStep = 'student-id' | 'student-verification' | 'parent-details' | 'create-pin';

export default function ParentRegister() {
  const navigate = useNavigate();
  const { students, parents, addParent } = useData();
  
  // Get school code from localStorage
  const schoolCode = localStorage.getItem('schoolCode');
  
  // Warn if no school code is set
  useEffect(() => {
    if (!schoolCode) {
      console.error('❌ [REGISTRATION] No school code found in localStorage');
      toast.error('School information not found. Please use the registration link provided by your school.', {
        duration: 6000
      });
      // Redirect to home after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } else {
      console.log('✅ [REGISTRATION] School code found:', schoolCode);
    }
  }, [schoolCode, navigate]);
  
  // Step management
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('student-id');
  const [completedSteps, setCompletedSteps] = useState<RegistrationStep[]>([]);
  
  // Student ID validation
  const [studentId, setStudentId] = useState('');
  const [validatedStudent, setValidatedStudent] = useState<any>(null);
  
  // Parent details
  const [parentRole, setParentRole] = useState<'father' | 'mother'>('father');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [occupation, setOccupation] = useState('');
  const [address, setAddress] = useState('');
  const [photo, setPhoto] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  
  // PIN creation
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  
  const handleValidateStudentId = () => {
    const student = students.find(s => s.id === studentId.trim());
    
    if (!student) {
      toast.error('Invalid Student ID. Please check and try again.');
      return;
    }
    
    // FORCE reload parents from localStorage to get latest data
    const freshParents = JSON.parse(localStorage.getItem('parents') || '[]');
    console.log('🔍 Validating Student ID:', studentId.trim());
    console.log('📊 Fresh parents from localStorage:', freshParents.length);
    console.log('👥 All parents:', freshParents.map((p: any) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      childrenIds: p.childrenIds
    })));
    
    // CRITICAL: Check if this student already has registered parents
    const studentParents = freshParents.filter((p: any) => p.childrenIds.includes(student.id));
    
    console.log('📋 Parents for student', student.id, ':', studentParents.map((p: any) => ({
      name: p.name,
      type: p.type
    })));
    console.log('📊 Total parents for this student:', studentParents.length);
    
    // ✅ NEW VALIDATION: Check if both mother AND father roles are taken
    const hasMother = studentParents.some((p: any) => p.type === 'mother');
    const hasFather = studentParents.some((p: any) => p.type === 'father');
    
    // Block if BOTH mother and father are already registered
    if (hasMother && hasFather) {
      toast.error(
        'This Student ID cannot be used for registration. Both mother and father are already registered for this student. ' +
        'If you believe this is an error, please contact your school administrator.',
        { duration: 8000 }
      );
      console.log('❌ [REGISTRATION BLOCKED] Both parents already registered for student:', student.id);
      return;
    }
    
    setValidatedStudent(student);
    setCurrentStep('student-verification');
    toast.success(`Student found: ${student.name}`);
  };
  
  const handleRoleSelection = (role: 'father' | 'mother') => {
    // Check if this role is already taken for this student
    const studentParents = parents.filter(p => p.childrenIds.includes(validatedStudent.id));
    const roleExists = studentParents.some(p => p.type === role);
    
    if (roleExists) {
      toast.error(`A ${role} is already registered for this student. Please select the other role.`);
      return;
    }
    
    setParentRole(role);
    setCurrentStep('parent-details');
  };
  
  const handleParentDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName || !phoneNumber || !email || !address || !photo) {
      toast.error('Please fill in all fields and add a photo');
      return;
    }
    
    setCurrentStep('create-pin');
  };
  
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      toast.error('PIN must be exactly 4 digits');
      return;
    }
    
    if (pin !== confirmPin) {
      toast.error('PINs do not match');
      return;
    }
    
    // Check if there's already a parent for this student to determine familyId
    const existingParents = parents.filter(p => p.childrenIds.includes(validatedStudent.id));
    const familyId = existingParents.length > 0 
      ? existingParents[0].familyId 
      : `FID${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    // Create parent account
    const result = addParent({
      type: parentRole,
      name: fullName,
      photo,
      gender: parentRole === 'father' ? 'Male' : 'Female',
      occupation,
      residentialAddress: address,
      childrenIds: [validatedStudent.id],
      familyId,
      phoneNumber,
      email,
      pin // Store PIN instead of password
    } as any);
    
    toast.success('Account created successfully! Redirecting to login...');
    
    // Redirect to school-specific login page after 2 seconds
    setTimeout(() => {
      if (schoolCode) {
        navigate(`/school/${schoolCode}/parent-login`);
      } else {
        // Fallback: show message to contact school for login link
        toast.info('Please use the login link provided by your school to access your account.', { duration: 5000 });
        navigate('/');
      }
    }, 2000);
  };
  
  const handleCameraCapture = (imageData: string) => {
    setPhoto(imageData);
    setShowCamera(false);
    toast.success('Photo captured successfully!');
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }
    
    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPhoto(result);
      toast.success('Photo uploaded successfully!');
    };
    reader.onerror = () => {
      toast.error('Failed to upload photo. Please try again.');
    };
    reader.readAsDataURL(file);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-3 sm:p-4">
      <div className="max-w-2xl w-full">
        <button
          onClick={() => {
            if (schoolCode) {
              navigate(`/school/${schoolCode}/parent-login`);
            } else {
              navigate('/parent/login');
            }
          }}
          className="mb-4 sm:mb-6 flex items-center text-gray-600 hover:text-gray-900 text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Back to Login
        </button>

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div className="flex-1">
              <div className={`h-1.5 sm:h-2 rounded-full ${currentStep === 'student-id' ? 'bg-green-600' : 'bg-green-200'}`} />
              <p className="text-[10px] sm:text-xs mt-1.5 sm:mt-2 text-center font-medium">Student ID</p>
            </div>
            <div className="flex-1 ml-1.5 sm:ml-2">
              <div className={`h-1.5 sm:h-2 rounded-full ${currentStep === 'student-verification' || currentStep === 'parent-details' || currentStep === 'create-pin' ? 'bg-green-600' : 'bg-gray-200'}`} />
              <p className="text-[10px] sm:text-xs mt-1.5 sm:mt-2 text-center font-medium">Verify</p>
            </div>
            <div className="flex-1 ml-1.5 sm:ml-2">
              <div className={`h-1.5 sm:h-2 rounded-full ${currentStep === 'parent-details' || currentStep === 'create-pin' ? 'bg-green-600' : 'bg-gray-200'}`} />
              <p className="text-[10px] sm:text-xs mt-1.5 sm:mt-2 text-center font-medium">Details</p>
            </div>
            <div className="flex-1 ml-1.5 sm:ml-2">
              <div className={`h-1.5 sm:h-2 rounded-full ${currentStep === 'create-pin' ? 'bg-green-600' : 'bg-gray-200'}`} />
              <p className="text-[10px] sm:text-xs mt-1.5 sm:mt-2 text-center font-medium">PIN</p>
            </div>
          </div>

          {/* Step 1: Enter Student ID */}
          {currentStep === 'student-id' && (
            <div>
              <h1 className="text-3xl font-bold text-center mb-2">Parent Registration</h1>
              <p className="text-gray-600 text-center mb-8">
                Enter your child's Student ID to get started
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student ID
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="Enter Student ID"
                    onKeyPress={(e) => e.key === 'Enter' && handleValidateStudentId()}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    💡 You can get this ID from your school administrator
                  </p>
                </div>

                <button
                  onClick={handleValidateStudentId}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Student Verification */}
          {currentStep === 'student-verification' && validatedStudent && (
            <div>
              <h1 className="text-3xl font-bold text-center mb-2">Verify Student</h1>
              <p className="text-gray-600 text-center mb-8">
                Is this your child?
              </p>

              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-8">
                <div className="flex items-center gap-4">
                  <img
                    src={validatedStudent.image}
                    alt={validatedStudent.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">{validatedStudent.name}</h2>
                    <p className="text-gray-600">Class: {validatedStudent.class}</p>
                    <p className="text-gray-600">Age: {validatedStudent.age} years</p>
                    <p className="text-gray-600">Gender: {validatedStudent.gender}</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-center font-medium text-gray-700 mb-4">Select your role:</p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleRoleSelection('father')}
                    className="p-6 border-2 border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <div className="text-4xl mb-2">👨</div>
                    <p className="font-semibold">Father</p>
                  </button>
                  <button
                    onClick={() => handleRoleSelection('mother')}
                    className="p-6 border-2 border-gray-300 rounded-xl hover:border-pink-500 hover:bg-pink-50 transition-all"
                  >
                    <div className="text-4xl mb-2">👩</div>
                    <p className="font-semibold">Mother</p>
                  </button>
                </div>
              </div>

              <button
                onClick={() => setCurrentStep('student-id')}
                className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Not My Child - Go Back
              </button>
            </div>
          )}

          {/* Step 3: Parent Details */}
          {currentStep === 'parent-details' && (
            <div>
              <h1 className="text-3xl font-bold text-center mb-2">Your Details</h1>
              <p className="text-gray-600 text-center mb-8">
                Fill in your information as {parentRole === 'father' ? 'Father' : 'Mother'}
              </p>

              <form onSubmit={handleParentDetailsSubmit} className="space-y-6">
                {/* Photo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Photo *
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                    {photo ? (
                      <img src={photo} alt="Preview" className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-green-200 flex-shrink-0" />
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setShowCamera(true)}
                        className="px-4 sm:px-6 py-2.5 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap"
                      >
                        <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                        {photo ? 'Retake' : 'Take Photo'}
                      </button>
                      <label
                        htmlFor="photo-upload"
                        className="px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base whitespace-nowrap"
                      >
                        <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                        Upload Photo
                      </label>
                      <input
                        type="file"
                        id="photo-upload"
                        accept=".jpg,.jpeg,.png,.webp"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="e.g., +234 800 000 0000"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                </div>

                {/* Occupation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Occupation
                  </label>
                  <input
                    type="text"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="Enter your occupation"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    House Address *
                  </label>
                  <div className="relative">
                    <Home className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      placeholder="Enter your full address"
                      rows={3}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  Continue to PIN Setup
                </button>
                
                {/* Back Button */}
                <button
                  onClick={() => setCurrentStep('student-verification')}
                  className="w-full mt-4 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                >
                  ← Back to Verification
                </button>
              </form>
            </div>
          )}

          {/* Step 4: Create PIN */}
          {currentStep === 'create-pin' && (
            <div>
              <h1 className="text-3xl font-bold text-center mb-2">Create Your PIN</h1>
              <p className="text-gray-600 text-center mb-8">
                Create a 4-digit PIN to secure your account
              </p>

              <form onSubmit={handlePinSubmit} className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Important:</p>
                    <p>You'll use your Student ID and this PIN to login. Make sure you remember both!</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter 4-Digit PIN *
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]{4}"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-center text-2xl tracking-widest"
                    placeholder="••••"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm PIN *
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]{4}"
                    maxLength={4}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-center text-2xl tracking-widest"
                    placeholder="••••"
                    required
                  />
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-green-900 mb-2">✅ Your Login Credentials:</p>
                  <div className="space-y-1 text-sm text-green-800">
                    <p><strong>Student ID:</strong> {validatedStudent.id}</p>
                    <p><strong>PIN:</strong> {pin ? '••••' : '(not set yet)'}</p>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Create Account
                </button>
                
                {/* Back Button */}
                <button
                  type="button"
                  onClick={() => setCurrentStep('parent-details')}
                  className="w-full mt-4 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                >
                  ← Back to Details
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <p className="text-center mt-6 text-xs text-gray-500">
          Secured & Powered by <span className="font-semibold">Clocka</span>
        </p>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}