import React, { useState } from 'react';
import { X, Upload, User, Phone, CreditCard, Clock, AlertCircle, Camera } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { useData } from '@/contexts/DataContext';
import { toast } from 'sonner';
import { uploadToStorage } from '@/utils/uploadToStorage';
import { AssigneeCredentialsModal } from '@/app/components/AssigneeCredentialsModal';
import type { Parent, Student, Assignee } from '@/contexts/DataContext';

interface AssignSomeoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  parent: Parent;
  children: Student[];
}

export function AssignSomeoneModal({ isOpen, onClose, parent, children }: AssignSomeoneModalProps) {
  const { addAssignee } = useData();
  
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    idType: 'NIN' as 'NIN' | 'Drivers License' | 'Passport',
    idNumber: '',
    durationHours: 1
  });
  
  const [assigneePhoto, setAssigneePhoto] = useState<string>('');
  const [assigneePhotoFile, setAssigneePhotoFile] = useState<File | null>(null);
  const [idPhoto, setIdPhoto] = useState<string>('');
  const [idPhotoFile, setIdPhotoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [createdAssignee, setCreatedAssignee] = useState<Assignee | null>(null);
  const [createdAccessCode, setCreatedAccessCode] = useState('');
  const [selectedChildrenIds, setSelectedChildrenIds] = useState<string[]>([]);

  // Debug logging
  console.log('🎭 [AssignSomeoneModal] Render:', {
    isOpen,
    hasParent: !!parent,
    parentName: parent?.name,
    childrenCount: children?.length || 0,
    isSubmitting
  });

  if (!isOpen) {
    console.log('🎭 [AssignSomeoneModal] Not open, returning null');
    return null;
  }
  
  // Add safety checks for parent and children
  if (!parent) {
    console.error('🎭 [AssignSomeoneModal] ERROR: parent is null or undefined');
    return null;
  }
  
  if (!children || children.length === 0) {
    console.warn('🎭 [AssignSomeoneModal] No children found, showing error message');
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-4">No Children Found</h2>
            <p className="text-gray-600 mb-6">
              You need to have at least one child registered to assign someone.
            </p>
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  console.log('✅ [AssignSomeoneModal] Rendering full modal form');

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'assignee' | 'id') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (type === 'assignee') {
        setAssigneePhoto(result);
        setAssigneePhotoFile(file);
      } else {
        setIdPhoto(result);
        setIdPhotoFile(file);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.fullName.trim()) {
      toast.error('Please enter full name');
      return;
    }
    
    if (!formData.phoneNumber.trim()) {
      toast.error('Please enter phone number');
      return;
    }
    
    if (!formData.idNumber.trim()) {
      toast.error('Please enter ID number');
      return;
    }
    
    if (!assigneePhotoFile) {
      toast.error('Please upload assignee photo');
      return;
    }
    
    if (!idPhotoFile) {
      toast.error('Please upload ID card photo');
      return;
    }
    
    if (formData.durationHours < 1 || formData.durationHours > 24) {
      toast.error('Duration must be between 1 and 24 hours');
      return;
    }
    
    if (selectedChildrenIds.length === 0) {
      toast.error('Please select at least one child');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload images to Supabase Storage
      toast.info('Uploading photos...');
      
      const assigneePhotoUrl = await uploadToStorage(assigneePhotoFile, 'assignee-photos');
      const idPhotoUrl = await uploadToStorage(idPhotoFile, 'id-cards');
      
      toast.success('Photos uploaded successfully');
      
      const expiresAt = new Date(Date.now() + formData.durationHours * 60 * 60 * 1000);
      
      const result = addAssignee({
        parentId: parent.parentId,
        parentName: parent.name,
        parentEmail: parent.email,
        parentPhone: parent.phoneNumber,
        parentPhoto: parent.photo, // Include parent's photo for display in attendance logs
        familyId: parent.familyId,
        childrenIds: selectedChildrenIds,
        fullName: formData.fullName.trim(),
        photo: assigneePhotoUrl, // Use Storage URL instead of base64
        phoneNumber: formData.phoneNumber.trim(),
        idType: formData.idType,
        idNumber: formData.idNumber.trim(),
        idPhoto: idPhotoUrl, // Use Storage URL instead of base64
        expiresAt,
        isActive: true,
        schoolCode: parent.schoolCode || ''
      });

      console.log('✅ [MODAL] Assignee created with full data:', result);
      console.log('🔑 [MODAL] Access code generated:', result.accessCode);
      console.log('📸 [MODAL] Assignee photo URL:', result.photo);
      console.log('🪪 [MODAL] ID photo URL:', result.idPhoto);

      toast.success('Assignee created successfully!', {
        description: `Access Code: ${result.accessCode}`,
        duration: 10000
      });

      // Reset form
      setFormData({
        fullName: '',
        phoneNumber: '',
        idType: 'NIN',
        idNumber: '',
        durationHours: 1
      });
      setAssigneePhoto('');
      setAssigneePhotoFile(null);
      setIdPhoto('');
      setIdPhotoFile(null);
      setSelectedChildrenIds([]);
      
      // Show credentials modal immediately with full assignee data
      setCreatedAssignee(result);
      setCreatedAccessCode(result.accessCode);
      setShowCredentialsModal(true);
      
      // Don't close yet - let credentials modal handle the flow
    } catch (error) {
      console.error('Error creating assignee:', error);
      toast.error('Failed to create assignee');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header - Fixed at top with higher z-index */}
        <div className="relative z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Assign Someone to Pick Up</h2>
            <p className="text-sm text-gray-500 mt-1">Maximum duration: 24 hours</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Alert */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold">Important Notice</p>
                <p className="mt-1">
                  For access beyond 24 hours or permanent arrangements, please contact school administration.
                </p>
              </div>
            </div>

            {/* Assignee Photo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Assignee Photo *
              </label>
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative">
                  {assigneePhoto ? (
                    <img
                      src={assigneePhoto}
                      alt="Assignee"
                      className="w-24 h-24 rounded-full object-cover border-4 border-emerald-200"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-gray-200 flex items-center justify-center">
                      <User className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 bg-emerald-600 text-white p-2 rounded-full cursor-pointer hover:bg-emerald-700 transition-colors shadow-lg">
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={(e) => handlePhotoUpload(e, 'assignee')}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-sm font-medium text-gray-700">Upload clear photo</p>
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG (Max 5MB)</p>
                </div>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="Enter full name as on ID"
                  required
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="080XXXXXXXX"
                  required
                />
              </div>
            </div>

            {/* ID Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Government ID Type *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['NIN', 'Drivers License', 'Passport'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, idType: type })}
                    className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      formData.idType === type
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* ID Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ID Number *
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.idNumber}
                  onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="Enter ID number"
                  required
                />
              </div>
            </div>

            {/* ID Photo Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Upload ID Card Photo *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-500 transition-colors">
                {idPhoto ? (
                  <div className="space-y-3">
                    <img
                      src={idPhoto}
                      alt="ID Card"
                      className="max-h-48 mx-auto rounded-lg shadow-md"
                    />
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg cursor-pointer hover:bg-emerald-700 transition-colors">
                      <Upload className="w-4 h-4" />
                      Change Photo
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp"
                        onChange={(e) => handlePhotoUpload(e, 'id')}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-700">Click to upload ID card photo</p>
                    <p className="text-xs text-gray-500 mt-1">Clear photo showing ID details</p>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={(e) => handlePhotoUpload(e, 'id')}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Access Duration (Hours) *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={formData.durationHours}
                  onChange={(e) => setFormData({ ...formData, durationHours: parseInt(e.target.value) || 1 })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Access will expire in {formData.durationHours} hour{formData.durationHours !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Children Selection */}
            <div className={`rounded-lg p-4 border-2 transition-colors ${
              selectedChildrenIds.length === 0 
                ? 'bg-red-50 border-red-300' 
                : 'bg-emerald-50 border-emerald-300'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-900">
                  Select Children to Assign * 
                  {selectedChildrenIds.length > 0 && (
                    <span className="ml-2 text-emerald-600">
                      ({selectedChildrenIds.length} selected)
                    </span>
                  )}
                </p>
                {children.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedChildrenIds.length === children.length) {
                        setSelectedChildrenIds([]);
                      } else {
                        setSelectedChildrenIds(children.map(c => c.id));
                      }
                    }}
                    className="text-xs font-medium text-emerald-600 hover:text-emerald-700 underline"
                  >
                    {selectedChildrenIds.length === children.length ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>
              
              {selectedChildrenIds.length === 0 && (
                <p className="text-xs text-red-600 mb-3 font-medium">
                  ⚠️ Please select at least one child for this assignee
                </p>
              )}
              
              <div className="space-y-2">
                {children.map((child) => {
                  const isSelected = selectedChildrenIds.includes(child.id);
                  return (
                    <label
                      key={child.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border-2 ${
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
                        className="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div className="flex items-center gap-3 flex-1">
                        <img
                          src={child.image}
                          alt={child.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                          onError={(e) => {
                            e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${child.name}`;
                          }}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">{child.name}</p>
                          <p className="text-xs text-gray-600">{child.class} • {child.age} yrs</p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="bg-emerald-600 text-white rounded-full p-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? 'Creating...' : 'Create Assignee'}
              </Button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Credentials Modal */}
      {showCredentialsModal && createdAssignee && (
        <AssigneeCredentialsModal
          assignee={createdAssignee}
          parentName={parent.name}
          parentPhoto={parent.photo || ''}
          schoolCode={parent.schoolCode || ''}
          children={children.filter(child => createdAssignee.childrenIds.includes(child.id))}
          onClose={() => {
            setShowCredentialsModal(false);
            setCreatedAssignee(null);
            setCreatedAccessCode('');
          }}
          onFinalClose={onClose}
        />
      )}
    </div>
  );
}