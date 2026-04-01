import React, { useState, useEffect } from 'react';
import { X, Users, BookOpen, Clock, Search, Download, UserCheck, MapPin, Phone, Mail, Calendar } from 'lucide-react';
import Badge from '@/components/Badge';

interface Student {
  id: string;
  name: string;
  image: string;
  age: number;
  class: string;
  gender: 'Male' | 'Female';
}

interface Parent {
  id: string;
  type: 'father' | 'mother';
  name: string;
  photo: string;
  gender: string;
  occupation: string;
  residentialAddress: string;
  childrenIds: string[];
  password: string;
}

interface AttendanceLog {
  id: string;
  parentId: string;
  parentName: string;
  childrenIds: string[];
  childrenNames: string[];
  type: 'clock-in' | 'clock-out';
  timestamp: string;
}

interface ViewSchoolDatabaseProps {
  schoolId: string;
  schoolName: string;
  onClose: () => void;
}

export default function ViewSchoolDatabase({ schoolId, schoolName, onClose }: ViewSchoolDatabaseProps) {
  const [activeTab, setActiveTab] = useState<'students' | 'parents' | 'attendance'>('students');
  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Load data from localStorage
    const storedStudents = localStorage.getItem('students');
    const storedParents = localStorage.getItem('parents');
    const storedLogs = localStorage.getItem('attendanceLogs');

    if (storedStudents) {
      setStudents(JSON.parse(storedStudents));
    }
    if (storedParents) {
      setParents(JSON.parse(storedParents));
    }
    if (storedLogs) {
      setAttendanceLogs(JSON.parse(storedLogs));
    }
  }, []);

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.name : 'Unknown';
  };

  const getChildrenForParent = (parent: Parent) => {
    return students.filter(s => parent.childrenIds.includes(s.id));
  };

  // Group parents by family (same children)
  const groupParentsByFamily = (parentsList: Parent[]) => {
    const families: { [key: string]: Parent[] } = {};
    const processed = new Set<string>();

    parentsList.forEach(parent => {
      if (processed.has(parent.id)) return;

      const childrenKey = [...parent.childrenIds].sort().join(',');
      if (!families[childrenKey]) {
        families[childrenKey] = [];
      }
      families[childrenKey].push(parent);
      processed.add(parent.id);
    });

    return Object.values(families);
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.class.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredParents = parents.filter(parent =>
    parent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    parent.occupation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedFamilies = groupParentsByFamily(filteredParents);

  const filteredLogs = attendanceLogs.filter(log =>
    log.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.childrenNames.some(name => name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-purple-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-purple-600 w-12 h-12 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{schoolName} Database</h3>
                <p className="text-sm text-gray-600">Complete student, parent, and attendance records</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex-shrink-0">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
              <div className="bg-blue-100 w-10 h-10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Students</p>
                <p className="text-xl font-bold text-gray-900">{students.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
              <div className="bg-green-100 w-10 h-10 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Families</p>
                <p className="text-xl font-bold text-gray-900">{groupParentsByFamily(parents).length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
              <div className="bg-purple-100 w-10 h-10 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Attendance Logs</p>
                <p className="text-xl font-bold text-gray-900">{attendanceLogs.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex gap-4 px-6">
            {[
              { id: 'students', label: 'Students', icon: Users, count: students.length },
              { id: 'parents', label: 'Families', icon: UserCheck, count: groupParentsByFamily(parents).length },
              { id: 'attendance', label: 'Attendance', icon: Clock, count: attendanceLogs.length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
                <Badge size="sm" variant="default">{tab.count}</Badge>
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-white border-b border-gray-200 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Students Tab */}
          {activeTab === 'students' && (
            <div className="space-y-4">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No students found</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredStudents.map(student => (
                    <div key={student.id} className="bg-white rounded-2xl border-2 border-gray-100 p-4 hover:border-purple-300 transition-all hover:shadow-lg">
                      <div className="flex items-start gap-3">
                        <img
                          src={student.image}
                          alt={student.name}
                          className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-gray-100"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 mb-1">{student.name}</h4>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>{student.class}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge size="sm" variant={student.gender === 'Male' ? 'blue' : 'pink'}>
                                {student.gender}
                              </Badge>
                              <Badge size="sm" variant="default">
                                Age {student.age}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">Student ID: {student.id}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Parents Tab */}
          {activeTab === 'parents' && (
            <div className="space-y-4">
              {groupedFamilies.length === 0 ? (
                <div className="text-center py-12">
                  <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No parents found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {groupedFamilies.map((family, familyIndex) => {
                    const children = getChildrenForParent(family[0]);
                    return (
                      <div key={familyIndex} className="bg-white rounded-2xl border-2 border-gray-100 p-5 hover:border-purple-300 transition-all hover:shadow-lg">
                        {/* Family Header */}
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                          <Users className="w-5 h-5 text-purple-600" />
                          <h4 className="font-bold text-gray-900">Family {familyIndex + 1}</h4>
                          <Badge size="sm" variant="purple">{family.length} Parent{family.length > 1 ? 's' : ''}</Badge>
                        </div>

                        {/* Parents Row */}
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          {family.map(parent => (
                            <div key={parent.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                              <div className="flex items-start gap-3">
                                <img
                                  src={parent.photo}
                                  alt={parent.name}
                                  className="w-14 h-14 rounded-xl object-cover flex-shrink-0 bg-gray-100"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h5 className="font-bold text-gray-900">{parent.name}</h5>
                                    <Badge size="sm" variant={parent.type === 'father' ? 'blue' : 'pink'}>
                                      {parent.type}
                                    </Badge>
                                  </div>
                                  
                                  <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                      <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                                      <span>{parent.occupation}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                      <span className="truncate">{parent.residentialAddress}</span>
                                    </div>
                                  </div>

                                  <div className="mt-3 pt-3 border-t border-gray-200">
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                      <span>ID: {parent.id}</span>
                                      <span>PWD: {parent.password}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {/* If only one parent, show placeholder */}
                          {family.length === 1 && (
                            <div className="bg-gray-50 rounded-xl p-4 border border-dashed border-gray-300 flex items-center justify-center">
                              <div className="text-center">
                                <UserCheck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">No second parent registered</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Children Section */}
                        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                          <p className="text-sm font-semibold text-purple-900 mb-3">Children ({children.length})</p>
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {children.map(child => (
                              <div key={child.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-purple-200">
                                <img
                                  src={child.image}
                                  alt={child.name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{child.name}</p>
                                  <p className="text-xs text-gray-500">{child.class}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No attendance logs found</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date & Time</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Parent</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Children</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredLogs.map(log => {
                        const logDate = new Date(log.timestamp);
                        return (
                          <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {logDate.toLocaleDateString()}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {logDate.toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-gray-900">{log.parentName}</p>
                              <p className="text-xs text-gray-500">ID: {log.parentId}</p>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {log.childrenNames.map((name, idx) => (
                                  <Badge key={idx} size="sm" variant="blue">
                                    {name}
                                  </Badge>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge 
                                variant={log.type === 'clock-in' ? 'success' : 'warning'}
                                size="sm"
                              >
                                {log.type === 'clock-in' ? 'Clock In' : 'Clock Out'}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center flex-shrink-0">
          <div className="text-sm text-gray-600">
            Showing {
              activeTab === 'students' ? filteredStudents.length :
              activeTab === 'parents' ? groupedFamilies.length :
              filteredLogs.length
            } {activeTab === 'students' ? 'students' : activeTab === 'parents' ? 'families' : 'logs'}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
