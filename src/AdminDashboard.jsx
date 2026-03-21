import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, Edit, Trash2, Play, FileText, Users, BookOpen, Award, FileCode, Settings, BarChart3, TrendingUp, Activity } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import { getAllUsers, getContent, getTests, getTopics, deleteContent, deleteTest, updateContent, updateTest, updateUser, getPlatformSettings, updatePlatformSettings } from './services/databaseService';
import { useTheme } from './ThemeContext';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  const { isDark, toggleTheme } = useTheme();
  const [users, setUsers] = useState([]);
  const [allContent, setAllContent] = useState([]);
  const [allTests, setAllTests] = useState([]);
  const [topics, setTopics] = useState([]);
  const [contentLoading, setContentLoading] = useState(true);
  const [testsLoading, setTestsLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState('');

  // Chart states
  const [chartType, setChartType] = useState('bar');
  const [chartDataField, setChartDataField] = useState('testPerformance');
  const [chartData, setChartData] = useState([]);

  // Load chart data based on selected field
  useEffect(() => {
    const loadChartData = async () => {
      let data = [];
      
      switch (chartDataField) {
        case 'testPerformance':
          // Group test history by test name and calculate average scores
          const testScores = {};
          const testCounts = {};
          users.forEach(user => {
            if (user.role === 'Student') {
              // Mock data for demonstration - in real app, fetch from getTestHistoryByUser
              const mockScore = Math.floor(Math.random() * 40) + 60; // Random score 60-100
              const testName = `Test ${user.name}`;
              testScores[testName] = (testScores[testName] || 0) + mockScore;
              testCounts[testName] = (testCounts[testName] || 0) + 1;
            }
          });
          data = Object.keys(testScores).slice(0, 5).map(name => ({
            name: name.length > 15 ? name.substring(0, 15) + '...' : name,
            value: Math.round(testScores[name] / testCounts[name]),
            fullName: name
          }));
          if (data.length === 0) {
            data = [
              { name: 'Math Quiz', value: 85 },
              { name: 'Science Test', value: 72 },
              { name: 'History Exam', value: 90 },
              { name: 'English Quiz', value: 78 },
              { name: 'CS Test', value: 95 }
            ];
          }
          break;
          
        case 'activeUsers':
          // Show active vs inactive users by role
          const roleCounts = { Student: 0, Teacher: 0, Admin: 0 };
          users.forEach(user => {
            if (roleCounts[user.role] !== undefined && user.status === 'Active') {
              roleCounts[user.role]++;
            }
          });
          data = [
            { name: 'Students', value: roleCounts.Student },
            { name: 'Teachers', value: roleCounts.Teacher },
            { name: 'Admins', value: roleCounts.Admin }
          ];
          break;
          
        case 'contentByTopic':
          // Group content by topic
          const topicCounts = {};
          allContent.forEach(content => {
            const topic = content.topic || 'General';
            topicCounts[topic] = (topicCounts[topic] || 0) + 1;
          });
          data = Object.keys(topicCounts).map(topic => ({
            name: topic.length > 15 ? topic.substring(0, 15) + '...' : topic,
            value: topicCounts[topic]
          })).slice(0, 6);
          if (data.length === 0) {
            data = [
              { name: 'General', value: 2 },
              { name: 'Python', value: 1 },
              { name: 'Java', value: 1 }
            ];
          }
          break;
          
        case 'testsByTopic':
          // Group tests by topic
          const testTopicCounts = {};
          allTests.forEach(test => {
            const topic = test.topic || 'General';
            testTopicCounts[topic] = (testTopicCounts[topic] || 0) + 1;
          });
          data = Object.keys(testTopicCounts).map(topic => ({
            name: topic.length > 15 ? topic.substring(0, 15) + '...' : topic,
            value: testTopicCounts[topic]
          })).slice(0, 6);
          if (data.length === 0) {
            data = [{ name: 'General', value: 1 }];
          }
          break;
          
        default:
          data = [];
      }
      
      setChartData(data);
    };
    
    loadChartData();
  }, [chartDataField, users, allContent, allTests]);
  
  // Modal states for editing
  const [showContentModal, setShowContentModal] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const [editContentForm, setEditContentForm] = useState({ title: '', topic: '', youtubeUrl: '', driveUrl: '' });

  const [showTestModal, setShowTestModal] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [editTestForm, setEditTestForm] = useState({ test_name: '', topic: '' });

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editUserForm, setEditUserForm] = useState({ name: '', role_id: 3, status: 'Active' });

  // Settings states
  const [platformName, setPlatformName] = useState('LMS Portal');
  const [studentRegistrationEnabled, setStudentRegistrationEnabled] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(false);

  const totalStudents = users.filter((u) => u.role === 'Student').length;
  const totalTeachers = users.filter((u) => u.role === 'Teacher').length;
  const totalAdmins = users.filter((u) => u.role === 'Admin').length;
  const activeCourses = topics.length;
  const totalContent = allContent.length;
  const totalTests = allTests.length;

  const stats = [
    { label: 'Total Students', value: String(totalStudents), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Teachers', value: String(totalTeachers), icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Active Courses', value: String(activeCourses), icon: FileCode, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Content', value: String(totalContent), icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Total Tests', value: String(totalTests), icon: Award, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Total Admins', value: String(totalAdmins), icon: Settings, color: 'text-slate-600', bg: 'bg-slate-50' }
  ];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setUsersLoading(true);
        setUsersError('');
        const rawUsers = await getAllUsers();

        const roleMap = {
          1: 'Admin',
          2: 'Teacher',
          3: 'Student'
        };

        const mapped = rawUsers.map((u) => {
          const createdAt =
            u.createdAt && typeof u.createdAt.toDate === 'function'
              ? u.createdAt.toDate()
              : u.createdAt
              ? new Date(u.createdAt)
              : null;

          const createdAtMs = createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt.getTime() : 0;

          const date =
            createdAt && !Number.isNaN(createdAt.getTime())
              ? createdAt.toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })
              : '-';

          const role =
            u.role ||
            roleMap[u.role_id] ||
            'Student';

          return {
            id: u.id,
            name: u.name || (u.email ? u.email.split('@')[0] : 'Unknown'),
            email: u.email || '',
            role,
            status: u.status || 'Active',
            date,
            createdAtMs
          };
        });

        setUsers(mapped);
      } catch (error) {
        console.error('Failed to load users', error);
        setUsersError('Failed to load users.');
      } finally {
        setUsersLoading(false);
      }
    };

    const fetchContent = async () => {
      try {
        setContentLoading(true);
        const content = await getContent();
        console.log('Admin - All content:', content);
        console.log('Admin - Content count:', content?.length || 0);
        if (content?.length > 0) {
          console.log('Admin - First content item fields:', Object.keys(content[0]));
          console.log('Admin - Sample uploader fields:', content.slice(0, 3).map(c => ({ id: c.id, uploadedBy: c.uploadedBy, uploader_id: c.uploader_id, title: c.title })));
        }
        setAllContent(content || []);
      } catch (error) {
        console.error('Failed to load content', error);
      } finally {
        setContentLoading(false);
      }
    };

    const fetchTests = async () => {
      try {
        setTestsLoading(true);
        const tests = await getTests();
        setAllTests(tests || []);
      } catch (error) {
        console.error('Failed to load tests', error);
      } finally {
        setTestsLoading(false);
      }
    };

    const fetchTopics = async () => {
      try {
        const t = await getTopics();
        setTopics(t || []);
      } catch (error) {
        console.error('Failed to load topics', error);
        setTopics([]);
      }
    };

    const loadSettings = async () => {
      try {
        const settings = await getPlatformSettings();
        setPlatformName(settings.platformName || 'LMS Portal');
        setStudentRegistrationEnabled(settings.studentRegistrationEnabled !== false);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    fetchUsers();
    fetchContent();
    fetchTests();
    fetchTopics();
    loadSettings();
  }, []);

  const handleDeleteContent = async (contentId) => {
    if (!confirm('Delete this content? This action cannot be undone.')) return;
    try {
      await deleteContent(contentId);
      setAllContent(prev => prev.filter(c => c.id !== contentId));
    } catch (error) {
      console.error('Failed to delete content:', error);
      alert('Failed to delete content.');
    }
  };

  const handleDeleteTest = async (testId) => {
    if (!confirm('Delete this test? This action cannot be undone.')) return;
    try {
      await deleteTest(testId);
      setAllTests(prev => prev.filter(t => t.id !== testId));
    } catch (error) {
      console.error('Failed to delete test:', error);
      alert('Failed to delete test.');
    }
  };

  const handleEditContent = (content) => {
    setEditingContent(content);
    setEditContentForm({
      title: content.title || '',
      topic: content.topic || '',
      youtubeUrl: content.youtubeUrl || '',
      driveUrl: content.driveUrl || ''
    });
    setShowContentModal(true);
  };

  const handleSaveContent = async () => {
    if (!editingContent) return;
    try {
      const updated = {
        title: editContentForm.title.trim(),
        topic: editContentForm.topic.trim(),
        youtubeUrl: editContentForm.youtubeUrl.trim(),
        driveUrl: editContentForm.driveUrl.trim()
      };
      await updateContent(editingContent.id, updated);
      setAllContent((prev) => prev.map((c) => (c.id === editingContent.id ? { ...c, ...updated } : c)));
      setShowContentModal(false);
      setEditingContent(null);
    } catch (error) {
      console.error('Failed to edit content:', error);
      alert('Failed to edit content.');
    }
  };

  const handleEditTest = (test) => {
    setEditingTest(test);
    setEditTestForm({
      test_name: test.test_name || '',
      topic: test.topic || ''
    });
    setShowTestModal(true);
  };

  const handleSaveTest = async () => {
    if (!editingTest) return;
    try {
      const updated = {
        test_name: editTestForm.test_name.trim(),
        topic: editTestForm.topic.trim()
      };
      await updateTest(editingTest.id, updated);
      setAllTests((prev) => prev.map((t) => (t.id === editingTest.id ? { ...t, ...updated } : t)));
      setShowTestModal(false);
      setEditingTest(null);
    } catch (error) {
      console.error('Failed to edit test:', error);
      alert('Failed to edit test.');
    }
  };

  const handleEditUser = (user) => {
    const roleToId = { Admin: 1, Teacher: 2, Student: 3 };
    setEditingUser(user);
    setEditUserForm({
      name: user.name || '',
      role_id: roleToId[user.role] || 3,
      status: user.status || 'Active'
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    const idToRole = { 1: 'Admin', 2: 'Teacher', 3: 'Student' };
    try {
      const updated = {
        name: editUserForm.name.trim(),
        role_id: editUserForm.role_id,
        status: editUserForm.status
      };
      await updateUser(editingUser.id, updated);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? { ...u, name: updated.name, role: idToRole[updated.role_id], status: updated.status }
            : u
        )
      );
      setShowUserModal(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Failed to edit user:', error);
      alert('Failed to edit user.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      navigate('/', { replace: true });
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSettingsLoading(true);
      await updatePlatformSettings({
        platformName,
        studentRegistrationEnabled
      });
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings.');
    } finally {
      setSettingsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex font-sans antialiased transition-colors duration-500 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#f1f5f9] text-slate-900'}`}>
      
      {/* --- SIDEBAR --- */}
      {/* Sidebar stays dark-themed as per your original design, but adjusts borders */}
      <aside className={`w-72 flex flex-col p-6 sticky top-0 h-screen shadow-2xl transition-colors ${isDark ? 'bg-black border-r border-slate-800' : 'bg-[#0f172a] text-white'}`}>
        <div className="mb-10 px-2 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xl text-white">A</div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">Admin</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">LMS Controller</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { id: 'overview', icon: '', label: 'System Overview' },
            { id: 'users', icon: '', label: 'Manage Users' },
            { id: 'content', icon: '', label: 'Global Content' },
            { id: 'settings', icon: '', label: 'Site Settings' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all duration-300 group ${
                activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 scale-[1.02]' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>

        <button onClick={handleLogout} className="mt-auto flex items-center gap-4 p-4 rounded-2xl font-bold text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer">
          <span className="text-xl"></span>
          <span className="text-sm">Log out</span>
        </button>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className={`text-3xl font-black tracking-tight capitalize ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {activeTab.replace('-', ' ')}
            </h2>
            <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} font-medium mt-1`}>Manage your platform controls and data.</p>
          </div>
          <div className="flex gap-3 items-center">
             {/* THEME TOGGLE BUTTON */}
             <button 
               onClick={toggleTheme}
                className={`p-2.5 rounded-xl border transition-all duration-300 shadow-sm ${
                    isDark ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
             >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
             </button>
          </div>
        </div>

        {/* --- TAB 1: OVERVIEW --- */}
        {activeTab === 'overview' && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {stats.map((s, i) => {
                const IconComponent = s.icon;
                return (
                  <div key={i} className={`p-6 rounded-[2rem] shadow-sm border transition-all group ${
                      isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200/60 hover:shadow-xl'
                  }`}>
                    <div className={`w-12 h-12 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <IconComponent size={24} />
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{s.value}</h3>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Analytics Chart Section */}
            <div className={`rounded-[2.5rem] shadow-xl border p-8 transition-colors ${
                isDark ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-200/60 shadow-slate-200/40'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <BarChart3 className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>Analytics Dashboard</h3>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  {/* Chart Type Toggle */}
                  <div className={`p-1 rounded-xl flex ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <button
                      onClick={() => setChartType('bar')}
                      className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 ${
                        chartType === 'bar'
                          ? (isDark ? 'bg-slate-700 text-blue-400' : 'bg-white text-blue-600 shadow-sm')
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <BarChart3 size={14} /> Bar
                    </button>
                    <button
                      onClick={() => setChartType('line')}
                      className={`px-4 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 ${
                        chartType === 'line'
                          ? (isDark ? 'bg-slate-700 text-blue-400' : 'bg-white text-blue-600 shadow-sm')
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <TrendingUp size={14} /> Line
                    </button>
                  </div>

                  {/* Data Field Selector */}
                  <select
                    value={chartDataField}
                    onChange={(e) => setChartDataField(e.target.value)}
                    className={`px-4 py-2 rounded-xl font-bold text-xs outline-none border transition-colors ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-white' 
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <option value="testPerformance">Test Performance</option>
                    <option value="activeUsers">Active Users by Role</option>
                    <option value="contentByTopic">Content by Topic</option>
                    <option value="testsByTopic">Tests by Topic</option>
                  </select>
                </div>
              </div>

              {/* Chart */}
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'bar' ? (
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }}
                        axisLine={{ stroke: isDark ? '#475569' : '#cbd5e1' }}
                      />
                      <YAxis 
                        tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }}
                        axisLine={{ stroke: isDark ? '#475569' : '#cbd5e1' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: isDark ? '#1e293b' : '#ffffff',
                          border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`,
                          borderRadius: '12px',
                          color: isDark ? '#f1f5f9' : '#1e293b'
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        fill={chartDataField === 'testPerformance' ? '#3b82f6' : 
                              chartDataField === 'activeUsers' ? '#10b981' : 
                              chartDataField === 'contentByTopic' ? '#f59e0b' : '#8b5cf6'}
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  ) : (
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }}
                        axisLine={{ stroke: isDark ? '#475569' : '#cbd5e1' }}
                      />
                      <YAxis 
                        tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }}
                        axisLine={{ stroke: isDark ? '#475569' : '#cbd5e1' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: isDark ? '#1e293b' : '#ffffff',
                          border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`,
                          borderRadius: '12px',
                          color: isDark ? '#f1f5f9' : '#1e293b'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke={chartDataField === 'testPerformance' ? '#3b82f6' : 
                                chartDataField === 'activeUsers' ? '#10b981' : 
                                chartDataField === 'contentByTopic' ? '#f59e0b' : '#8b5cf6'}
                        strokeWidth={3}
                        dot={{ fill: isDark ? '#1e293b' : '#ffffff', strokeWidth: 2, r: 5 }}
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>

              {/* Chart Info */}
              <div className="mt-4 flex items-center gap-2 text-xs font-medium">
                <Activity size={14} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                  Showing: {chartDataField === 'testPerformance' ? 'Average Test Scores' : 
                            chartDataField === 'activeUsers' ? 'Active Users by Role' : 
                            chartDataField === 'contentByTopic' ? 'Content Distribution by Topic' : 
                            'Tests Distribution by Topic'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 2: MANAGE USERS --- */}
        {activeTab === 'users' && (
          <div className={`rounded-[2.5rem] shadow-xl border overflow-hidden animate-in fade-in duration-500 transition-colors ${
              isDark ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-200/60'
          }`}>
            <table className="w-full text-left border-collapse">
              <thead className={`${isDark ? 'bg-slate-800/50' : 'bg-slate-50/50'}`}>
                <tr>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">User Details</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                {usersLoading && (
                  <tr>
                    <td colSpan="4" className="p-6 text-center text-sm text-slate-500">
                      Loading users...
                    </td>
                  </tr>
                )}
                {!usersLoading && usersError && (
                  <tr>
                    <td colSpan="4" className="p-6 text-center text-sm text-red-500">
                      {usersError}
                    </td>
                  </tr>
                )}
                {!usersLoading && !usersError && users.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-6 text-center text-sm text-slate-500">
                      No users found.
                    </td>
                  </tr>
                )}
                {!usersLoading && !usersError && users.map((u) => (
                  <tr key={u.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-blue-50/30'}`}>
                    <td className="p-6">
                      <p className={`font-bold text-sm ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{u.name}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{u.role}</span>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${u.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>{u.status}</span>
                    </td>
                    <td className="p-6">
                      <button
                        onClick={() => handleEditUser(u)}
                        className="text-blue-600 text-xs font-black uppercase tracking-tighter hover:text-blue-400"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* --- TAB 3: GLOBAL CONTENT --- */}
        {activeTab === 'content' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Content Section */}
            <div className={`rounded-[2.5rem] shadow-xl border overflow-hidden transition-colors ${
              isDark ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-200/60'
            }`}>
              <div className={`p-6 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>All Learning Content</h3>
              </div>
              <div className="p-6 space-y-4">
                {contentLoading ? (
                  <div className="flex justify-center items-center h-24">
                    <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600"></div>
                  </div>
                ) : allContent.length === 0 ? (
                  <div className={`text-center p-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <FileText className="mx-auto mb-4" size={48} />
                    <p className="text-lg font-bold">No content available</p>
                    <p className="text-sm mt-2">Teachers haven't uploaded any content yet.</p>
                  </div>
                ) : (
                  allContent.map((content) => (
                    <div key={content.id} className={`p-4 border rounded-2xl flex items-center justify-between gap-4 ${
                      isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'
                    }`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {content.type === 'video' ? (
                            <Play className="w-5 h-5 text-red-500" size={16} />
                          ) : (
                            <FileText className="w-5 h-5 text-blue-500" size={16} />
                          )}
                          <h4 className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{content.title}</h4>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            content.type === 'video' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {content.type === 'video' ? 'Video' : 'Document'}
                          </span>
                          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Topic: {content.topic || 'General'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditContent(content)} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors">
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteContent(content.id)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Tests Section */}
            <div className={`rounded-[2.5rem] shadow-xl border overflow-hidden transition-colors ${
              isDark ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-200/60'
            }`}>
              <div className={`p-6 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>All Tests</h3>
              </div>
              <div className="p-6 space-y-4">
                {testsLoading ? (
                  <div className="flex justify-center items-center h-24">
                    <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600"></div>
                  </div>
                ) : allTests.length === 0 ? (
                  <div className={`text-center p-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <FileText className="mx-auto mb-4" size={48} />
                    <p className="text-lg font-bold">No tests available</p>
                    <p className="text-sm mt-2">Teachers haven't created any tests yet.</p>
                  </div>
                ) : (
                  allTests.map((test) => (
                    <div key={test.id} className={`p-4 border rounded-2xl flex items-center justify-between gap-4 ${
                      isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'
                    }`}>
                      <div className="flex-1">
                        <h4 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>{test.test_name || 'Untitled Test'}</h4>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="px-2 py-1 rounded text-xs font-bold bg-purple-100 text-purple-700">Test</span>
                          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {test.questions?.length || 0} questions
                          </span>
                          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Topic: {test.topic || 'General'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditTest(test)} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors">
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteTest(test.id)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 4: SITE SETTINGS --- */}
        {activeTab === 'settings' && (
          <div className={`max-w-2xl p-10 rounded-[2.5rem] shadow-xl border animate-in fade-in duration-500 transition-colors ${
              isDark ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-200/60'
          }`}>
            <h3 className={`text-xl font-black mb-8 ${isDark ? 'text-white' : 'text-slate-800'}`}>Platform Configuration</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Platform Name</label>
                <input 
                    type="text" 
                    value={platformName}
                    onChange={(e) => setPlatformName(e.target.value)}
                    className={`w-full p-4 border rounded-2xl outline-none focus:border-blue-500 transition-colors ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`} 
                />
              </div>
              <div className={`flex items-center justify-between p-4 rounded-2xl transition-colors ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <span className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Enable Student Registrations</span>
                <button
                  onClick={() => setStudentRegistrationEnabled(!studentRegistrationEnabled)}
                  className={`w-12 h-6 rounded-full flex items-center px-1 cursor-pointer transition-colors ${
                    studentRegistrationEnabled ? 'bg-blue-600' : (isDark ? 'bg-slate-600' : 'bg-slate-300')
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    studentRegistrationEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}></div>
                </button>
              </div>
              <button 
                onClick={handleSaveSettings}
                disabled={settingsLoading}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {settingsLoading ? 'Saving...' : 'Save All Changes'}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* --- CONTENT EDIT MODAL --- */}
      {showContentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-lg p-6 rounded-[2rem] shadow-2xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
            <h3 className={`text-xl font-black mb-6 ${isDark ? 'text-white' : 'text-slate-800'}`}>Edit Content</h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Title</label>
                <input
                  type="text"
                  value={editContentForm.title}
                  onChange={(e) => setEditContentForm({ ...editContentForm, title: e.target.value })}
                  className={`w-full p-3 border rounded-xl outline-none focus:border-blue-500 transition-colors ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Topic</label>
                <input
                  type="text"
                  value={editContentForm.topic}
                  onChange={(e) => setEditContentForm({ ...editContentForm, topic: e.target.value })}
                  className={`w-full p-3 border rounded-xl outline-none focus:border-blue-500 transition-colors ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>YouTube URL</label>
                <input
                  type="url"
                  value={editContentForm.youtubeUrl}
                  onChange={(e) => setEditContentForm({ ...editContentForm, youtubeUrl: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                  className={`w-full p-3 border rounded-xl outline-none focus:border-blue-500 transition-colors ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 placeholder-slate-400'}`}
                />
              </div>
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Google Drive URL</label>
                <input
                  type="url"
                  value={editContentForm.driveUrl}
                  onChange={(e) => setEditContentForm({ ...editContentForm, driveUrl: e.target.value })}
                  placeholder="https://drive.google.com/file/d/..."
                  className={`w-full p-3 border rounded-xl outline-none focus:border-blue-500 transition-colors ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 placeholder-slate-400'}`}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveContent}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => { setShowContentModal(false); setEditingContent(null); }}
                  className={`flex-1 py-3 rounded-xl font-bold transition-colors ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TEST EDIT MODAL --- */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-lg p-6 rounded-[2rem] shadow-2xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
            <h3 className={`text-xl font-black mb-6 ${isDark ? 'text-white' : 'text-slate-800'}`}>Edit Test</h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Test Name</label>
                <input
                  type="text"
                  value={editTestForm.test_name}
                  onChange={(e) => setEditTestForm({ ...editTestForm, test_name: e.target.value })}
                  className={`w-full p-3 border rounded-xl outline-none focus:border-blue-500 transition-colors ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Topic</label>
                <input
                  type="text"
                  value={editTestForm.topic}
                  onChange={(e) => setEditTestForm({ ...editTestForm, topic: e.target.value })}
                  className={`w-full p-3 border rounded-xl outline-none focus:border-blue-500 transition-colors ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveTest}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => { setShowTestModal(false); setEditingTest(null); }}
                  className={`flex-1 py-3 rounded-xl font-bold transition-colors ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- USER EDIT MODAL --- */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-lg p-6 rounded-[2rem] shadow-2xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
            <h3 className={`text-xl font-black mb-6 ${isDark ? 'text-white' : 'text-slate-800'}`}>Edit User</h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Name</label>
                <input
                  type="text"
                  value={editUserForm.name}
                  onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                  className={`w-full p-3 border rounded-xl outline-none focus:border-blue-500 transition-colors ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Role</label>
                <select
                  value={editUserForm.role_id}
                  onChange={(e) => setEditUserForm({ ...editUserForm, role_id: Number(e.target.value) })}
                  className={`w-full p-3 border rounded-xl outline-none focus:border-blue-500 transition-colors ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                >
                  <option value={1}>Admin</option>
                  <option value={2}>Teacher</option>
                  <option value={3}>Student</option>
                </select>
              </div>
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Status</label>
                <select
                  value={editUserForm.status}
                  onChange={(e) => setEditUserForm({ ...editUserForm, status: e.target.value })}
                  className={`w-full p-3 border rounded-xl outline-none focus:border-blue-500 transition-colors ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                >
                  <option value="Active">Active</option>
                  <option value="Disabled">Disabled</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveUser}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => { setShowUserModal(false); setEditingUser(null); }}
                  className={`flex-1 py-3 rounded-xl font-bold transition-colors ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;