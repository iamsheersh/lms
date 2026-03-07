import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, BookOpen, Play, FileText, Clock, TrendingUp } from 'lucide-react';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { getTopics, getMaterialsByTopic, getTestHistoryByUser, getStudentDashboardData, updateVideoProgress, getVideoProgressByUser, getPublishedTestsByTopic } from './services/databaseService';
import TestComponent from './components/TestComponent';
import { useTheme } from './ThemeContext';

const StudentDashboard = () => {
  const navigate = useNavigate();
  
  // Theme State
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data States
  const [testHistory, setTestHistory] = useState([]);
  const [topics, setTopics] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTest, setShowTest] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null); // FIXED: Added missing state
  const [progress, setProgress] = useState({ completedContent: 0, totalContent: 0, averageCompletion: 0 });

  // Load user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          // Load comprehensive student dashboard data
          const dashboardData = await getStudentDashboardData(user.uid);
          setTestHistory(dashboardData.testHistory);
          setTopics(dashboardData.availableContent.map((content, index) => ({
            id: `topic-${index}`,
            name: content.topic,
            description: `Content related to ${content.topic}`,
            icon: '📚'
          })));
          // Calculate overall progress from video progress
          const overallProgress = dashboardData.overallProgress;
          setProgress({
            completedContent: overallProgress.completedContent,
            totalContent: overallProgress.totalContent,
            averageCompletion: overallProgress.averageCompletion
          });
        } catch (err) {
          setError('Failed to load data. Please refresh.');
          console.error('Data loading error:', err);
        }
      } else {
        setCurrentUser(null);
        setTestHistory([]);
        setTopics([]);
        setProgress({ completedContent: 0, totalContent: 0, averageCompletion: 0 });
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const loadTopicItems = async () => {
      if (!selectedTopic) {
        setMaterials([]);
        return;
      }

      try {
        const topicName = selectedTopic.name;
        const [topicMaterials, topicTests] = await Promise.all([
          getMaterialsByTopic(topicName),
          getPublishedTestsByTopic(topicName)
        ]);

        const mappedMaterials = (topicMaterials || []).map((m) => ({
          id: m.id,
          type: m.type,
          name: m.title,
          url: m.url
        }));

        const mappedTests = (topicTests || []).map((t) => ({
          id: t.id,
          type: 'test',
          name: t.test_name,
          test: t
        }));

        setMaterials([...mappedTests, ...mappedMaterials]);
      } catch (e) {
        console.error('Error loading topic items:', e);
        setMaterials([]);
      }
    };

    loadTopicItems();
  }, [selectedTopic]);

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
    <div className={`min-h-screen flex font-sans antialiased transition-colors duration-500 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#f8fafc] text-slate-900'}`}>
      {/* --- SIDEBAR --- */}
      <aside className={`w-72 flex flex-col p-6 sticky top-0 h-screen shadow-2xl transition-colors ${isDark ? 'bg-black border-r border-slate-800' : 'bg-[#0f172a] text-white'}`}>
        <div className="mb-10 px-2 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xl text-white">S</div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">Student</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Learning Portal</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { id: 'overview', icon: '📊', label: 'Overview' },
            { id: 'scores', icon: '📈', label: 'View Scores' },
            { id: 'tests', icon: '📝', label: 'Tests Attempted' },
            { id: 'materials', icon: '📚', label: 'Study Materials' },
            { id: 'progress', icon: '📈', label: 'My Progress' }
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
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <button 
          onClick={handleLogout} 
          className="mt-auto flex items-center gap-4 p-4 rounded-2xl font-bold text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer"
        >
          <span className="text-xl">🚪</span>
          <span className="text-sm">Log out</span>
        </button>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto relative">
        <button 
          onClick={toggleTheme}
          className={`absolute top-8 right-8 p-3 rounded-full border transition-all shadow-lg z-50 ${isDark ? 'bg-slate-800 border-slate-700 text-yellow-400' : 'bg-white border-slate-200 text-slate-600'}`}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {activeTab === 'overview' && (
          <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className={`text-3xl font-black mb-8 tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>Overview</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* MARKS HISTORY SECTION */}
              <div className="space-y-6">
                <div className={`p-6 rounded-3xl shadow-sm border transition-all ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                }`}>
                  <h2 className={`text-lg font-bold mb-4 tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>Recent Test Performance</h2>
                  <div className="space-y-3">
                    {loading ? (
                      <div className="flex justify-center items-center h-20">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : error ? (
                      <div className={`p-4 text-center text-red-600 text-sm ${isDark ? 'bg-red-900/20' : 'bg-red-50'}`}>
                        {error}
                      </div>
                    ) : testHistory.length === 0 ? (
                      <div className={`p-4 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <BookOpen className="mx-auto mb-2" size={24} />
                        <p className="text-sm">No tests completed yet. Start learning to see your progress!</p>
                      </div>
                    ) : (
                      testHistory.slice(0, 5).map((test) => (
                        <div key={test.id} className={`p-4 border rounded-2xl flex justify-between items-center group hover:shadow-md transition-all ${
                          isDark ? 'bg-slate-950 border-slate-800 hover:bg-slate-900' : 'bg-slate-50/50 border-slate-50 hover:bg-white'
                        }`}>
                          <div className="flex-1">
                            <p className={`font-bold text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{test.test_name || test.topic || 'Test'}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="w-3 h-3" size={12} />
                              <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                {new Date(test.date_taken?.toDate?.() || test.date_taken || Date.now()).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-blue-500 font-black text-lg">{test.score}%</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* TOPIC SELECTION */}
              <div className="lg:col-span-2 space-y-6">
                <div className={`p-6 rounded-3xl shadow-sm border transition-all ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                }`}>
                  <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>Choose a Topic to Study</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {loading ? (
                      <div className="col-span-2 flex justify-center items-center h-20">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : topics.length === 0 ? (
                      <div className={`col-span-2 text-center p-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <BookOpen className="mx-auto mb-2" size={32} />
                        <p>No topics available yet. Check back later!</p>
                      </div>
                    ) : (
                      topics.map((topic) => (
                        <button
                          key={topic.id}
                          onClick={() => setSelectedTopic(topic)}
                          className={`p-4 rounded-2xl text-left border-2 transition-all duration-200 group ${
                            selectedTopic?.id === topic.id 
                              ? (isDark ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50') 
                              : (isDark ? 'border-slate-800 bg-slate-800 hover:border-slate-700 hover:bg-slate-900' : 'border-slate-50 bg-slate-50 hover:border-slate-200 hover:bg-white')
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{topic.icon || '📚'}</span>
                            <p className={`font-bold transition ${selectedTopic?.id === topic.id ? 'text-blue-400' : (isDark ? 'text-slate-300 group-hover:text-blue-400' : 'text-slate-600 group-hover:text-blue-600')}`}>
                              {topic.name}
                            </p>
                          </div>
                          <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'} line-clamp-2`}>
                            {topic.description}
                          </p>
                          <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest group-hover:text-blue-600">Select Topic</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* DYNAMIC CONTENT */}
                <div className={`p-6 rounded-3xl shadow-sm border min-h-[200px] transition-all ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
                }`}>
                  <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>Study Materials & Tests</h2>
                  {selectedTopic ? (
                    <div className="space-y-3">
                      <p className={`text-sm mb-4 uppercase font-bold tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Selected: {selectedTopic.name}</p>
                      <h3 className={`text-sm font-medium mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Available Materials</h3>
                      {materials.length === 0 ? (
                        <div className={`text-center py-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          <FileText className="mx-auto mb-2" size={32} />
                          <p className="text-sm">No materials available for this topic yet.</p>
                        </div>
                      ) : (
                        materials.map((material) => (
                          <div key={material.id} className={`flex justify-between items-center p-4 border rounded-2xl transition cursor-pointer group hover:shadow-md ${
                            isDark ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' : 'bg-white border-slate-100 hover:shadow-md'
                          }`}>
                            <div className="flex items-center gap-3">
                              {material.type === 'video' && <Play className="w-5 h-5 text-red-500" size={16} />}
                              {material.type === 'pdf' && <FileText className="w-5 h-5 text-blue-500" size={16} />}
                              {material.type === 'simulation' && <BookOpen className="w-5 h-5 text-green-500" size={16} />}
                              {material.type === 'test' && <BookOpen className="w-5 h-5 text-purple-500" size={16} />}
                              <div>
                                <span className={`font-bold transition ${isDark ? 'text-slate-300 group-hover:text-blue-400' : 'text-slate-600 group-hover:text-blue-600'}`}>
                                  {material.name}
                                </span>
                              </div>
                            </div>
                            <button 
                              onClick={() => {
                                if (material.type === 'test') {
                                  setSelectedTest(material.test);
                                  setShowTest(true);
                                  return;
                                }
                                window.open(material.url, '_blank');
                              }}
                              className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                            >
                              {material.type === 'test' ? 'Take Test' : material.type === 'video' ? 'Watch' : material.type === 'pdf' ? 'View' : 'Start'}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                      <BookOpen className="mb-2" size={32} />
                      <p className="text-sm font-medium italic">Please select a topic from above to see materials and take tests.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'scores' && (
          <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className={`text-3xl font-black mb-8 tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>View Scores</h2>
            <div className={`rounded-[2rem] shadow-xl border overflow-hidden transition-colors ${isDark ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-100 shadow-slate-200/50'}`}>
              <div className="p-6 space-y-3">
                {loading ? (
                  <div className="flex justify-center items-center h-24">
                    <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600"></div>
                  </div>
                ) : testHistory.length === 0 ? (
                  <div className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No test scores yet.</div>
                ) : (
                  testHistory.map((test) => (
                    <div key={test.id} className={`p-5 rounded-2xl border flex items-center justify-between gap-4 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="min-w-0">
                        <div className={`font-black truncate ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{test.test_name || test.topic || 'Test'}</div>
                        <div className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {new Date(test.date_taken?.toDate?.() || test.date_taken || Date.now()).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-blue-500 font-black text-lg">{test.score}%</span>
                        <div className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {test.score}/{test.totalQuestions || '-'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tests' && (
          <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className={`text-3xl font-black mb-8 tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>Tests Attempted</h2>
            <div className={`rounded-[2rem] shadow-xl border overflow-hidden transition-colors ${isDark ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-100 shadow-slate-200/50'}`}>
              <div className="p-6 space-y-3">
                {loading ? (
                  <div className="flex justify-center items-center h-24">
                    <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600"></div>
                  </div>
                ) : testHistory.length === 0 ? (
                  <div className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No tests attempted yet.</div>
                ) : (
                  testHistory.map((test) => (
                    <div key={test.id} className={`p-5 rounded-2xl border flex items-center justify-between gap-4 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="min-w-0">
                        <div className={`font-black truncate ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{test.test_name || test.topic || 'Test'}</div>
                        <div className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          Date: {new Date(test.date_taken?.toDate?.() || test.date_taken || Date.now()).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <span className="px-4 py-2 rounded-xl text-xs font-black bg-blue-600 text-white">Score: {test.score}%</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className={`text-3xl font-black mb-8 tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>Study Materials</h2>
            <div className={`p-6 rounded-[2rem] shadow-xl border space-y-8 transition-colors ${isDark ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-100 shadow-slate-200/50'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {topics.map((topic) => (
                  <div key={topic.id} className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                    <h3 className={`font-black mb-2 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{topic.name}</h3>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-4`}>{topic.description}</p>
                    <button
                      onClick={() => {
                        setSelectedTopic(topic);
                        setActiveTab('overview');
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-black bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      View Materials
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className={`text-3xl font-black mb-8 tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>My Progress</h2>
            <div className={`p-6 rounded-[2rem] shadow-xl border space-y-8 transition-colors ${isDark ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-100 shadow-slate-200/50'}`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                  <h3 className={`font-black mb-2 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Tests Completed</h3>
                  <p className={`text-3xl font-black ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{testHistory.length}</p>
                </div>
                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                  <h3 className={`font-black mb-2 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Average Score</h3>
                  <p className={`text-3xl font-black ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    {testHistory.length > 0 ? Math.round(testHistory.reduce((sum, t) => sum + t.score, 0) / testHistory.length) : 0}%
                  </p>
                </div>
                <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                  <h3 className={`font-black mb-2 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Topics Studied</h3>
                  <p className={`text-3xl font-black ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{topics.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Test Component Modal */}
      {showTest && (
        <TestComponent
          topic={selectedTopic}
          test={selectedTest}
          onTestComplete={(results) => {
            // Refresh test history after test completion
            if (currentUser) {
              getTestHistoryByUser(currentUser.uid).then(setTestHistory);
            }
            setShowTest(false);
            setSelectedTest(null);
          }}
          onClose={() => setShowTest(false)}
        />
      )}
    </div>
  );
};

export default StudentDashboard;