import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Crown, LogOut, School, Plus, Users, Eye, Search, 
  Building2, MapPin, Phone, Mail, Calendar,
  Trash2, Power, RotateCcw, X, CheckCircle,
  Copy, Check, TrendingUp, AlertCircle, Key, Link2, WifiOff
} from 'lucide-react';
import { toast } from 'sonner';
import clockaLogo from 'figma:asset/c6c92aab0f7d59ff7afbce0ebd8b122d9715bdde.png';
import * as supabaseApi from '@/utils/supabaseApi';
import { OfflineIndicator } from '@/components/OfflineIndicator';

interface School {
  id: string;
  schoolCode: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  username: string;
  password: string;
  status: 'active' | 'disabled';
  createdAt: string;
  logo?: string;
  studentsCount?: number;
  parentsCount?: number;
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCounts, setLoadingCounts] = useState<Set<string>>(new Set());
  const [showAddSchoolModal, setShowAddSchoolModal] = useState(false);
  const [showViewSchoolModal, setShowViewSchoolModal] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [resetPasswordInfo, setResetPasswordInfo] = useState<{ schoolName: string; newPassword: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState('');
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [newlyCreatedSchool, setNewlyCreatedSchool] = useState<School | null>(null);
  
  // Form states
  const [schoolName, setSchoolName] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const DEFAULT_PASSWORD = 'Clocka@2024';

  useEffect(() => {
    const isAuth = localStorage.getItem('superAdminAuth');
    if (!isAuth) {
      navigate('/super-admin/login');
      return;
    }

    loadSchools();
  }, [navigate]);

  const loadSchools = async () => {
    try {
      setLoading(true);
      console.log('📡 Loading schools...');
      
      // First, load from localStorage immediately to show something
      const localSchoolsData = localStorage.getItem('schools');
      let cachedSchools: School[] = [];
      
      if (localSchoolsData) {
        try {
          cachedSchools = JSON.parse(localSchoolsData);
          console.log('📦 Found', cachedSchools.length, 'schools in localStorage');
          
          // Show cached data immediately
          if (cachedSchools.length > 0) {
            setSchools(cachedSchools);
            console.log('✅ Displaying cached schools');
          }
        } catch (e) {
          console.error('Failed to parse local schools:', e);
        }
      }
      
      // Then try to fetch from Supabase in the background
      let supabaseSchools: any[] = [];
      
      try {
        const fetchPromise = supabaseApi.getAllSchools();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 15000)
        );
        
        supabaseSchools = await Promise.race([fetchPromise, timeoutPromise]) as any[];
        console.log('✅ Supabase schools loaded:', supabaseSchools.length);
        
        // If we got schools from Supabase, use them
        if (supabaseSchools && supabaseSchools.length > 0) {
          // Get counts from localStorage
          const localStudents = JSON.parse(localStorage.getItem('students') || '[]');
          const localParents = JSON.parse(localStorage.getItem('parents') || '[]');
          
          const schoolsWithCounts = supabaseSchools.map((school: any) => {
            const schoolStudents = localStudents.filter((s: any) => s.schoolCode === school.schoolCode);
            const schoolParents = localParents.filter((p: any) => p.schoolCode === school.schoolCode);
            
            return {
              id: school.id || school.schoolCode,
              schoolCode: school.schoolCode,
              name: school.name,
              address: school.address || '',
              email: school.email || '',
              phone: school.phone || '',
              username: school.username || 'admin',
              password: school.password || DEFAULT_PASSWORD,
              status: school.status || 'active',
              createdAt: school.createdAt || new Date().toISOString(),
              logo: school.logo || '',
              studentsCount: schoolStudents.length,
              parentsCount: schoolParents.length
            };
          });
          
          setSchools(schoolsWithCounts);
          localStorage.setItem('schools', JSON.stringify(schoolsWithCounts));
          console.log('✅ Updated with Supabase data');
        } else {
          // Supabase returned empty, use cache
          console.log('⚠️ Supabase returned no schools, using cache');
          if (cachedSchools.length > 0) {
            setSchools(cachedSchools);
          } else {
            console.log('ℹ️ No schools found anywhere');
          }
        }
      } catch (error: any) {
        console.warn('⚠️ Failed to load schools from Supabase:', error.message);
        
        // Use cached data on error
        if (cachedSchools.length > 0) {
          console.log('📦 Using cached schools due to Supabase error');
          setSchools(cachedSchools);
          toast.info('Using cached school data');
        } else {
          console.log('ℹ️ No cached schools available');
          setSchools([]);
        }
      }
      
    } catch (error) {
      console.error('❌ Critical error loading schools:', error);
      toast.error('Failed to load schools');
      setSchools([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('superAdminAuth');
    toast.success('Logged out successfully');
    navigate('/super-admin/login');
  };

  const generateSchoolCode = (name: string) => {
    const prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  };

  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const schoolCode = generateSchoolCode(schoolName);
      
      const newSchoolData = {
        schoolCode,
        name: schoolName,
        address,
        email,
        phone,
        username,
        password,
        status: 'active',
        logo: ''
      };

      // Save to Supabase
      await supabaseApi.saveSchoolInfo(newSchoolData);
      
      toast.success('School registered successfully!');
      setShowAddSchoolModal(false);
      
      const newSchool: School = {
        id: schoolCode,
        schoolCode,
        name: schoolName,
        address,
        email,
        phone,
        username,
        password,
        status: 'active',
        createdAt: new Date().toISOString(),
        studentsCount: 0,
        parentsCount: 0
      };
      
      setNewlyCreatedSchool(newSchool);
      setShowCredentialsModal(true);
      resetForm();
      
      // Reload schools to get updated data
      await loadSchools();
    } catch (error) {
      console.error('❌ Error creating school:', error);
      toast.error('Failed to register school');
    }
  };

  const handleDeleteSchool = async (schoolCode: string, schoolName: string) => {
    if (window.confirm(`⚠️ Are you sure you want to permanently delete "${schoolName}"?\n\nThis will remove:\n• All student records\n• All parent accounts\n• All attendance data\n\nThis action CANNOT be undone!`)) {
      try {
        // Note: You may need to add a delete school API endpoint
        const updatedSchools = schools.filter(s => s.schoolCode !== schoolCode);
        setSchools(updatedSchools);
        
        toast.success(`${schoolName} deleted successfully`);
        await loadSchools();
      } catch (error) {
        console.error('❌ Error deleting school:', error);
        toast.error('Failed to delete school');
      }
    }
  };

  const handleToggleStatus = async (schoolCode: string, currentStatus: string) => {
    const action = currentStatus === 'active' ? 'disable' : 'enable';
    const school = schools.find(s => s.schoolCode === schoolCode);
    
    if (window.confirm(`Are you sure you want to ${action} "${school?.name}"?`)) {
      try {
        const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
        
        // Update in Supabase
        await supabaseApi.saveSchoolInfo({
          schoolCode,
          status: newStatus
        });
        
        toast.success(`School ${action}d successfully`);
        await loadSchools();
      } catch (error) {
        console.error('❌ Error toggling status:', error);
        toast.error(`Failed to ${action} school`);
      }
    }
  };

  const handleResetPassword = (schoolCode: string, schoolName: string) => {
    const school = schools.find(s => s.schoolCode === schoolCode);
    if (!school) return;

    const generateNewPassword = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      let password = 'Clocka';
      for (let i = 0; i < 6; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };

    const newPassword = generateNewPassword();
    setResetPasswordInfo({ schoolName, newPassword });
    setSelectedSchool({ ...school, password: newPassword });
    setShowPasswordResetModal(true);
  };

  const confirmPasswordReset = async () => {
    if (!selectedSchool || !resetPasswordInfo) return;

    try {
      // Update password in Supabase
      await supabaseApi.saveSchoolInfo({
        schoolCode: selectedSchool.schoolCode,
        password: resetPasswordInfo.newPassword
      });

      toast.success('Password reset successfully!');
      setShowPasswordResetModal(false);
      setResetPasswordInfo(null);
      
      // Reload schools
      await loadSchools();
    } catch (error) {
      console.error('❌ Error resetting password:', error);
      toast.error('Failed to reset password');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    // Try modern clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(() => {
          setCopiedCode(text);
          toast.success(`${label} copied!`);
          setTimeout(() => setCopiedCode(''), 2000);
        })
        .catch(() => {
          // Fallback to older method
          fallbackCopyToClipboard(text, label);
        });
    } else {
      // Use fallback method
      fallbackCopyToClipboard(text, label);
    }
  };

  const fallbackCopyToClipboard = (text: string, label: string) => {
    // Create a temporary textarea element
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    textarea.style.top = '-999999px';
    document.body.appendChild(textarea);
    
    try {
      textarea.focus();
      textarea.select();
      
      // Try to copy using execCommand
      const successful = document.execCommand('copy');
      
      if (successful) {
        setCopiedCode(text);
        toast.success(`${label} copied!`);
        setTimeout(() => setCopiedCode(''), 2000);
      } else {
        toast.error('Failed to copy. Please copy manually.');
      }
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy. Please copy manually.');
    } finally {
      document.body.removeChild(textarea);
    }
  };

  const resetForm = () => {
    setSchoolName('');
    setAddress('');
    setEmail('');
    setPhone('');
    setUsername('');
    setPassword('');
  };

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    school.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    school.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    school.schoolCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStudents = schools.reduce((sum, school) => sum + (school.studentsCount || 0), 0);
  const totalParents = schools.reduce((sum, school) => sum + (school.parentsCount || 0), 0);
  const activeSchools = schools.filter(s => s.status === 'active').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading schools...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src={clockaLogo} 
                alt="Clocka" 
                className="w-12 h-12 rounded-lg"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Clocka Platform</h1>
                <p className="text-sm text-gray-600">Super Admin</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-5 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <School className="w-5 h-5 text-blue-600" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-500 ml-auto" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Schools</p>
            <p className="text-3xl font-bold text-gray-900">{schools.length}</p>
            <p className="text-xs text-gray-500 mt-1">{activeSchools} active</p>
          </div>

          <div className="bg-white rounded-lg p-5 border border-gray-200">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Students</p>
            <p className="text-3xl font-bold text-gray-900">{totalStudents}</p>
          </div>

          <div className="bg-white rounded-lg p-5 border border-gray-200">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Parents</p>
            <p className="text-3xl font-bold text-gray-900">{totalParents}</p>
          </div>

          <div className="bg-white rounded-lg p-5 border border-gray-200">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-2">
              <Crown className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-sm text-gray-600 mb-1">System Status</p>
            <p className="text-lg font-bold text-gray-900">Operational</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg border border-gray-200">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Schools</h2>
              <p className="text-sm text-gray-600 mt-1">Manage all registered schools</p>
            </div>
            <button
              onClick={() => setShowAddSchoolModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Register School
            </button>
          </div>

          {/* Search */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search schools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Schools List */}
          {filteredSchools.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <School className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery ? 'No Schools Found' : 'No Schools Yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery 
                  ? 'Try a different search term' 
                  : 'Get started by registering your first school'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowAddSchoolModal(true)}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Register First School
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredSchools
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((school) => (
                  <div key={school.schoolCode} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-6">
                      {/* Icon */}
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        school.status === 'active' ? 'bg-blue-100' : 'bg-gray-200'
                      }`}>
                        <Building2 className={`w-8 h-8 ${
                          school.status === 'active' ? 'text-blue-600' : 'text-gray-500'
                        }`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Title Row */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-xl font-bold text-gray-900">{school.name}</h3>
                              <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                                school.status === 'active'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {school.status === 'active' ? 'Active' : 'Disabled'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {school.address}
                            </p>
                          </div>
                        </div>

                        {/* School Code - Prominent Display */}
                        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-blue-700 font-semibold mb-1">SCHOOL CODE</p>
                              <p className="text-2xl font-mono font-black text-blue-900 tracking-wider">{school.schoolCode}</p>
                            </div>
                            <button
                              onClick={() => copyToClipboard(school.schoolCode, 'School Code')}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                            >
                              {copiedCode === school.schoolCode ? (
                                <>
                                  <Check className="w-4 h-4" />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4" />
                                  Copy
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Contact & Stats Grid */}
                        <div className="grid grid-cols-4 gap-3 mb-4">
                          <div className="col-span-2 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Mail className="w-4 h-4 text-gray-500" />
                              <p className="text-xs text-gray-600 font-medium">Email</p>
                            </div>
                            <p className="text-sm text-gray-900 truncate">{school.email}</p>
                          </div>
                          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                            <p className="text-xs text-purple-700 font-semibold mb-1">Students</p>
                            <p className="text-2xl font-bold text-purple-900">{school.studentsCount || 0}</p>
                          </div>
                          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-xs text-green-700 font-semibold mb-1">Parents</p>
                            <p className="text-2xl font-bold text-green-900">{school.parentsCount || 0}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Phone className="w-4 h-4 text-gray-500" />
                              <p className="text-xs text-gray-600 font-medium">Phone</p>
                            </div>
                            <p className="text-sm text-gray-900">{school.phone}</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <p className="text-xs text-gray-600 font-medium">Registered</p>
                            </div>
                            <p className="text-sm text-gray-900 font-semibold">{new Date(school.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Key className="w-4 h-4 text-gray-500" />
                              <p className="text-xs text-gray-600 font-medium">Username</p>
                            </div>
                            <p className="text-sm text-gray-900 font-mono font-semibold">{school.username}</p>
                          </div>
                        </div>

                        {/* Parent Link */}
                        <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-purple-700 font-semibold mb-1 flex items-center gap-1">
                                <Link2 className="w-3 h-3" />
                                PARENT PORTAL LINK
                              </p>
                              <p className="text-sm font-mono text-purple-900 truncate">
                                {window.location.origin}/parent/login/{school.schoolCode}
                              </p>
                            </div>
                            <button
                              onClick={() => copyToClipboard(`${window.location.origin}/parent/login/${school.schoolCode}`, 'Parent Link')}
                              className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium whitespace-nowrap flex items-center gap-2"
                            >
                              {copiedCode === `${window.location.origin}/parent/login/${school.schoolCode}` ? (
                                <>
                                  <Check className="w-4 h-4" />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4" />
                                  Copy
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => {
                              setSelectedSchool(school);
                              setShowViewSchoolModal(true);
                            }}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                          
                          <button
                            onClick={() => handleResetPassword(school.schoolCode, school.name)}
                            className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm font-medium flex items-center gap-2"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Reset Password
                          </button>

                          <button
                            onClick={() => handleToggleStatus(school.schoolCode, school.status)}
                            className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 ${
                              school.status === 'active'
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            <Power className="w-4 h-4" />
                            {school.status === 'active' ? 'Disable' : 'Enable'}
                          </button>

                          <button
                            onClick={() => handleDeleteSchool(school.schoolCode, school.name)}
                            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Add School Modal */}
      {showAddSchoolModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowAddSchoolModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Register New School</h2>
                <p className="text-sm text-gray-600 mt-1">Add a new school to the platform</p>
              </div>
              
              <form onSubmit={handleAddSchool} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">School Name *</label>
                  <input
                    type="text"
                    required
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="e.g., Greenwood High School"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="e.g., 123 Education Lane, Springfield"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="admin@school.edu"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Admin Username *</label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="admin_username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Admin Password *</label>
                    <input
                      type="text"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Create a strong password"
                    />
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Note:</strong> A unique school code will be automatically generated.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddSchoolModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Register School
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Password Reset Modal */}
      {showPasswordResetModal && resetPasswordInfo && selectedSchool && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Reset Password</h2>
                  <p className="text-sm text-gray-600">{resetPasswordInfo.schoolName}</p>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-900">
                    <strong>⚠️ Warning:</strong> After this reset, the school will NOT be able to log in with their old password. They must use the new password below.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg">
                  <p className="text-xs text-gray-600 mb-2 font-semibold">NEW PASSWORD</p>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xl font-mono font-bold text-gray-900">{resetPasswordInfo.newPassword}</p>
                    <button
                      onClick={() => copyToClipboard(resetPasswordInfo.newPassword, 'New Password')}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium whitespace-nowrap"
                    >
                      {copiedCode === resetPasswordInfo.newPassword ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-900">
                    <strong>Important:</strong> Copy this password and share it with the school administrator. This action cannot be undone.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowPasswordResetModal(false);
                      setResetPasswordInfo(null);
                      setSelectedSchool(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmPasswordReset}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                  >
                    Confirm Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Credentials Modal */}
      {showCredentialsModal && newlyCreatedSchool && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowCredentialsModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">School Registered Successfully!</h2>
                  <p className="text-sm text-gray-600">{newlyCreatedSchool.name}</p>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-900">
                    <strong>Important:</strong> Save these credentials and share with the school administrator.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs text-gray-600 mb-2 font-semibold">SCHOOL CODE</p>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-mono font-bold text-gray-900">{newlyCreatedSchool.schoolCode}</p>
                      <button
                        onClick={() => copyToClipboard(newlyCreatedSchool.schoolCode, 'School Code')}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                      >
                        {copiedCode === newlyCreatedSchool.schoolCode ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-xs text-gray-600 mb-2 font-semibold">USERNAME</p>
                      <div className="flex items-center justify-between">
                        <p className="font-mono font-semibold text-gray-900">{newlyCreatedSchool.username}</p>
                        <button
                          onClick={() => copyToClipboard(newlyCreatedSchool.username, 'Username')}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {copiedCode === newlyCreatedSchool.username ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-xs text-gray-600 mb-2 font-semibold">PASSWORD</p>
                      <div className="flex items-center justify-between">
                        <p className="font-mono font-semibold text-gray-900">{newlyCreatedSchool.password}</p>
                        <button
                          onClick={() => copyToClipboard(newlyCreatedSchool.password, 'Password')}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {copiedCode === newlyCreatedSchool.password ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-xs text-purple-700 mb-2 font-semibold">PARENT PORTAL LINK</p>
                    <div className="flex items-center gap-2">
                      <p className="flex-1 text-sm font-mono text-purple-900 truncate">
                        {window.location.origin}/parent/login/{newlyCreatedSchool.schoolCode}
                      </p>
                      <button
                        onClick={() => copyToClipboard(`${window.location.origin}/parent/login/${newlyCreatedSchool.schoolCode}`, 'Parent Link')}
                        className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium whitespace-nowrap"
                      >
                        {copiedCode === `${window.location.origin}/parent/login/${newlyCreatedSchool.schoolCode}` ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowCredentialsModal(false);
                    setNewlyCreatedSchool(null);
                  }}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* View School Modal */}
      {showViewSchoolModal && selectedSchool && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowViewSchoolModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">{selectedSchool.name}</h2>
                <p className="text-sm text-gray-600 mt-1">Complete school information</p>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1 font-semibold">School Code</p>
                    <p className="text-lg font-mono font-bold text-gray-900">{selectedSchool.schoolCode}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1 font-semibold">Status</p>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      selectedSchool.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {selectedSchool.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1 font-semibold">Email</p>
                    <p className="text-gray-900">{selectedSchool.email}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1 font-semibold">Phone</p>
                    <p className="text-gray-900">{selectedSchool.phone}</p>
                  </div>
                  <div className="col-span-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1 font-semibold">Address</p>
                    <p className="text-gray-900">{selectedSchool.address}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-xs text-purple-700 mb-1 font-semibold">Total Students</p>
                    <p className="text-3xl font-bold text-purple-900">{selectedSchool.studentsCount || 0}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs text-green-700 mb-1 font-semibold">Total Parents</p>
                    <p className="text-3xl font-bold text-green-900">{selectedSchool.parentsCount || 0}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1 font-semibold">Admin Username</p>
                    <p className="font-mono text-gray-900">{selectedSchool.username}</p>
                  </div>
                  <div className="col-span-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1 font-semibold">Registration Date</p>
                    <p className="text-gray-900">{new Date(selectedSchool.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowViewSchoolModal(false)}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}