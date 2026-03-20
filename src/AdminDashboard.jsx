import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, Edit, Trash2, Play, FileText } from 'lucide-react'; // Ensure you have lucide-react installed
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import { getAllUsers, getContent, getTests, deleteContent, deleteTest } from './services/databaseService';
import { useTheme } from './ThemeContext';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  const { isDark, toggleTheme } = useTheme();
  const [users, setUsers] = useState([]);
  const [allContent, setAllContent] = useState([]);
  const [allTests, setAllTests] = useState([]);
  const [contentLoading, setContentLoading] = useState(true);
  const [testsLoading, setTestsLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState('');

  // --- MOCK DATA (only for overview stats) ---
  const stats = [
    { label: 'Total Students', value: '1,284', grow: '+12%', icon: '🎓', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Teachers', value: '14', grow: 'Stable', icon: '👨‍🏫', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Active Courses', value: '42', grow: '+3', icon: '📚', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Revenue (Mock)', value: '₹45k', grow: '+8%', icon: '💰', color: 'text-amber-600', bg: 'bg-amber-50' },
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
            status: 'Active',
            date
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

    fetchUsers();
    fetchContent();
    fetchTests();
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      navigate('/', { replace: true });
    } catch (error) {
      console.error("Logout failed", error);
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
            { id: 'overview', icon: '📊', label: 'System Overview' },
            { id: 'users', icon: '👥', label: 'Manage Users' },
            { id: 'content', icon: '📁', label: 'Global Content' },
            { id: 'settings', icon: '⚙️', label: 'Site Settings' }
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
          <span className="text-xl">🚪</span>
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

             <button className={`px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all ${
                 isDark ? 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
             }`}>Download Logs</button>
             
             <button className="px-5 py-2.5 bg-blue-600 rounded-xl font-bold text-sm text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">+ Add New</button>
          </div>
        </div>

        {/* --- TAB 1: OVERVIEW --- */}
        {activeTab === 'overview' && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {stats.map((s, i) => (
                <div key={i} className={`p-6 rounded-[2rem] shadow-sm border transition-all group ${
                    isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200/60 hover:shadow-xl'
                }`}>
                  <div className={`w-12 h-12 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform`}>
                    {s.icon}
                  </div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{s.value}</h3>
                    <span className="text-[10px] font-bold text-emerald-500">{s.grow}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Simple Table Preview */}
            <div className={`rounded-[2.5rem] shadow-xl border p-8 transition-colors ${
                isDark ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-200/60 shadow-slate-200/40'
            }`}>
              <h3 className={`text-xl font-black mb-6 ${isDark ? 'text-white' : 'text-slate-800'}`}>Recent Platform Activity</h3>
              <p className="text-slate-400 text-sm">Showing the latest system logs and user registrations.</p>
              <div className={`mt-6 p-10 border-2 border-dashed rounded-3xl text-center font-bold ${
                  isDark ? 'border-slate-800 text-slate-700' : 'border-slate-100 text-slate-300'
              }`}>Activity Graph Placeholder</div>
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
                      <button className="text-blue-600 text-xs font-black uppercase tracking-tighter hover:text-blue-400">
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
              <div className="p-6 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}">
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
                        <button className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors">
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
              <div className="p-6 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}">
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
                          <span className={`px-2 py-1 rounded text-xs font-bold bg-purple-100 text-purple-700`}>
                            Test
                          </span>
                          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {test.questions?.length || 0} questions
                          </span>
                          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Topic: {test.topic || 'General'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors">
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
                    defaultValue="LMS Portal" 
                    className={`w-full p-4 border rounded-2xl outline-none focus:border-blue-500 transition-colors ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                    }`} 
                />
              </div>
              <div className={`flex items-center justify-between p-4 rounded-2xl transition-colors ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <span className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Enable Student Registrations</span>
                <div className="w-12 h-6 bg-blue-600 rounded-full flex items-center px-1 cursor-pointer"><div className="w-4 h-4 bg-white rounded-full ml-auto"></div></div>
              </div>
              <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-xl hover:bg-blue-700 transition-all">Save All Changes</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;