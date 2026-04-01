import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Plus, Search, Edit2, Trash2, Eye, EyeOff, User, Mail, Phone, Camera, ArrowLeft, Copy, Check } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/app/components/ui/button';
import { toast } from 'sonner';
import { uploadToStorage } from '@/utils/uploadToStorage';
import type { SecurityPersonnel } from '@/contexts/DataContext';

export default function SecurityManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { securityPersonnel, addSecurityPersonnel, deleteSecurityPersonnel, updateSecurityPersonnel, loading } = useData();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState<SecurityPersonnel | null>(null);
  
  const schoolCode = sessionStorage.getItem('schoolCode') || localStorage.getItem('schoolCode') || '';

  // Check authentication and school code on mount and refresh
  useEffect(() => {
    if (!schoolCode) {
      toast.error('No school code found. Please login again.');
      navigate('/admin/dashboard');
      return;
    }
  }, [schoolCode, navigate]);

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading security management...</p>
        </div>
      </div>
    );
  }

  const filteredPersonnel = securityPersonnel.filter(person =>
    person.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (personnelId: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove ${name} from security personnel?`)) {
      deleteSecurityPersonnel(personnelId);
    }
  };

  const toggleActive = (person: SecurityPersonnel) => {
    updateSecurityPersonnel(person.id, { isActive: !person.isActive });
    toast.success(`${person.fullName} ${!person.isActive ? 'activated' : 'deactivated'}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button - Same format as AddStudent and AddParent */}
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>

        {/* Header Card */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Shield className="w-8 h-8 text-blue-600" />
                Security Management
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage security personnel with access to attendance and assignee logs
              </p>
            </div>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Security Personnel
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, username, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Personnel</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{securityPersonnel.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Active</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {securityPersonnel.filter(p => p.isActive).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Inactive</p>
                <p className="text-3xl font-bold text-gray-400 mt-2">
                  {securityPersonnel.filter(p => !p.isActive).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Personnel List */}
        {filteredPersonnel.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No personnel found' : 'No security personnel yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Add your first security personnel to start managing access'
              }
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-5 h-5 mr-2" />
                Add Security Personnel
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredPersonnel.map((person) => (
              <div
                key={person.id}
                className={`bg-white rounded-xl shadow-sm border-2 transition-all hover:shadow-md ${
                  person.isActive ? 'border-green-200' : 'border-gray-200'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Photo */}
                    <img
                      src={person.photo}
                      alt={person.fullName}
                      className="w-20 h-20 rounded-full object-cover border-4 border-gray-100"
                      onError={(e) => {
                        e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.fullName}`;
                      }}
                    />

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{person.fullName}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              person.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {person.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleActive(person)}
                            className={`p-2 rounded-lg transition-colors ${
                              person.isActive
                                ? 'hover:bg-gray-100 text-gray-600'
                                : 'hover:bg-green-50 text-green-600'
                            }`}
                            title={person.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {person.isActive ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                          <button
                            onClick={() => setEditingPersonnel(person)}
                            className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(person.id, person.fullName)}
                            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-2 mt-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="w-4 h-4" />
                          <span className="font-mono font-semibold">{person.username}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span>{person.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{person.phoneNumber}</span>
                        </div>
                      </div>

                      {/* Created Info */}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          Created {new Date(person.createdAt).toLocaleDateString()} by {person.createdBy}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingPersonnel) && (
        <AddEditSecurityModal
          personnel={editingPersonnel}
          schoolCode={schoolCode}
          createdBy={user?.email || 'Admin'}
          onClose={() => {
            setShowAddModal(false);
            setEditingPersonnel(null);
          }}
          onSave={(data) => {
            if (editingPersonnel) {
              updateSecurityPersonnel(editingPersonnel.id, data);
            } else {
              addSecurityPersonnel(data);
            }
            setShowAddModal(false);
            setEditingPersonnel(null);
          }}
        />
      )}
    </div>
  );
}

// Add/Edit Security Modal Component
interface AddEditSecurityModalProps {
  personnel: SecurityPersonnel | null;
  schoolCode: string;
  createdBy: string;
  onClose: () => void;
  onSave: (data: Omit<SecurityPersonnel, 'id' | 'createdAt'>) => void;
}

function AddEditSecurityModal({ personnel, schoolCode, createdBy, onClose, onSave }: AddEditSecurityModalProps) {
  const [formData, setFormData] = useState({
    fullName: personnel?.fullName || '',
    email: personnel?.email || '',
    phoneNumber: personnel?.phoneNumber || '',
    username: personnel?.username || '',
    password: personnel?.password || generatePassword(),
  });
  const [photo, setPhoto] = useState(personnel?.photo || '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState<'username' | 'password' | 'link' | null>(null);
  const [manualCredentials, setManualCredentials] = useState(!!personnel); // Allow manual if editing

  function generatePassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  function generateUsername(fullName: string) {
    const nameParts = fullName.trim().toLowerCase().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts[nameParts.length - 1] || '';
    const randomNum = Math.floor(Math.random() * 999);
    return `${firstName}.${lastName}${randomNum}`.replace(/[^a-z0-9.]/g, '');
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result as string);
      setPhotoFile(file);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      toast.error('Please enter full name');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }

    if (!formData.phoneNumber.trim()) {
      toast.error('Please enter phone number');
      return;
    }

    if (!photo && !personnel) {
      toast.error('Please upload a photo');
      return;
    }

    setIsSubmitting(true);

    try {
      let photoUrl = photo;

      // Upload new photo if changed
      if (photoFile) {
        toast.info('Uploading photo...');
        photoUrl = await uploadToStorage(photoFile, 'security-photos');
      }

      onSave({
        schoolCode,
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        username: formData.username || generateUsername(formData.fullName),
        password: formData.password,
        photo: photoUrl,
        isActive: personnel?.isActive ?? true,
        createdBy
      });

      toast.success(`Security personnel ${personnel ? 'updated' : 'created'} successfully`);
    } catch (error) {
      console.error('Error saving security personnel:', error);
      toast.error('Failed to save security personnel');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, type: 'username' | 'password' | 'link') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} copied!`);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 rounded-t-2xl z-10">
          <h2 className="text-2xl font-bold text-white">
            {personnel ? 'Edit Security Personnel' : 'Add Security Personnel'}
          </h2>
          <p className="text-blue-100 text-sm mt-1">
            Security personnel can access attendance logs and assignee information
          </p>
        </div>

        <div className="max-h-[calc(90vh-100px)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Photo *
              </label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  {photo ? (
                    <img
                      src={photo}
                      alt="Security"
                      className="w-24 h-24 rounded-full object-cover border-4 border-blue-200"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-gray-200 flex items-center justify-center">
                      <User className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
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
                  onChange={(e) => {
                    const newName = e.target.value;
                    setFormData({ 
                      ...formData, 
                      fullName: newName,
                      username: !manualCredentials && !formData.username ? generateUsername(newName) : formData.username
                    });
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter full name"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="email@example.com"
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="080XXXXXXXX"
                  required
                />
              </div>
            </div>

            {/* Login Credentials */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-blue-900 font-semibold">
                  <Shield className="w-5 h-5" />
                  <span>Login Credentials</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={manualCredentials}
                    onChange={(e) => setManualCredentials(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Manual Entry</span>
                </label>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Username
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                    placeholder={manualCredentials ? "Enter username" : "Auto-generated"}
                    readOnly={!manualCredentials}
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(formData.username, 'username')}
                    className="px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Copy username"
                  >
                    {copied === 'username' ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      readOnly={!manualCredentials}
                      className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                      placeholder={manualCredentials ? "Enter password" : "Auto-generated"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(formData.password, 'password')}
                    className="px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Copy password"
                  >
                    {copied === 'password' ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                  {!manualCredentials && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, password: generatePassword() })}
                      className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                      Regenerate
                    </button>
                  )}
                </div>
              </div>

              {/* Security Login Link */}
              <div className="bg-indigo-100 border-2 border-indigo-300 rounded-lg p-4">
                <p className="text-xs font-semibold text-indigo-900 mb-2">🔗 Security Login Link:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={`${window.location.origin}/school/${schoolCode}/security-login`}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border border-indigo-300 rounded text-xs font-mono text-indigo-900"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`${window.location.origin}/school/${schoolCode}/security-login`, 'link')}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    title="Copy link"
                  >
                    {copied === 'link' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-indigo-700 mt-2">
                  Share this link with the security personnel to access the security portal
                </p>
              </div>

              <p className="text-xs text-blue-700 bg-blue-100 p-3 rounded-lg">
                <strong>Note:</strong> Make sure to save these credentials securely. The security personnel will need them to log in.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 sticky bottom-0 bg-white pb-2">
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
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? 'Saving...' : personnel ? 'Update Personnel' : 'Create Personnel'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}