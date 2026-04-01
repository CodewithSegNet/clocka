import React, { useState } from 'react';
import { X, Save, User, Calendar, Hash, School, Camera, Upload } from 'lucide-react';
import { toast } from 'sonner';
import CameraCapture from '@/components/CameraCapture';
import { useData } from '@/contexts/DataContext';

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: {
    id: string;
    name: string;
    age: number;
    class: string;
    gender: string;
    image: string;
  };
  onSave: (updatedStudent: any) => void;
}

export default function EditStudentModal({ isOpen, onClose, student, onSave }: EditStudentModalProps) {
  const { classes } = useData();
  const [formData, setFormData] = useState({
    name: student?.name || '',
    age: student?.age || '',
    class: student?.class || '',
    gender: student?.gender || '',
    image: student?.image || '',
  });
  const [showCamera, setShowCamera] = useState(false);

  if (!isOpen || !student) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size must be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFormData({ ...formData, image: result });
        toast.success('Profile picture updated');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = (imageDataUrl: string) => {
    setFormData({ ...formData, image: imageDataUrl });
    setShowCamera(false);
    toast.success('Profile picture captured');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error('Please enter student name');
      return;
    }
    if (!formData.age || formData.age < 1 || formData.age > 100) {
      toast.error('Please enter a valid age (1-100)');
      return;
    }
    if (!formData.class.trim()) {
      toast.error('Please enter student class');
      return;
    }
    if (!formData.gender) {
      toast.error('Please select gender');
      return;
    }

    // Save updated student
    const updatedStudent = {
      ...student,
      ...formData,
      age: Number(formData.age),
    };
    
    onSave(updatedStudent);
    toast.success(`${formData.name}'s information updated successfully`);
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
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 flex items-center justify-between z-10">
            <div>
              <h2 className="text-2xl font-bold text-white">Edit Student</h2>
              <p className="text-indigo-100 text-sm mt-1">Update student information</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            {/* Student Photo */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Student Photo
              </label>
              
              <div className="flex justify-center">
                {!formData.image ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 w-full max-w-md">
                    <div className="text-center">
                      <div className="flex justify-center gap-4 mb-4">
                        <Camera className="w-12 h-12 text-gray-400" />
                        <Upload className="w-12 h-12 text-gray-400" />
                      </div>
                      <p className="text-gray-600 mb-4">Upload student's photo</p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                          type="button"
                          onClick={() => setShowCamera(true)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2 text-sm"
                        >
                          <Camera className="w-4 h-4" />
                          Take Photo
                        </button>
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          <div className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors inline-flex items-center gap-2 text-sm">
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
                  <div className="relative">
                    <img
                      src={formData.image}
                      alt="Student"
                      className="w-32 h-32 rounded-full object-cover border-4 border-indigo-100 shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, image: '' });
                        toast.info('Photo removed');
                      }}
                      className="absolute -top-1 -right-1 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-600" />
                    Full Name *
                  </div>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Enter student's full name"
                />
              </div>

              {/* Age */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    Age *
                  </div>
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Enter student's age"
                  min="1"
                  max="100"
                />
              </div>

              {/* Class */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <School className="w-4 h-4 text-indigo-600" />
                    Class *
                  </div>
                </label>
                <select
                  value={formData.class}
                  onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                  className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none appearance-none bg-white"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                    backgroundPosition: 'right 0.75rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                  }}
                >
                  <option value="">Select a class</option>
                  {classes.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-indigo-600" />
                    Gender *
                  </div>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: 'Male' })}
                    className={`px-4 py-3 rounded-lg border-2 transition-all font-medium ${
                      formData.gender === 'Male'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: 'Female' })}
                    className={`px-4 py-3 rounded-lg border-2 transition-all font-medium ${
                      formData.gender === 'Female'
                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    Female
                  </button>
                </div>
              </div>

              {/* Student ID (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student ID (Cannot be changed)
                </label>
                <input
                  type="text"
                  value={student.id}
                  disabled
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Info Message */}
            <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <p className="text-sm text-indigo-700">
                💡 <span className="font-semibold">Note:</span> Changes will be saved immediately. Make sure all information is correct before saving.
              </p>
            </div>
          </form>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
            <button
              onClick={onClose}
              type="button"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Camera Capture Modal */}
      {showCamera && (
        <CameraCapture
          onClose={() => setShowCamera(false)}
          onCapture={handleCameraCapture}
        />
      )}
    </>
  );
}