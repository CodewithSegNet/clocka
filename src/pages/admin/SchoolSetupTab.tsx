import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  School, Clock, MapPin, Camera, Phone, Mail, Globe, User, Building2,
  Plus, X, BookOpen, Palette, ImageIcon, Save, Navigation, CheckCircle, GripVertical,
  AlertCircle, Target, Link, Copy, Eye, EyeOff, Key, Lock
} from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import * as supabaseApi from '@/utils/supabaseApi';

// Draggable Class Item Component
interface DraggableClassItemProps {
  className: string;
  index: number;
  moveClass: (dragIndex: number, hoverIndex: number) => void;
  onRemove: (className: string) => void;
}

const DraggableClassItem: React.FC<DraggableClassItemProps> = ({ className, index, moveClass, onRemove }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'CLASS_ITEM',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'CLASS_ITEM',
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveClass(item.index, index);
        item.index = index;
      }
    },
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`group flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-900 rounded-lg border-2 border-purple-300 cursor-move hover:shadow-md transition-all ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      <GripVertical className="w-5 h-5 text-purple-500" />
      <span className="font-semibold flex-1">{className}</span>
      <button
        onClick={() => onRemove(className)}
        className="p-1 hover:bg-red-100 rounded transition-colors opacity-0 group-hover:opacity-100"
      >
        <X className="w-5 h-5 text-red-600" />
      </button>
    </div>
  );
};

export default function SchoolSetupTab() {
  // Ref to track if initial load has happened
  const hasLoadedRef = useRef(false);
  const { currentSchool, updateSchoolPassword } = useAuth();
  
  // Create a fallback school object for backward compatibility
  const [schoolCode, setSchoolCode] = useState<string>('');
  
  useEffect(() => {
    // Get or create school code
    if (currentSchool && currentSchool.schoolCode) {
      setSchoolCode(currentSchool.schoolCode);
    } else {
      // Fallback: generate a unique school code if not logged in via school system
      const storedCode = localStorage.getItem('schoolCode');
      if (storedCode) {
        setSchoolCode(storedCode);
      } else {
        // Generate unique school code without DEMO prefix
        const generateSchoolCode = () => {
          const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
          const numbers = '0123456789';
          
          let code = 'SCH';
          for (let i = 0; i < 3; i++) {
            code += letters.charAt(Math.floor(Math.random() * letters.length));
          }
          for (let i = 0; i < 6; i++) {
            code += numbers.charAt(Math.floor(Math.random() * numbers.length));
          }
          return code;
        };
        
        const newCode = generateSchoolCode();
        localStorage.setItem('schoolCode', newCode);
        setSchoolCode(newCode);
      }
    }
  }, [currentSchool]);
  
  // Password Change State
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // School Information
  const [schoolInfo, setSchoolInfo] = useState({
    name: 'Springfield Elementary School',
    phone: '+1 (555) 123-4567',
    email: 'admin@springfield.edu',
    website: 'www.springfield.edu',
    logo: ''
  });

  // Classes Management
  const predefinedClasses = [
    'Pre-Nursery', 'Nursery 1', 'Nursery 2', 
    'Primary 1', 'Primary 2', 'Primary 3', 
    'Primary 4', 'Primary 5', 'Primary 6'
  ];

  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [customClasses, setCustomClasses] = useState<string[]>([]);
  const [newCustomClass, setNewCustomClass] = useState('');

  // School Hours
  const [schoolHours, setSchoolHours] = useState({
    resumption: '08:00',
    closing: '14:00'
  });

  // School Hours with AM/PM
  const [schoolHoursTime, setSchoolHoursTime] = useState({
    resumptionHour: '08',
    resumptionMinute: '00',
    resumptionPeriod: 'AM' as 'AM' | 'PM',
    closingHour: '02',
    closingMinute: '00',
    closingPeriod: 'PM' as 'AM' | 'PM'
  });

  // School Location
  const [schoolLocation, setSchoolLocation] = useState({
    latitude: '',
    longitude: '',
    address: '',
    radius: '100' // Default radius in meters
  });

  // Location Testing State
  const [locationTest, setLocationTest] = useState<{
    isLoading: boolean;
    result: 'idle' | 'success' | 'failed';
    distance: number | null;
    currentLat: number | null;
    currentLon: number | null;
    message: string;
  }>({
    isLoading: false,
    result: 'idle',
    distance: null,
    currentLat: null,
    currentLon: null,
    message: ''
  });

  // Auto Clock Out
  const [autoClockOut, setAutoClockOut] = useState(false);

  // Parent Portal Appearance
  const [parentPortalAppearance, setParentPortalAppearance] = useState({
    backgroundType: 'gradient' as 'gradient' | 'image' | 'color',
    backgroundImage: '',
    backgroundColor: '#10b981',
    gradientFrom: '#10b981',
    gradientTo: '#14b8a6'
  });

  // Dashboard Theme
  const [dashboardTheme, setDashboardTheme] = useState<'light' | 'dark'>('light');

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Store initial state for comparison
  const [initialState, setInitialState] = useState<any>(null);

  // Load from localStorage on mount
  useEffect(() => {
    // Prevent re-initialization if already loaded
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const saved = {
      schoolInfo: localStorage.getItem('schoolInfo'),
      selectedClasses: localStorage.getItem('selectedClasses'),
      customClasses: localStorage.getItem('customClasses'),
      schoolHours: localStorage.getItem('schoolHours'),
      schoolHoursTime: localStorage.getItem('schoolHoursTime'),
      schoolLocation: localStorage.getItem('schoolLocation'),
      autoClockOut: localStorage.getItem('autoClockOut'),
      parentPortalAppearance: localStorage.getItem('parentPortalAppearance'),
      dashboardTheme: localStorage.getItem('dashboardTheme')
    };

    const loadedState = {
      schoolInfo: saved.schoolInfo ? JSON.parse(saved.schoolInfo) : schoolInfo,
      selectedClasses: saved.selectedClasses ? JSON.parse(saved.selectedClasses) : [],
      customClasses: saved.customClasses ? JSON.parse(saved.customClasses) : [],
      schoolHoursTime: saved.schoolHoursTime ? JSON.parse(saved.schoolHoursTime) : schoolHoursTime,
      schoolLocation: saved.schoolLocation ? (() => {
        const loadedLocation = JSON.parse(saved.schoolLocation);
        return {
          latitude: loadedLocation.latitude || '',
          longitude: loadedLocation.longitude || '',
          address: loadedLocation.address || '',
          radius: loadedLocation.radius || '100'
        };
      })() : schoolLocation,
      autoClockOut: saved.autoClockOut ? JSON.parse(saved.autoClockOut) : false,
      parentPortalAppearance: saved.parentPortalAppearance ? JSON.parse(saved.parentPortalAppearance) : parentPortalAppearance,
      dashboardTheme: saved.dashboardTheme ? JSON.parse(saved.dashboardTheme) : dashboardTheme
    };

    // Batch all state updates using React 18's automatic batching
    if (saved.schoolInfo) setSchoolInfo(loadedState.schoolInfo);
    if (saved.selectedClasses) setSelectedClasses(loadedState.selectedClasses);
    if (saved.customClasses) setCustomClasses(loadedState.customClasses);
    if (saved.schoolHours) setSchoolHours(JSON.parse(saved.schoolHours));
    if (saved.schoolHoursTime) setSchoolHoursTime(loadedState.schoolHoursTime);
    if (saved.schoolLocation) setSchoolLocation(loadedState.schoolLocation);
    if (saved.autoClockOut) setAutoClockOut(loadedState.autoClockOut);
    if (saved.parentPortalAppearance) setParentPortalAppearance(loadedState.parentPortalAppearance);
    if (saved.dashboardTheme) setDashboardTheme(loadedState.dashboardTheme);

    // Store initial state after loading - set this last to trigger change detection
    setTimeout(() => {
      setInitialState(loadedState);
    }, 0);
  }, []);

  // Track changes by comparing with initial state - Optimized with useMemo
  const currentStateString = useMemo(() => {
    const currentState = {
      schoolInfo,
      selectedClasses,
      customClasses,
      schoolHoursTime,
      schoolLocation,
      autoClockOut,
      parentPortalAppearance,
      dashboardTheme
    };
    return JSON.stringify(currentState);
  }, [schoolInfo, selectedClasses, customClasses, schoolHoursTime, schoolLocation, autoClockOut, parentPortalAppearance, dashboardTheme]);

  useEffect(() => {
    if (!initialState) return; // Skip on initial mount

    // Deep comparison
    const hasChanges = currentStateString !== JSON.stringify(initialState);
    setHasUnsavedChanges(hasChanges);
    
    if (hasChanges) {
      setShowSaveSuccess(false);
    }
  }, [currentStateString, initialState]);

  // Apply theme preview immediately (without saving to localStorage)
  useEffect(() => {
    const applyThemePreview = () => {
      const root = document.documentElement;
      
      // Create or get style tag
      let styleTag = document.getElementById('dynamic-theme-styles');
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'dynamic-theme-styles';
        document.head.appendChild(styleTag);
      }
      
      if (dashboardTheme === 'dark') {
        // Apply dark theme preview
        root.classList.add('dark');
        root.style.setProperty('--bg-primary', '#1f2937');
        root.style.setProperty('--bg-secondary', '#111827');
        root.style.setProperty('--text-primary', '#f9fafb');
        root.style.setProperty('--text-secondary', '#d1d5db');
        root.style.setProperty('--border-color', '#374151');
        
        styleTag.textContent = `
          /* Dark Theme - Global Overrides */
          body { background-color: #0f172a !important; color: #f1f5f9 !important; }
          
          /* Override white backgrounds */
          .bg-white { background-color: #1e293b !important; }
          .bg-gray-50 { background-color: #0f172a !important; }
          .bg-gray-100 { background-color: #1e293b !important; }
          .bg-gray-200 { background-color: #334155 !important; }
          
          /* Override text colors */
          .text-gray-900 { color: #f1f5f9 !important; }
          .text-gray-800 { color: #e2e8f0 !important; }
          .text-gray-700 { color: #cbd5e1 !important; }
          .text-gray-600 { color: #94a3b8 !important; }
          .text-gray-500 { color: #64748b !important; }
          
          /* Override borders */
          .border-gray-200 { border-color: #334155 !important; }
          .border-gray-300 { border-color: #475569 !important; }
          
          /* Cards and containers */
          [class*="bg-gradient-to"] { 
            background: linear-gradient(to bottom right, #1e293b, #0f172a) !important; 
          }
          
          /* Inputs */
          input, select, textarea {
            background-color: #0f172a !important;
            color: #f1f5f9 !important;
            border-color: #475569 !important;
          }
          
          /* Buttons with bg-white */
          button.bg-white {
            background-color: #1e293b !important;
            color: #f1f5f9 !important;
          }
          
          /* Hover states - Toned down for better text contrast */
          .hover\\:bg-gray-50:hover { background-color: #1e293b !important; }
          .hover\\:bg-gray-100:hover { background-color: #293548 !important; }
          .hover\\:bg-indigo-50:hover { background-color: #1e293b !important; }
          .hover\\:bg-purple-50:hover { background-color: #2d1b3d !important; }
          .hover\\:bg-green-50:hover { background-color: #1a2e25 !important; }
          .hover\\:bg-blue-50:hover { background-color: #1a2942 !important; }
          .hover\\:bg-orange-50:hover { background-color: #2d2418 !important; }
          .hover\\:bg-pink-50:hover { background-color: #2d1a27 !important; }
          .hover\\:bg-violet-50:hover { background-color: #261b33 !important; }
          .hover\\:bg-red-50:hover { background-color: #2d1a1e !important; }
          
          /* Border hover states - Subtle highlights */
          .hover\\:border-indigo-400:hover { border-color: #6366f1 !important; }
          .hover\\:border-purple-400:hover { border-color: #a78bfa !important; }
          .hover\\:border-green-400:hover { border-color: #4ade80 !important; }
          .hover\\:border-blue-400:hover { border-color: #60a5fa !important; }
          .hover\\:border-pink-400:hover { border-color: #f472b6 !important; }
          .hover\\:border-violet-400:hover { border-color: #a78bfa !important; }
          
          /* Specific color gradients for cards */
          .from-indigo-50, .from-purple-50, .from-green-50, 
          .from-blue-50, .from-orange-50, .from-pink-50, 
          .from-violet-50, .from-yellow-50 {
            background: #1e293b !important;
          }
          
          /* Gradient backgrounds for colored sections - More subtle */
          .bg-gradient-to-br.from-indigo-50 { background: linear-gradient(to bottom right, #1e3a5f, #1e293b) !important; }
          .bg-gradient-to-br.from-purple-50 { background: linear-gradient(to bottom right, #2d1b3d, #1e293b) !important; }
          .bg-gradient-to-br.from-green-50 { background: linear-gradient(to bottom right, #1a3d2e, #1e293b) !important; }
          .bg-gradient-to-br.from-blue-50 { background: linear-gradient(to bottom right, #1a3a52, #1e293b) !important; }
          .bg-gradient-to-br.from-orange-50 { background: linear-gradient(to bottom right, #3d2818, #1e293b) !important; }
          .bg-gradient-to-br.from-pink-50 { background: linear-gradient(to bottom right, #3d1a2f, #1e293b) !important; }
          .bg-gradient-to-br.from-violet-50 { background: linear-gradient(to bottom right, #2d1b42, #1e293b) !important; }
          
          /* Purple/Indigo backgrounds for selected items - Better contrast */
          .bg-purple-100 { background-color: #3d2d5a !important; }
          .from-purple-100 { background: #3d2d5a !important; }
          .bg-indigo-100 { background-color: #2d3d5a !important; }
          .to-indigo-100 { background: #2d3d5a !important; }
          .bg-gradient-to-r.from-purple-100.to-indigo-100 { 
            background: linear-gradient(to right, #3d2d5a, #2d3d5a) !important; 
          }
          
          /* Purple text colors for contrast */
          .text-purple-900 { color: #e9d5ff !important; }
          .text-purple-500 { color: #a78bfa !important; }
          
          /* Border colors for purple elements */
          .border-purple-300 { border-color: #6b46c1 !important; }
          
          /* Violet backgrounds - Better contrast */
          .bg-violet-50 { background-color: #1e1a2e !important; }
          .border-violet-200 { border-color: #5b21b6 !important; }
          .border-violet-600 { border-color: #7c3aed !important; }
          
          /* Keep accent colors vibrant */
          .bg-indigo-600, .bg-purple-600, .bg-green-600, 
          .bg-blue-600, .bg-orange-600, .bg-pink-600,
          .bg-violet-600, .bg-red-500, .bg-emerald-500 {
            /* Keep these colors as is */
          }
        `;
      } else {
        // Apply light theme preview
        root.classList.remove('dark');
        root.style.setProperty('--bg-primary', '#ffffff');
        root.style.setProperty('--bg-secondary', '#f9fafb');
        root.style.setProperty('--text-primary', '#111827');
        root.style.setProperty('--text-secondary', '#6b7280');
        root.style.setProperty('--border-color', '#e5e7eb');
        
        styleTag.textContent = `
          /* Light Theme */
          body { background-color: #ffffff !important; color: #111827 !important; }
          .theme-bg { background-color: #ffffff !important; }
          .theme-bg-card { background-color: #f9fafb !important; }
          .theme-text { color: #111827 !important; }
          .theme-text-muted { color: #6b7280 !important; }
          .theme-border { border-color: #e5e7eb !important; }
        `;
      }
    };
    
    applyThemePreview();
  }, [dashboardTheme]);

  const handleSaveAll = async () => {
    console.log('🔵 [SAVE] handleSaveAll function called!');
    
    // Convert 12-hour format to 24-hour format for storage
    const convertTo24Hour = (hour: string, minute: string, period: 'AM' | 'PM') => {
      let hour24 = parseInt(hour);
      if (period === 'PM' && hour24 !== 12) {
        hour24 += 12;
      } else if (period === 'AM' && hour24 === 12) {
        hour24 = 0;
      }
      return `${hour24.toString().padStart(2, '0')}:${minute}`;
    };

    const schoolHours = {
      resumption: convertTo24Hour(schoolHoursTime.resumptionHour, schoolHoursTime.resumptionMinute, schoolHoursTime.resumptionPeriod),
      closing: convertTo24Hour(schoolHoursTime.closingHour, schoolHoursTime.closingMinute, schoolHoursTime.closingPeriod)
    };

    // Save all settings to localStorage with error handling
    console.log('💾 [SAVE] Saving to localStorage...');
    try {
      localStorage.setItem('schoolInfo', JSON.stringify(schoolInfo));
      localStorage.setItem('schoolLogo', schoolInfo.logo);
      localStorage.setItem('schoolName', schoolInfo.name);
      localStorage.setItem('selectedClasses', JSON.stringify(selectedClasses));
      localStorage.setItem('customClasses', JSON.stringify(customClasses));
      
      console.log('💾 SchoolSetupTab - Saving classes to localStorage:');
      console.log('  - selectedClasses:', selectedClasses);
      console.log('  - customClasses:', customClasses);
      console.log('  - TOTAL classes:', [...selectedClasses, ...customClasses]);
      
      localStorage.setItem('schoolHours', JSON.stringify(schoolHours));
      localStorage.setItem('schoolHoursTime', JSON.stringify(schoolHoursTime));
      localStorage.setItem('schoolLocation', JSON.stringify(schoolLocation));
      localStorage.setItem('autoClockOut', JSON.stringify(autoClockOut));
      localStorage.setItem('parentPortalAppearance', JSON.stringify(parentPortalAppearance));
      localStorage.setItem('dashboardTheme', JSON.stringify(dashboardTheme));
      
      console.log('🎨 [SAVE] Parent portal appearance being saved:', parentPortalAppearance);
      console.log('✅ [SAVE] localStorage save successful');
    } catch (error: any) {
      if (error.name === 'QuotaExceededError') {
        console.error('❌ [SAVE] localStorage quota exceeded!');
        toast.error('Storage quota exceeded! Please use image URLs instead of uploading files.');
        return; // Stop the save process
      }
      console.error('❌ [SAVE] localStorage error:', error);
      toast.error('Failed to save locally. Please try again.');
      return;
    }

    // Update school logo in the schools array and currentSchool
    if (currentSchool) {
      const schools = JSON.parse(localStorage.getItem('schools') || '[]');
      const updatedSchools = schools.map((s: any) => 
        s.id === currentSchool.id ? { ...s, logo: schoolInfo.logo, name: schoolInfo.name } : s
      );
      localStorage.setItem('schools', JSON.stringify(updatedSchools));
      
      // Update currentSchool with new logo
      const updatedCurrentSchool = { ...currentSchool, logo: schoolInfo.logo, name: schoolInfo.name };
      localStorage.setItem('currentSchool', JSON.stringify(updatedCurrentSchool));
    }

    // Save school info to Supabase
    try {
      if (schoolCode) {
        console.log('💾 [SAVE] Saving school info to Supabase with school code:', schoolCode);
        const students = JSON.parse(localStorage.getItem('students') || '[]');
        const parents = JSON.parse(localStorage.getItem('parents') || '[]');
        
        await supabaseApi.saveSchoolInfo({
          schoolCode,
          name: schoolInfo.name,
          address: schoolInfo.address,
          email: schoolInfo.email,
          phone: schoolInfo.phone,
          logo: schoolInfo.logo,
          status: 'active',
          studentsCount: students.length,
          parentsCount: parents.length,
          website: schoolInfo.website,
          principal: schoolInfo.principal,
          parentPortalAppearance: parentPortalAppearance
        });
        console.log('✅ [SAVE] School info saved to Supabase successfully!');
        toast.success('School information saved successfully!');
      } else {
        console.warn('⚠️ [SAVE] No school code found, skipping Supabase save');
      }
    } catch (error) {
      console.error('❌ [SAVE] Error saving to Supabase:', error);
      toast.error('Failed to save to cloud. Please try again.');
      return; // Don't proceed if save failed
    }

    // Trigger storage event to sync across all components
    window.dispatchEvent(new Event('storage'));
    
    // Trigger custom events for specific updates
    window.dispatchEvent(new Event('themeUpdated'));
    window.dispatchEvent(new Event('classesUpdated'));
    
    console.log('✅ SchoolSetupTab - Fired classesUpdated event');
    
    // Update initial state to mark as saved
    setInitialState({
      schoolInfo,
      selectedClasses,
      customClasses,
      schoolHoursTime,
      schoolLocation,
      autoClockOut,
      parentPortalAppearance,
      dashboardTheme
    });
    setHasUnsavedChanges(false);
    
    console.log('✅ [SAVE] Save completed successfully!');
  };

  const handleToggleClass = (className: string) => {
    setSelectedClasses(prev => 
      prev.includes(className) 
        ? prev.filter(c => c !== className)
        : [...prev, className]
    );
  };

  const handleAddCustomClass = () => {
    if (newCustomClass.trim() && !selectedClasses.includes(newCustomClass.trim())) {
      setSelectedClasses([...selectedClasses, newCustomClass.trim()]);
      setNewCustomClass('');
    }
  };

  const handleRemoveCustomClass = (className: string) => {
    setCustomClasses(customClasses.filter(c => c !== className));
  };

  const handleRemoveSelectedClass = (className: string) => {
    setSelectedClasses(selectedClasses.filter(c => c !== className));
  };

  const moveClass = useCallback((dragIndex: number, hoverIndex: number) => {
    setSelectedClasses(prevClasses => {
      const newClasses = [...prevClasses];
      const draggedClass = newClasses[dragIndex];
      newClasses.splice(dragIndex, 1);
      newClasses.splice(hoverIndex, 0, draggedClass);
      return newClasses;
    });
  }, []);

  const handleGetCurrentLocation = useCallback(() => {
    if ('geolocation' in navigator) {
      setLocationTest({ ...locationTest, isLoading: true, result: 'idle' });
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(6);
          const lon = position.coords.longitude.toFixed(6);
          
          setSchoolLocation({
            ...schoolLocation,
            latitude: lat,
            longitude: lon
          });
          
          setLocationTest({
            isLoading: false,
            result: 'success',
            distance: null,
            currentLat: parseFloat(lat),
            currentLon: parseFloat(lon),
            message: 'Location captured successfully'
          });
        },
        (error) => {
          setLocationTest({
            isLoading: false,
            result: 'failed',
            distance: null,
            currentLat: null,
            currentLon: null,
            message: `Error: ${error.message}`
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setLocationTest({
        isLoading: false,
        result: 'failed',
        distance: null,
        currentLat: null,
        currentLon: null,
        message: 'Geolocation is not supported by your browser'
      });
    }
  }, [schoolLocation]);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }, []);

  const handleTestLocation = () => {
    if (!schoolLocation.latitude || !schoolLocation.longitude) {
      alert('Please set school coordinates first');
      return;
    }

    setLocationTest({
      ...locationTest,
      isLoading: true,
      result: 'idle',
      message: 'Checking your current location...'
    });

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentLat = position.coords.latitude;
          const currentLon = position.coords.longitude;
          const schoolLat = parseFloat(schoolLocation.latitude);
          const schoolLon = parseFloat(schoolLocation.longitude);

          const distance = calculateDistance(currentLat, currentLon, schoolLat, schoolLon);
          const acceptableRadius = parseInt(schoolLocation.radius, 10); // Use the radius from state

          if (distance <= acceptableRadius) {
            setLocationTest({
              isLoading: false,
              result: 'success',
              distance: Math.round(distance),
              currentLat,
              currentLon,
              message: `✓ You are at the school location! Distance: ${Math.round(distance)}m`
            });
          } else {
            setLocationTest({
              isLoading: false,
              result: 'failed',
              distance: Math.round(distance),
              currentLat,
              currentLon,
              message: `✗ You are ${Math.round(distance)}m away from the school location`
            });
          }
        },
        (error) => {
          setLocationTest({
            isLoading: false,
            result: 'failed',
            distance: null,
            currentLat: null,
            currentLon: null,
            message: `Error: ${error.message}`
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setLocationTest({
        isLoading: false,
        result: 'failed',
        distance: null,
        currentLat: null,
        currentLon: null,
        message: 'Geolocation is not supported by your browser'
      });
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        return;
      }
      
      // Strict file type validation - only allow JPG, PNG, and WebP
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        alert('Invalid file type. Only JPG, PNG, and WebP images are supported.');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setSchoolInfo({ ...schoolInfo, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setSchoolInfo({ ...schoolInfo, logo: '' });
  };

  const handleBackgroundImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }
    
    // Strict file type validation - only allow JPG, PNG, and WebP
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      toast.error('Invalid file type. Only JPG, PNG, and WebP images are supported.');
      return;
    }
    
    try {
      console.log('📸 [IMAGE] Starting upload via server...');
      console.log('📸 [IMAGE] File details:', { name: file.name, size: file.size, type: file.type });
      toast.info('Uploading image...');
      
      // Import project info
      const { projectId, publicAnonKey } = await import('@/utils/supabase/info');
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('schoolCode', schoolCode);
      
      console.log('📸 [IMAGE] Uploading to server endpoint...');
      
      // Upload via server endpoint (server uses service role to bypass RLS)
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-17b9cebd/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: formData
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        console.error('❌ [IMAGE] Server upload failed:', result.error);
        toast.error(`Upload failed: ${result.error || 'Unknown error'}`);
        return;
      }
      
      console.log('✅ [IMAGE] File uploaded successfully via server');
      console.log('✅ [IMAGE] Public URL:', result.url);
      
      // Update state with URL
      setParentPortalAppearance({ 
        ...parentPortalAppearance, 
        backgroundImage: result.url
      });
      
      toast.success('Background image uploaded successfully!');
      console.log('✅ [IMAGE] State updated with new image URL');
    } catch (error: any) {
      console.error('❌ [IMAGE] Unexpected error during upload:', error);
      console.error('❌ [IMAGE] Error stack:', error.stack);
      toast.error(`Upload failed: ${error.message || 'Unknown error'}`);
    }
  };

  const handleRemoveBackgroundImage = () => {
    setParentPortalAppearance({ ...parentPortalAppearance, backgroundImage: '' });
  };

  const handleTestStorage = async () => {
    try {
      console.log('🧪 [STORAGE TEST] Testing storage connection...');
      toast.info('Testing storage...');
      
      // Import the test function
      const { testStorageConnection } = await import('@/utils/testStorage');
      const result = await testStorageConnection();
      
      if (result.success) {
        console.log('✅ [STORAGE TEST] Success:', result.data);
        toast.success('Storage is working! Bucket exists and is accessible.');
      } else {
        console.error('❌ [STORAGE TEST] Failed:', result.error);
        toast.error(`Storage test failed: ${result.error}`);
      }
    } catch (error: any) {
      console.error('❌ [STORAGE TEST] Unexpected error:', error);
      toast.error('Storage test failed unexpectedly');
    }
  };

  const handleCopyParentLink = () => {
    if (schoolCode) {
      const parentLink = `${window.location.origin}/school/${schoolCode}/parent-login`;
      navigator.clipboard.writeText(parentLink);
      toast.success('Parent access link copied to clipboard!');
    } else {
      toast.error('School code not available');
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentSchool) {
      toast.error('School information not found');
      return;
    }

    if (oldPassword !== currentSchool.password) {
      toast.error('Current password is incorrect');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    updateSchoolPassword(newPassword);
    toast.success('Password changed successfully!');
    setShowPasswordChange(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Advanced School Setup</h3>
          <p className="text-sm text-gray-600 mt-1">Configure all aspects of your school system</p>
        </div>
        {hasUnsavedChanges && (
          <div className="flex items-center gap-2 text-sm text-orange-600">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            <span>Unsaved changes</span>
          </div>
        )}
      </div>

      {/* 1. School Information */}
      <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <School className="w-5 h-5 text-indigo-600" />
          <h4 className="text-lg font-semibold text-gray-900">School Information</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Logo Upload Section */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">School Logo</label>
            <div className="flex items-center gap-4">
              {/* Logo Preview */}
              <div className="flex-shrink-0">
                {schoolInfo.logo ? (
                  <div className="relative group">
                    <img
                      src={schoolInfo.logo}
                      alt="School Logo"
                      className="w-24 h-24 rounded-lg object-cover border-2 border-indigo-200"
                    />
                    <button
                      onClick={handleRemoveLogo}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                      title="Remove logo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed border-indigo-300 flex items-center justify-center bg-indigo-50">
                    <Camera className="w-8 h-8 text-indigo-400" />
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <div className="flex-1">
                <label className="cursor-pointer">
                  <div className="border-2 border-dashed border-indigo-300 rounded-lg p-6 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-center">
                    <Camera className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      Click to upload school logo
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG or GIF (Max 2MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
            <input
              type="text"
              value={schoolInfo.name}
              onChange={(e) => setSchoolInfo({ ...schoolInfo, name: e.target.value })}
              placeholder="School Name"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              value={schoolInfo.phone}
              onChange={(e) => setSchoolInfo({ ...schoolInfo, phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={schoolInfo.email}
              onChange={(e) => setSchoolInfo({ ...schoolInfo, email: e.target.value })}
              placeholder="admin@school.edu"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <input
              type="text"
              value={schoolInfo.website}
              onChange={(e) => setSchoolInfo({ ...schoolInfo, website: e.target.value })}
              placeholder="www.school.edu"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2. Parent Access Link */}
      <div className="bg-gradient-to-br from-green-50 to-white border border-green-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Link className="w-5 h-5 text-green-600" />
          <h4 className="text-lg font-semibold text-gray-900">Parent Access Link</h4>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Share with Parents</label>
          <p className="text-sm text-gray-600 mb-3">
            Share this unique link with parents to access the attendance system for your school
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={schoolCode ? `${window.location.origin}/school/${schoolCode}/parent-login` : 'Loading...'}
              readOnly
              className="flex-1 px-4 py-3 bg-green-50 border-2 border-green-300 rounded-lg font-mono text-sm text-green-900 focus:outline-none"
            />
            <button
              onClick={handleCopyParentLink}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Copy className="w-5 h-5" />
              Copy
            </button>
          </div>
          {schoolCode && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>School Code:</strong> {schoolCode} | This code identifies your school in the system
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Change Password */}
      <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Key className="w-5 h-5 text-indigo-600" />
          <h4 className="text-lg font-semibold text-gray-900">Change Password</h4>
        </div>
        
        <div>
          <p className="text-sm text-gray-600 mb-4">
            Update your school admin password for enhanced security
          </p>
          
          {!showPasswordChange ? (
            <button
              onClick={() => setShowPasswordChange(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Key className="w-5 h-5" />
              Change Password
            </button>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-4 bg-white border border-gray-200 rounded-lg p-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Lock className="w-5 h-5" />
                  Update Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordChange(false);
                    setOldPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>

              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  <strong>Security Note:</strong> Your new password must be at least 6 characters long. Make sure to remember it as it cannot be recovered.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* 4. Classes Management */}
      <DndProvider backend={HTML5Backend}>
        <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="w-5 h-5 text-purple-600" />
            <h4 className="text-lg font-semibold text-gray-900">Classes Management</h4>
          </div>
          
          {/* Pre-defined Classes */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Available Pre-defined Classes</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {predefinedClasses.map((className) => (
                <button
                  key={className}
                  onClick={() => handleToggleClass(className)}
                  disabled={selectedClasses.includes(className)}
                  className={`px-4 py-2.5 rounded-lg border-2 font-medium transition-all ${
                    selectedClasses.includes(className)
                      ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                >
                  {selectedClasses.includes(className) ? '✓ ' : ''}{className}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Class Input */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Add Custom Class</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCustomClass}
                onChange={(e) => setNewCustomClass(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCustomClass()}
                placeholder="Enter custom class name (e.g., JSS 1, SS 2)"
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
              <button
                onClick={handleAddCustomClass}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium inline-flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                <Plus className="w-4 h-4" />
                Add to Selected
              </button>
            </div>
          </div>

          {/* Selected Classes - Draggable */}
          {selectedClasses.length > 0 && (
            <div className="border-t-2 border-purple-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-bold text-purple-900 mb-1">Selected Classes ({selectedClasses.length})</p>
                  <p className="text-xs text-gray-600">Drag to reorder • Hover to remove</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedClasses.map((className, index) => (
                  <DraggableClassItem
                    key={className}
                    className={className}
                    index={index}
                    moveClass={moveClass}
                    onRemove={handleRemoveSelectedClass}
                  />
                ))}
              </div>
            </div>
          )}

          {selectedClasses.length === 0 && (
            <div className="border-t-2 border-purple-200 pt-6">
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No classes selected yet</p>
                <p className="text-sm">Click on pre-defined classes above or add custom classes</p>
              </div>
            </div>
          )}
        </div>
      </DndProvider>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 5. School Hours */}
        <div className="bg-gradient-to-br from-green-50 to-white border border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-green-600" />
            <h4 className="text-lg font-semibold text-gray-900">School Hours</h4>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resumption Time</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={schoolHoursTime.resumptionHour}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (parseInt(val) > 12) val = '12';
                    if (parseInt(val) < 1) val = '01';
                    setSchoolHoursTime({ ...schoolHoursTime, resumptionHour: val.padStart(2, '0') });
                  }}
                  placeholder="HH"
                  className="w-20 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-center font-medium"
                />
                <span className="flex items-center text-gray-500 font-bold">:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={schoolHoursTime.resumptionMinute}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (parseInt(val) > 59) val = '59';
                    if (parseInt(val) < 0) val = '00';
                    setSchoolHoursTime({ ...schoolHoursTime, resumptionMinute: val.padStart(2, '0') });
                  }}
                  placeholder="MM"
                  className="w-20 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-center font-medium"
                />
                <select
                  value={schoolHoursTime.resumptionPeriod}
                  onChange={(e) => setSchoolHoursTime({ ...schoolHoursTime, resumptionPeriod: e.target.value as 'AM' | 'PM' })}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none font-medium bg-white cursor-pointer"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Closing Time</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={schoolHoursTime.closingHour}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (parseInt(val) > 12) val = '12';
                    if (parseInt(val) < 1) val = '01';
                    setSchoolHoursTime({ ...schoolHoursTime, closingHour: val.padStart(2, '0') });
                  }}
                  placeholder="HH"
                  className="w-20 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-center font-medium"
                />
                <span className="flex items-center text-gray-500 font-bold">:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={schoolHoursTime.closingMinute}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (parseInt(val) > 59) val = '59';
                    if (parseInt(val) < 0) val = '00';
                    setSchoolHoursTime({ ...schoolHoursTime, closingMinute: val.padStart(2, '0') });
                  }}
                  placeholder="MM"
                  className="w-20 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-center font-medium"
                />
                <select
                  value={schoolHoursTime.closingPeriod}
                  onChange={(e) => setSchoolHoursTime({ ...schoolHoursTime, closingPeriod: e.target.value as 'AM' | 'PM' })}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none font-medium bg-white cursor-pointer"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 6. School Location (GPS) */}
        <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h4 className="text-lg font-semibold text-gray-900">School Location (GPS)</h4>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                <input
                  type="text"
                  value={schoolLocation.latitude}
                  onChange={(e) => setSchoolLocation({ ...schoolLocation, latitude: e.target.value })}
                  placeholder="6.5244"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                <input
                  type="text"
                  value={schoolLocation.longitude}
                  onChange={(e) => setSchoolLocation({ ...schoolLocation, longitude: e.target.value })}
                  placeholder="3.3792"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* GPS Coverage Radius */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GPS Coverage Radius (meters)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="10"
                  max="1000"
                  value={schoolLocation.radius}
                  onChange={(e) => setSchoolLocation({ ...schoolLocation, radius: e.target.value })}
                  placeholder="100"
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <span className="text-sm text-gray-600 font-medium">meters</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Students must be within this distance from the school location to check in/out
              </p>
            </div>

            <button
              onClick={handleGetCurrentLocation}
              disabled={locationTest.isLoading}
              className={`w-full px-4 py-3 rounded-lg font-semibold inline-flex items-center justify-center gap-2 transition-all shadow-md ${
                locationTest.isLoading
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
              }`}
            >
              <Navigation className={`w-5 h-5 ${locationTest.isLoading ? 'animate-spin' : ''}`} />
              {locationTest.isLoading ? 'Getting Location...' : 'Get Precise Location'}
            </button>

            {/* Location Confirmation */}
            {locationTest.result === 'success' && schoolLocation.latitude && schoolLocation.longitude && (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-green-900 mb-2">
                      ✓ Device Location Confirmed
                    </p>
                    <div className="text-sm text-green-800 space-y-1">
                      <p>
                        This device is currently located at the coordinates:<br />
                        <span className="font-mono font-semibold">
                          Latitude: {schoolLocation.latitude}, Longitude: {schoolLocation.longitude}
                        </span>
                      </p>
                      <p className="mt-2 pt-2 border-t border-green-300">
                        These coordinates have been set as the school's official GPS location. 
                        Students can only be checked in/out when their device is within <span className="font-semibold">{schoolLocation.radius} meters</span> of this location.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error State */}
            {locationTest.result === 'failed' && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-red-900 mb-1">
                      Unable to Get Location
                    </p>
                    <p className="text-sm text-red-700">
                      {locationTest.message || 'Please enable location services and try again.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 7. Auto Clock Out */}
      <div className="bg-gradient-to-br from-orange-50 to-white border border-orange-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Auto Clock Out</h4>
              <p className="text-sm text-gray-600">Automatically clock out students at closing time</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={autoClockOut}
              onChange={(e) => setAutoClockOut(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-orange-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
          </label>
        </div>
      </div>

      {/* 8. Parent Portal Appearance */}
      <div className="bg-gradient-to-br from-pink-50 to-white border border-pink-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon className="w-5 h-5 text-pink-600" />
          <h4 className="text-lg font-semibold text-gray-900">Parent Portal Background</h4>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Background Type</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setParentPortalAppearance({ ...parentPortalAppearance, backgroundType: 'gradient' })}
                className={`px-4 py-2.5 rounded-lg border-2 font-medium transition-all ${
                  parentPortalAppearance.backgroundType === 'gradient'
                    ? 'bg-blue-600 text-white border-transparent shadow-md'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                }`}
              >
                Gradient
              </button>
              <button
                onClick={() => setParentPortalAppearance({ ...parentPortalAppearance, backgroundType: 'image' })}
                className={`px-4 py-2.5 rounded-lg border-2 font-medium transition-all ${
                  parentPortalAppearance.backgroundType === 'image'
                    ? 'bg-blue-600 text-white border-transparent shadow-md'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                }`}
              >
                Image
              </button>
              <button
                onClick={() => setParentPortalAppearance({ ...parentPortalAppearance, backgroundType: 'color' })}
                className={`px-4 py-2.5 rounded-lg border-2 font-medium transition-all ${
                  parentPortalAppearance.backgroundType === 'color'
                    ? 'bg-blue-600 text-white border-transparent shadow-md'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                }`}
              >
                Solid Color
              </button>
            </div>
          </div>

          {parentPortalAppearance.backgroundType === 'gradient' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gradient From</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={parentPortalAppearance.gradientFrom}
                    onChange={(e) => setParentPortalAppearance({ ...parentPortalAppearance, gradientFrom: e.target.value })}
                    className="w-14 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={parentPortalAppearance.gradientFrom}
                    onChange={(e) => setParentPortalAppearance({ ...parentPortalAppearance, gradientFrom: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gradient To</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={parentPortalAppearance.gradientTo}
                    onChange={(e) => setParentPortalAppearance({ ...parentPortalAppearance, gradientTo: e.target.value })}
                    className="w-14 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={parentPortalAppearance.gradientTo}
                    onChange={(e) => setParentPortalAppearance({ ...parentPortalAppearance, gradientTo: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {parentPortalAppearance.backgroundType === 'image' && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">Background Image</label>
              
              {/* Image Preview */}
              {parentPortalAppearance.backgroundImage && (
                <div className="mb-4 relative group">
                  <img
                    src={parentPortalAppearance.backgroundImage}
                    alt="Background Preview"
                    className="w-full h-48 object-cover rounded-lg border-2 border-pink-200"
                    onError={(e) => {
                      // Use a data URI instead of external placeholder
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="400"%3E%3Crect fill="%23f3f4f6" width="800" height="400"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="24" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EInvalid Image URL%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  <button
                    onClick={handleRemoveBackgroundImage}
                    className="absolute top-2 right-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium inline-flex items-center gap-2 opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              )}

              {/* Upload Area */}
              <div>
                <label className="cursor-pointer block">
                  <div className="border-2 border-dashed border-pink-300 rounded-lg p-8 hover:border-pink-500 hover:bg-pink-50 transition-all text-center">
                    <ImageIcon className="w-12 h-12 text-pink-500 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      Click to upload background image
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG or GIF (Max 5MB) - Uploads to Supabase Storage
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={handleBackgroundImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-300"></div>
                <span className="text-xs text-gray-500 font-medium">OR</span>
                <div className="flex-1 h-px bg-gray-300"></div>
              </div>

              {/* URL Input */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-600">Paste Image URL</label>
                <input
                  type="url"
                  value={parentPortalAppearance.backgroundImage}
                  onChange={(e) => setParentPortalAppearance({ ...parentPortalAppearance, backgroundImage: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    💡 Tip: Use image URLs from Unsplash, Imgur, or any public image hosting service
                  </p>
                  <button
                    onClick={handleTestStorage}
                    className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors inline-flex items-center gap-1.5"
                  >
                    🧪 Test Storage
                  </button>
                </div>
              </div>
            </div>
          )}

          {parentPortalAppearance.backgroundType === 'color' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={parentPortalAppearance.backgroundColor}
                  onChange={(e) => setParentPortalAppearance({ ...parentPortalAppearance, backgroundColor: e.target.value })}
                  className="w-14 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={parentPortalAppearance.backgroundColor}
                  onChange={(e) => setParentPortalAppearance({ ...parentPortalAppearance, backgroundColor: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          )}

          {/* Preview Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
            <div 
              className="relative h-48 rounded-xl overflow-hidden border-2 border-pink-200"
              style={(() => {
                const { backgroundType, backgroundColor, backgroundImage, gradientFrom, gradientTo } = parentPortalAppearance;
                if (backgroundType === 'gradient') {
                  return { background: `linear-gradient(to bottom right, ${gradientFrom}, ${gradientTo})` };
                } else if (backgroundType === 'image' && backgroundImage) {
                  return {
                    backgroundImage: `url(${backgroundImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  };
                } else if (backgroundType === 'color') {
                  return { backgroundColor };
                }
                return {};
              })()}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur-sm px-6 py-4 rounded-xl shadow-lg">
                  <p className="text-gray-800 font-semibold text-center">Parent Portal Background</p>
                  <p className="text-gray-600 text-sm text-center mt-1">This is how it will appear</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* 7. Dashboard Theme */}
      <div className="bg-gradient-to-br from-violet-50 to-white border border-violet-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-violet-600" />
          <div>
            <h4 className="text-lg font-semibold text-gray-900">Dashboard Theme</h4>
            <p className="text-sm text-gray-600">Choose a theme for all dashboards (Admin & Parent Portal)</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          {/* White Theme */}
          <button
            onClick={() => setDashboardTheme('light')}
            className={`relative p-6 rounded-xl border-2 transition-all text-left ${
              dashboardTheme === 'light'
                ? 'border-blue-600 bg-blue-50 shadow-lg'
                : 'border-gray-300 bg-white hover:border-blue-400 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-lg border-2 border-gray-300 flex items-center justify-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded"></div>
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900">White Theme</h5>
                  <p className="text-xs text-gray-600">Clean & Professional</p>
                </div>
              </div>
              {dashboardTheme === 'light' && (
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            <div className="flex gap-1">
              <div className="flex-1 h-2 bg-indigo-600 rounded"></div>
              <div className="flex-1 h-2 bg-green-600 rounded"></div>
              <div className="flex-1 h-2 bg-gray-300 rounded"></div>
            </div>
          </button>

          {/* Dark Theme */}
          <button
            onClick={() => setDashboardTheme('dark')}
            className={`relative p-6 rounded-xl border-2 transition-all text-left ${
              dashboardTheme === 'dark'
                ? 'border-blue-600 bg-blue-50 shadow-lg'
                : 'border-gray-300 bg-white hover:border-blue-400 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-900 rounded-lg border-2 border-gray-700 flex items-center justify-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-800 rounded"></div>
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900">Dark Theme</h5>
                  <p className="text-xs text-gray-600">Modern & Sleek</p>
                </div>
              </div>
              {dashboardTheme === 'dark' && (
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            <div className="flex gap-1">
              <div className="flex-1 h-2 bg-purple-600 rounded"></div>
              <div className="flex-1 h-2 bg-teal-600 rounded"></div>
              <div className="flex-1 h-2 bg-gray-700 rounded"></div>
            </div>
          </button>
        </div>
      </div>

      {/* Save Changes Card - Always visible */}
      <div className={`bg-white border-t-4 ${hasUnsavedChanges ? 'border-blue-500' : 'border-gray-300'} rounded-xl shadow-2xl p-6`}>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-900">
              {hasUnsavedChanges ? 'Ready to Apply Changes?' : 'Save School Information'}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              {hasUnsavedChanges 
                ? 'You have unsaved changes. Click save to apply them across the system'
                : 'Click save to update school information in the database'
              }
            </p>
          </div>
          <button
            onClick={() => {
              console.log('🖱️ [CLICK] Save button clicked!');
              handleSaveAll();
            }}
            className={`px-8 py-4 rounded-lg font-bold text-lg inline-flex items-center gap-3 transition-all shadow-lg ${
              hasUnsavedChanges 
                ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl transform hover:scale-105' 
                : 'bg-gray-600 text-white hover:bg-gray-700 hover:shadow-xl transform hover:scale-105'
            }`}
          >
            <Save className="w-6 h-6" />
            Save All Changes
          </button>
        </div>
      </div>
    </div>
  );
}