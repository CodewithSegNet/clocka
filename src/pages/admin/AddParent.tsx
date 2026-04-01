import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Camera, Upload, X, Copy, Check, Search } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { toast } from 'sonner';
import CameraCapture from '@/components/CameraCapture';
import ParentCredentialsModal from '@/components/ParentCredentialsModal';

export default function AddParent() {
  const navigate = useNavigate();
  const { addParent, students, parents } = useData();
  const [step, setStep] = useState(1);
  const [parentType, setParentType] = useState<'father' | 'mother'>('father');
  const [familyId] = useState(`FID${Date.now()}${Math.floor(Math.random() * 1000)}`); // Generate once for the family
  const [fatherData, setFatherData] = useState({
    name: '',
    gender: 'Male',
    occupation: '',
    residentialAddress: '',
    phoneNumber: '',
    email: '',
    childrenIds: [] as string[],
    photo: ''
  });
  const [motherData, setMotherData] = useState({
    name: '',
    gender: 'Female',
    occupation: '',
    residentialAddress: '',
    phoneNumber: '',
    email: '',
    childrenIds: [] as string[],
    photo: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showChildSelector, setShowChildSelector] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<{ 
    father?: { parentId: string; password: string }; 
    mother?: { parentId: string; password: string }; 
  }>({});
  const [photoPreview, setPhotoPreview] = useState<{ father?: string; mother?: string }>({});
  const [showCamera, setShowCamera] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [currentCredentials, setCurrentCredentials] = useState<any>(null);

  const getCurrentData = () => parentType === 'father' ? fatherData : motherData;
  const setCurrentData = (data: any) => parentType === 'father' ? setFatherData(data) : setMotherData(data);

  // Get all children IDs that are already assigned to other parents
  const getAssignedChildrenIds = () => {
    const assignedIds = new Set<string>();
    parents.forEach(parent => {
      parent.childrenIds.forEach(childId => assignedIds.add(childId));
    });
    
    // During family creation flow, allow same children for both father and mother
    // Remove children from current family creation from the assigned list
    if (fatherData.childrenIds.length > 0) {
      fatherData.childrenIds.forEach(id => assignedIds.delete(id));
    }
    if (motherData.childrenIds.length > 0) {
      motherData.childrenIds.forEach(id => assignedIds.delete(id));
    }
    
    return assignedIds;
  };

  const assignedChildrenIds = getAssignedChildrenIds();

  // Filter students: exclude those already assigned AND match search query
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const notAssigned = !assignedChildrenIds.has(s.id);
    return matchesSearch && notAssigned;
  });

  const handleChildToggle = (studentId: string) => {
    const current = getCurrentData();
    const newChildrenIds = current.childrenIds.includes(studentId)
      ? current.childrenIds.filter(id => id !== studentId)
      : [...current.childrenIds, studentId];
    
    setCurrentData({ ...current, childrenIds: newChildrenIds });
  };

  const handleSubmitParent = () => {
    const current = getCurrentData();
    if (!current.name || !current.occupation || !current.residentialAddress) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate photo upload
    if (!current.photo) {
      toast.error(`Please upload a photo of the ${parentType} before proceeding`);
      return;
    }
    
    // Combine children from both parents to ensure they're in the same family
    const allFamilyChildrenIds = Array.from(new Set([
      ...fatherData.childrenIds,
      ...motherData.childrenIds
    ]));
    
    // Warning if no children assigned to the entire family
    if (allFamilyChildrenIds.length === 0) {
      toast.warning(`No children assigned to this family. They will appear as parents without children in the family list.`, {
        duration: 4000
      });
    }

    const { parentId, password } = addParent({
      ...current,
      type: parentType,
      photo: current.photo,
      childrenIds: allFamilyChildrenIds, // Use combined children for family unit
      familyId: familyId // Same familyId for both parents
    });
    
    setGeneratedCredentials({ ...generatedCredentials, [parentType]: { parentId, password } });
    
    // Show credentials modal
    setCurrentCredentials({
      parentName: current.name,
      parentType: parentType,
      parentId,
      password
    });
    setShowCredentialsModal(true);
    
    toast.success(`${parentType === 'father' ? 'Father' : 'Mother'} profile created!`);
    
    // Don't change step yet - wait for modal to close
  };

  const handleSkip = () => {
    if (parentType === 'father') {
      setParentType('mother');
      setStep(2);
    } else {
      navigate('/admin/dashboard');
    }
  };

  const handleFinish = () => {
    navigate('/admin/dashboard');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPhotoPreview({ ...photoPreview, [parentType]: result });
        setCurrentData({ ...getCurrentData(), photo: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = (imageDataUrl: string) => {
    setPhotoPreview({ ...photoPreview, [parentType]: imageDataUrl });
    setCurrentData({ ...getCurrentData(), photo: imageDataUrl });
    setShowCamera(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Step {step} of 3</span>
              <span className="text-sm text-gray-600">
                {step === 1 ? 'Father Details' : step === 2 ? 'Mother Details' : 'Confirmation'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          {step < 3 ? (
            <>
              <h1 className="text-3xl mb-2">
                Add {parentType === 'father' ? 'Father' : 'Mother'} Profile
              </h1>
              <p className="text-gray-600 mb-6">
                Enter the {parentType === 'father' ? "father's" : "mother's"} information
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm mb-2 text-gray-700">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={getCurrentData().name}
                    onChange={(e) => setCurrentData({ ...getCurrentData(), name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    placeholder={`Enter ${parentType}'s full name`}
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-700">
                    Occupation *
                  </label>
                  <input
                    type="text"
                    value={getCurrentData().occupation}
                    onChange={(e) => setCurrentData({ ...getCurrentData(), occupation: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    placeholder="e.g., Software Engineer"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-700">
                    Residential Address *
                  </label>
                  <textarea
                    value={getCurrentData().residentialAddress}
                    onChange={(e) => setCurrentData({ ...getCurrentData(), residentialAddress: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    rows={3}
                    placeholder="Enter residential address"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={getCurrentData().phoneNumber}
                    onChange={(e) => setCurrentData({ ...getCurrentData(), phoneNumber: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={getCurrentData().email}
                    onChange={(e) => setCurrentData({ ...getCurrentData(), email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    placeholder="Enter email address"
                  />
                </div>

                {/* Photo Upload Section */}
                <div>
                  <label className="block text-sm mb-2 text-gray-700">
                    {parentType === 'father' ? "Father's" : "Mother's"} Photo
                  </label>
                  
                  {!photoPreview[parentType] ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                      <div className="text-center">
                        <div className="flex justify-center gap-4 mb-4">
                          <Camera className="w-12 h-12 text-gray-400" />
                          <Upload className="w-12 h-12 text-gray-400" />
                        </div>
                        <p className="text-gray-600 mb-4">Upload {parentType}'s photo</p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <button
                            type="button"
                            onClick={() => setShowCamera(true)}
                            className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2 text-sm"
                          >
                            <Camera className="w-4 h-4" />
                            Take Photo
                          </button>
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,.webp"
                              onChange={handlePhotoUpload}
                              className="hidden"
                            />
                            <div className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors inline-flex items-center gap-2">
                              <Upload className="w-4 h-4" />
                              Upload Photo
                            </div>
                          </label>
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                          Supported formats: JPG, PNG, WEBP (Max 5MB)
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative border-2 border-gray-300 rounded-lg p-4">
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoPreview({ ...photoPreview, [parentType]: undefined });
                          setCurrentData({ ...getCurrentData(), photo: '' });
                        }}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="flex flex-col items-center">
                        <img
                          src={photoPreview[parentType]}
                          alt={`${parentType} preview`}
                          className="w-48 h-48 object-cover rounded-lg mb-3"
                        />
                        <p className="text-sm text-gray-600">Photo uploaded successfully</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                  <p>⚠️ <strong>Photo is required!</strong> Please upload or take a photo of the {parentType} before submitting.</p>
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-700">
                    Attach Children
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowChildSelector(!showChildSelector)}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-left"
                  >
                    <p className="font-medium text-indigo-600">
                      {getCurrentData().childrenIds.length > 0
                        ? `${getCurrentData().childrenIds.length} children selected`
                        : 'Click to attach children'}
                    </p>
                  </button>

                  {getCurrentData().childrenIds.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {students.filter(s => getCurrentData().childrenIds.includes(s.id)).map(student => (
                        <div key={student.id} className="flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
                          <span className="text-sm">{student.name}</span>
                          <button
                            type="button"
                            onClick={() => handleChildToggle(student.id)}
                            className="hover:bg-indigo-200 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Child Selector Modal */}
                {showChildSelector && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                      <div className="p-6 border-b">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-xl">Select Children</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {filteredStudents.length} available • {assignedChildrenIds.size} already assigned
                            </p>
                          </div>
                          <button
                            onClick={() => setShowChildSelector(false)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search students..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                          />
                        </div>
                      </div>
                      <div className="p-6 overflow-y-auto max-h-[50vh]">
                        {filteredStudents.length === 0 && students.length > 0 && !searchQuery ? (
                          <div className="text-center py-8">
                              <p className="text-gray-600 mb-2">All students have been assigned to parents</p>
                              <p className="text-sm text-gray-500">No available students to assign</p>
                          </div>
                        ) : filteredStudents.length === 0 && searchQuery ? (
                          <div className="text-center py-8">
                              <p className="text-gray-600">No students found matching "{searchQuery}"</p>
                          </div>
                        ) : filteredStudents.length === 0 ? (
                          <div className="text-center py-8">
                              <p className="text-gray-600 mb-2">No students available</p>
                              <p className="text-sm text-gray-500">Please add students first</p>
                          </div>
                        ) : (
                          <div className="grid gap-3">
                              {filteredStudents.map(student => (
                                  <label
                                    key={student.id}
                                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={getCurrentData().childrenIds.includes(student.id)}
                                      onChange={() => handleChildToggle(student.id)}
                                      className="w-5 h-5 text-indigo-600 rounded"
                                    />
                                    <img
                                      src={student.image}
                                      alt={student.name}
                                      className="w-12 h-12 rounded-full bg-gray-200"
                                    />
                                    <div>
                                      <p className="font-medium">{student.name}</p>
                                      <p className="text-sm text-gray-600">{student.class} • Age {student.age}</p>
                                    </div>
                                  </label>
                              ))}
                          </div>
                        )}
                      </div>
                      <div className="p-6 border-t">
                        <button
                          onClick={() => setShowChildSelector(false)}
                          className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Done ({getCurrentData().childrenIds.length} selected)
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Skip {parentType === 'father' ? '& Add Mother' : 'Mother'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitParent}
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Save & Continue
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-3xl mb-2">Parents Created Successfully!</h1>
              <p className="text-gray-600 mb-8">
                Please save these credentials and share them with the parents
              </p>

              <div className="space-y-4 mb-8">
                {generatedCredentials.father && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="font-medium text-blue-900 mb-3">Father's Login Credentials</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-white px-3 py-2 rounded">
                        <div>
                          <p className="text-xs text-gray-600">Parent ID</p>
                          <p className="text-sm font-bold text-blue-900">{generatedCredentials.father.parentId}</p>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(generatedCredentials.father!.parentId);
                            toast.success('Parent ID copied!');
                          }}
                          className="p-2 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Copy className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between bg-white px-3 py-2 rounded">
                        <div>
                          <p className="text-xs text-gray-600">Password</p>
                          <p className="text-sm font-bold text-blue-900">{generatedCredentials.father.password}</p>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(generatedCredentials.father!.password);
                            toast.success('Password copied!');
                          }}
                          className="p-2 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Copy className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {generatedCredentials.mother && (
                  <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                    <p className="font-medium text-pink-900 mb-3">Mother's Login Credentials</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-white px-3 py-2 rounded">
                        <div>
                          <p className="text-xs text-gray-600">Parent ID</p>
                          <p className="text-sm font-bold text-pink-900">{generatedCredentials.mother.parentId}</p>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(generatedCredentials.mother!.parentId);
                            toast.success('Parent ID copied!');
                          }}
                          className="p-2 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Copy className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between bg-white px-3 py-2 rounded">
                        <div>
                          <p className="text-xs text-gray-600">Password</p>
                          <p className="text-sm font-bold text-pink-900">{generatedCredentials.mother.password}</p>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(generatedCredentials.mother!.password);
                            toast.success('Password copied!');
                          }}
                          className="p-2 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Copy className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Parents will use their Parent ID (not name) to log in. They can change their passwords after logging in for the first time.
                </p>
              </div>

              <button
                onClick={handleFinish}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Finish & Return to Dashboard
              </button>
            </>
          )}
        </div>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Credentials Modal */}
      {showCredentialsModal && currentCredentials && (
        <ParentCredentialsModal
          isOpen={showCredentialsModal}
          credentials={currentCredentials}
          onClose={() => {
            setShowCredentialsModal(false);
            setCurrentCredentials(null);
            
            // Now progress to next step after modal is closed
            if (currentCredentials.parentType === 'father') {
              setParentType('mother');
              setStep(2);
            } else {
              setStep(3);
            }
          }}
        />
      )}
    </div>
  );
}