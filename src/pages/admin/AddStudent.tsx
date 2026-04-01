import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Camera, Upload, X } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import CameraCapture from '@/components/CameraCapture';

export default function AddStudent() {
  const navigate = useNavigate();
  const { addStudent, classes } = useData();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    class: '',
    gender: 'Male' as 'Male' | 'Female',
    image: ''
  });
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [uploadMethod, setUploadMethod] = useState<'upload' | 'camera' | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  // Debug: Log classes when component mounts or classes change
  React.useEffect(() => {
    console.log('🎓 AddStudent - Classes from context:', classes);
    console.log('🎓 AddStudent - Classes length:', classes.length);
  }, [classes]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPhotoPreview(result);
        setFormData({ ...formData, image: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = (imageDataUrl: string) => {
    setPhotoPreview(imageDataUrl);
    setFormData({ ...formData, image: imageDataUrl });
    setShowCamera(false);
  };

  const removePhoto = () => {
    setPhotoPreview('');
    setFormData({ ...formData, image: '' });
    setUploadMethod(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate photo upload
    if (!formData.image) {
      alert('❌ Please upload a photo of the student before proceeding.');
      return;
    }
    
    addStudent({
      ...formData,
      age: parseInt(formData.age),
      image: formData.image
    });
    
    navigate('/admin/dashboard');
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
          <h1 className="text-3xl mb-6">Add New Student</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm mb-2 text-gray-700">
                Student Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="Enter student's full name"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2 text-gray-700">
                  Age *
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Age"
                  min="3"
                  max="18"
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-gray-700">
                  Class *
                </label>
                {classes.length === 0 ? (
                  <div className="w-full px-4 py-3 border border-orange-300 bg-orange-50 rounded-lg text-sm text-orange-700">
                    ⚠️ No classes set up yet. Please go to <strong>School Setup</strong> tab to configure classes.
                  </div>
                ) : (
                  <select
                    value={formData.class}
                    onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                    className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none appearance-none bg-white"
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
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2 text-gray-700">
                Gender *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="Male"
                    checked={formData.gender === 'Male'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Male' | 'Female' })}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span>Male</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="Female"
                    checked={formData.gender === 'Female'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Male' | 'Female' })}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span>Female</span>
                </label>
              </div>
            </div>

            {/* Photo Upload Section */}
            <div>
              <label className="block text-sm mb-2 text-gray-700">
                Student Photo
              </label>
              
              {!photoPreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
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
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
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
                    onClick={removePhoto}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex flex-col items-center">
                    <img
                      src={photoPreview}
                      alt="Student preview"
                      className="w-48 h-48 object-cover rounded-lg mb-3"
                    />
                    <p className="text-sm text-gray-600">Photo uploaded successfully</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              <p>⚠️ <strong>Photo is required!</strong> Please upload or take a photo before submitting the form.</p>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/admin/dashboard')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Add Student
              </button>
            </div>
          </form>
        </div>
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