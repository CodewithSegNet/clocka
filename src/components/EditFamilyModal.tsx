import React, { useState, useEffect } from 'react';
import { X, Camera, Upload, Search, UserPlus, Trash2 } from 'lucide-react';
import { Parent, Student } from '@/contexts/DataContext';
import { toast } from 'sonner';
import CameraCapture from '@/components/CameraCapture';

interface EditFamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  family: Parent[];
  children: Student[];
  allStudents: Student[];
  allParents?: Parent[];
  onSave: (updates: { parents: Parent[]; childrenIds: string[] }) => void;
}

export default function EditFamilyModal({ 
  isOpen, 
  onClose, 
  family, 
  children,
  allStudents,
  allParents = [],
  onSave 
}: EditFamilyModalProps) {
  const [fatherData, setFatherData] = useState<Parent | null>(
    family.find(p => p.type === 'father') || null
  );
  const [motherData, setMotherData] = useState<Parent | null>(
    family.find(p => p.type === 'mother') || null
  );
  const [selectedChildrenIds, setSelectedChildrenIds] = useState<string[]>(() => {
    // Get children IDs from the first parent in the family
    if (family && family.length > 0 && family[0].childrenIds) {
      return [...family[0].childrenIds];
    }
    // Fallback to children prop
    return children.map(c => c.id);
  });
  const [photoPreview, setPhotoPreview] = useState<{ father?: string; mother?: string }>(  {
    father: fatherData?.photo,
    mother: motherData?.photo
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showChildSelection, setShowChildSelection] = useState(children.length === 0);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraFor, setCameraFor] = useState<'father' | 'mother'>('father');

  // Reset state whenever the modal opens or family/children data changes
  useEffect(() => {
    if (isOpen) {
      // Reset parent data
      setFatherData(family.find(p => p.type === 'father') || null);
      setMotherData(family.find(p => p.type === 'mother') || null);
      
      // Reset children selection - use parent's childrenIds, not children prop
      if (family && family.length > 0 && family[0].childrenIds) {
        setSelectedChildrenIds([...family[0].childrenIds]);
      } else {
        setSelectedChildrenIds(children.map(c => c.id));
      }
      
      // Reset photo previews
      const father = family.find(p => p.type === 'father');
      const mother = family.find(p => p.type === 'mother');
      setPhotoPreview({
        father: father?.photo,
        mother: mother?.photo
      });
      
      // Reset search and child selection visibility
      setSearchQuery('');
      setShowChildSelection(children.length === 0);
    }
  }, [isOpen, family, children]);

  if (!isOpen) return null;

  // Get IDs of children already assigned to OTHER families
  const getOtherFamiliesChildrenIds = () => {
    const assignedIds = new Set<string>();
    const currentFamilyParentIds = family.map(p => p.id);
    
    // Safety check: ensure allParents is an array
    if (!allParents || !Array.isArray(allParents)) {
      return assignedIds;
    }
    
    allParents.forEach(parent => {
      // Skip parents from current family
      if (!currentFamilyParentIds.includes(parent.id)) {
        parent.childrenIds.forEach(childId => assignedIds.add(childId));
      }
    });
    
    return assignedIds;
  };

  const otherFamiliesChildrenIds = getOtherFamiliesChildrenIds();

  // Filter students: show current family's children + unassigned children
  const availableStudents = allStudents.filter(student => 
    !otherFamiliesChildrenIds.has(student.id)
  );

  // Filter by search query
  const filteredStudents = availableStudents.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.class.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePhotoUpload = (type: 'father' | 'mother', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPhotoPreview({ ...photoPreview, [type]: result });
        if (type === 'father' && fatherData) {
          setFatherData({ ...fatherData, photo: result });
        } else if (type === 'mother' && motherData) {
          setMotherData({ ...motherData, photo: result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = (imageDataUrl: string) => {
    setPhotoPreview({ ...photoPreview, [cameraFor]: imageDataUrl });
    if (cameraFor === 'father' && fatherData) {
      setFatherData({ ...fatherData, photo: imageDataUrl });
    } else if (cameraFor === 'mother' && motherData) {
      setMotherData({ ...motherData, photo: imageDataUrl });
    }
    setShowCamera(false);
  };

  const openCamera = (type: 'father' | 'mother') => {
    setCameraFor(type);
    setShowCamera(true);
  };

  const handleChildToggle = (childId: string) => {
    if (selectedChildrenIds.includes(childId)) {
      setSelectedChildrenIds(selectedChildrenIds.filter(id => id !== childId));
    } else {
      setSelectedChildrenIds([...selectedChildrenIds, childId]);
    }
  };

  const handleAddSpouse = (type: 'father' | 'mother') => {
    // Generate a temporary ID for the new parent
    const newParent: Parent = {
      id: `temp_${Date.now()}`,
      parentId: '', // Will be generated on save
      type,
      name: '',
      photo: '',
      gender: type === 'father' ? 'Male' : 'Female',
      occupation: '',
      residentialAddress: '',
      childrenIds: [],
      password: '' // Will be generated on save
    };

    if (type === 'father') {
      setFatherData(newParent);
    } else {
      setMotherData(newParent);
    }
    
    toast.success(`${type === 'father' ? 'Father' : 'Mother'} section added. Please fill in the details.`);
  };

  const handleRemoveParent = (type: 'father' | 'mother') => {
    const parentName = type === 'father' ? fatherData?.name : motherData?.name;
    
    // Check if this is the only parent - prevent removal
    if ((type === 'father' && !motherData) || (type === 'mother' && !fatherData)) {
      toast.error('Cannot remove the only parent. A family must have at least one parent.');
      return;
    }
    
    if (!confirm(`Are you sure you want to remove ${parentName || type} from this family? This action cannot be undone.`)) {
      return;
    }
    
    if (type === 'father') {
      setFatherData(null);
      setPhotoPreview({ ...photoPreview, father: '' });
    } else {
      setMotherData(null);
      setPhotoPreview({ ...photoPreview, mother: '' });
    }
    
    toast.success(`${type === 'father' ? 'Father' : 'Mother'} removed from family`);
  };

  const handleSave = () => {
    const updatedParents: Parent[] = [];
    
    // Ensure at least one parent exists
    if (!fatherData && !motherData) {
      toast.error('A family must have at least one parent. Please add a father or mother.');
      return;
    }
    
    console.log('EditFamilyModal handleSave called');
    console.log('Selected children IDs:', selectedChildrenIds);
    console.log('Father data:', fatherData);
    console.log('Mother data:', motherData);
    
    if (fatherData) {
      if (!fatherData.name || !fatherData.occupation || !fatherData.residentialAddress) {
        toast.error('Please fill in all father details');
        return;
      }
      const fatherWithChildren = { ...fatherData, childrenIds: selectedChildrenIds };
      console.log('Adding father with children:', fatherWithChildren);
      updatedParents.push(fatherWithChildren);
    }
    
    if (motherData) {
      if (!motherData.name || !motherData.occupation || !motherData.residentialAddress) {
        toast.error('Please fill in all mother details');
        return;
      }
      const motherWithChildren = { ...motherData, childrenIds: selectedChildrenIds };
      console.log('Adding mother with children:', motherWithChildren);
      updatedParents.push(motherWithChildren);
    }

    // Validate that selected children are not assigned to other families
    const currentFamilyParentIds = family.map(p => p.id);
    const conflictingChildren: string[] = [];
    
    selectedChildrenIds.forEach(childId => {
      allParents.forEach(parent => {
        // Skip parents from current family
        if (currentFamilyParentIds.includes(parent.id)) return;
        
        // Check if this child is assigned to another parent
        if (parent.childrenIds.includes(childId)) {
          const child = allStudents.find(s => s.id === childId);
          if (child && !conflictingChildren.includes(child.name)) {
            conflictingChildren.push(child.name);
          }
        }
      });
    });

    // If there are conflicts, show error and prevent save
    if (conflictingChildren.length > 0) {
      toast.error(
        `Cannot save: ${conflictingChildren.join(', ')} ${conflictingChildren.length === 1 ? 'is' : 'are'} already assigned to another family. Please unassign ${conflictingChildren.length === 1 ? 'this child' : 'these children'} from the other family first.`,
        { duration: 5000 }
      );
      return;
    }

    onSave({ parents: updatedParents, childrenIds: selectedChildrenIds });
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Edit Family</h2>
              <p className="text-sm text-gray-600 mt-1">Update parent and children information</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Father Section */}
            {fatherData && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-4">👨 Father Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm mb-2 text-gray-700">Photo</label>
                    {photoPreview.father ? (
                      <div className="relative inline-block">
                        <img
                          src={photoPreview.father}
                          alt="Father"
                          className="w-24 h-24 rounded-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoPreview({ ...photoPreview, father: '' });
                            setFatherData({ ...fatherData, photo: '' });
                          }}
                          className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openCamera('father')}
                          className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2 text-sm"
                        >
                          <Camera className="w-4 h-4" />
                          Take Photo
                        </button>
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp"
                            onChange={(e) => handlePhotoUpload('father', e)}
                            className="hidden"
                          />
                          <div className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors inline-flex items-center gap-2 text-sm">
                            <Upload className="w-4 h-4" />
                            Upload
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-gray-700">Parent ID</label>
                    <input
                      type="text"
                      value={fatherData.parentId || 'Will be generated'}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-gray-700">Full Name *</label>
                    <input
                      type="text"
                      value={fatherData.name}
                      onChange={(e) => setFatherData({ ...fatherData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-gray-700">Occupation *</label>
                    <input
                      type="text"
                      value={fatherData.occupation}
                      onChange={(e) => setFatherData({ ...fatherData, occupation: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-gray-700">Phone Number</label>
                    <input
                      type="tel"
                      value={fatherData.phoneNumber || ''}
                      onChange={(e) => setFatherData({ ...fatherData, phoneNumber: e.target.value })}
                      placeholder="+234 xxx xxx xxxx"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-gray-700">Email</label>
                    <input
                      type="email"
                      value={fatherData.email || ''}
                      onChange={(e) => setFatherData({ ...fatherData, email: e.target.value })}
                      placeholder="email@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm mb-2 text-gray-700">Residential Address *</label>
                    <textarea
                      value={fatherData.residentialAddress}
                      onChange={(e) => setFatherData({ ...fatherData, residentialAddress: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      rows={2}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => handleRemoveParent('father')}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium inline-flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove Father
                  </button>
                </div>
              </div>
            )}

            {/* Mother Section */}
            {motherData && (
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                <h3 className="font-semibold text-pink-900 mb-4">👩 Mother Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm mb-2 text-gray-700">Photo</label>
                    {photoPreview.mother ? (
                      <div className="relative inline-block">
                        <img
                          src={photoPreview.mother}
                          alt="Mother"
                          className="w-24 h-24 rounded-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoPreview({ ...photoPreview, mother: '' });
                            setMotherData({ ...motherData, photo: '' });
                          }}
                          className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openCamera('mother')}
                          className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2 text-sm"
                        >
                          <Camera className="w-4 h-4" />
                          Take Photo
                        </button>
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp"
                            onChange={(e) => handlePhotoUpload('mother', e)}
                            className="hidden"
                          />
                          <div className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors inline-flex items-center gap-2 text-sm">
                            <Upload className="w-4 h-4" />
                            Upload
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-gray-700">Parent ID</label>
                    <input
                      type="text"
                      value={motherData.parentId || 'Will be generated'}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-gray-700">Full Name *</label>
                    <input
                      type="text"
                      value={motherData.name}
                      onChange={(e) => setMotherData({ ...motherData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-gray-700">Occupation *</label>
                    <input
                      type="text"
                      value={motherData.occupation}
                      onChange={(e) => setMotherData({ ...motherData, occupation: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-gray-700">Phone Number</label>
                    <input
                      type="tel"
                      value={motherData.phoneNumber || ''}
                      onChange={(e) => setMotherData({ ...motherData, phoneNumber: e.target.value })}
                      placeholder="+234 xxx xxx xxxx"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-gray-700">Email</label>
                    <input
                      type="email"
                      value={motherData.email || ''}
                      onChange={(e) => setMotherData({ ...motherData, email: e.target.value })}
                      placeholder="email@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm mb-2 text-gray-700">Residential Address *</label>
                    <textarea
                      value={motherData.residentialAddress}
                      onChange={(e) => setMotherData({ ...motherData, residentialAddress: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      rows={2}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => handleRemoveParent('mother')}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium inline-flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove Mother
                  </button>
                </div>
              </div>
            )}

            {/* Add Father/Mother Buttons */}
            {!fatherData && (
              <button
                onClick={() => handleAddSpouse('father')}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium inline-flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Add Father
              </button>
            )}
            {!motherData && (
              <button
                onClick={() => handleAddSpouse('mother')}
                className="w-full px-4 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm font-medium inline-flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Add Mother
              </button>
            )}

            {/* Children Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Assigned Children</h3>
                {selectedChildrenIds.length === 0 && (
                  <button
                    onClick={() => setShowChildSelection(!showChildSelection)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium inline-flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Assign Child
                  </button>
                )}
              </div>

              {selectedChildrenIds.length > 0 || showChildSelection ? (
                <>
                  {/* Search Input */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search children by name or class..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                    />
                  </div>

                  {/* Children List */}
                  <div className="grid gap-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                    {availableStudents.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>No children available to assign</p>
                        <p className="text-sm mt-1">All students are already assigned to other families</p>
                      </div>
                    ) : filteredStudents.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>No children found matching "{searchQuery}"</p>
                      </div>
                    ) : (
                      filteredStudents.map((student) => (
                        <label
                          key={student.id}
                          className="flex items-center gap-3 p-2 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={selectedChildrenIds.includes(student.id)}
                            onChange={() => handleChildToggle(student.id)}
                            className="w-4 h-4 text-indigo-600 rounded"
                          />
                          <img
                            src={student.image}
                            alt={student.name}
                            className="w-10 h-10 rounded-full bg-gray-200 object-cover"
                          />
                          <div>
                            <p className="font-medium text-sm">{student.name}</p>
                            <p className="text-xs text-gray-600">{student.class} • Age {student.age}</p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mt-2">
                    {selectedChildrenIds.length} {selectedChildrenIds.length === 1 ? 'child' : 'children'} selected
                  </p>
                </>
              ) : (
                <div className="text-center py-8 border border-gray-200 rounded-lg bg-gray-50">
                  <p className="text-gray-500">No children assigned to this family</p>
                  <p className="text-sm text-gray-400 mt-1">Click "Assign Child" to add children</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </>
  );
}