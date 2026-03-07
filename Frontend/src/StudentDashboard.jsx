import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, BookOpen, Play, FileText, Clock, TrendingUp } from 'lucide-react';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { getTopics, getMaterialsByTopic, getTestHistoryByUser, getStudentDashboardData, updateVideoProgress, getVideoProgressByUser } from './services/databaseService';
import TestComponent from './components/TestComponent';
import { useTheme } from './ThemeContext';

const StudentDashboard = () => {
  const navigate = useNavigate();
  
  // Theme State
  const { isDark, toggleTheme } = useTheme();
  const [selectedTopic, setSelectedTopic] = useState(null);
  
  // Data States
  const [testHistory, setTestHistory] = useState([]);
  const [topics, setTopics] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTest, setShowTest] = useState(false);
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

  // Load materials when topic is selected
  useEffect(() => {
    if (selectedTopic) {
      const loadMaterials = async () => {
        try {
          const materialsData = await getMaterialsByTopic(selectedTopic.id);
          setMaterials(materialsData);
        } catch (err) {
          setError('Failed to load materials. Please try again.');
          console.error('Materials loading error:', err);
        }
      };
      
      loadMaterials();
    } else {
      setMaterials([]);
    }
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
    <>
      <div className={`min-h-screen transition-colors duration-500 p-6 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="max-w-6xl mx-auto">
          
          {/* Top Header */}
          <div className={`flex justify-between items-center mb-8 p-6 rounded-3xl shadow-sm border transition-all ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            <div>
              <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>Student Learning Portal</h1>
              <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-sm`}>Track your progress and start new tests</p>
            </div>
          
            <div className="flex items-center gap-4">
              {/* Theme Toggle Button */}
              <button 
                onClick={toggleTheme}
                className={`p-2.5 rounded-xl border transition-all ${
                  isDark ? 'bg-slate-800 border-slate-700 text-yellow-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <button 
                onClick={handleLogout}
                className={`px-6 py-2 font-bold rounded-xl transition duration-200 cursor-pointer ${
                  isDark ? 'bg-red-900/20 text-red-400 hover:bg-red-900/40' : 'bg-red-50 text-red-600 hover:bg-red-100'
                }`}
              >
                Logout
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 1. MARKS HISTORY SECTION */}
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
                    testHistory.map((test) => (
                      <div key={test.id} className={`p-4 border rounded-2xl flex justify-between items-center group hover:shadow-md transition-all ${
                        isDark ? 'bg-slate-950 border-slate-800 hover:bg-slate-900' : 'bg-slate-50/50 border-slate-50 hover:bg-white'
                      }`}>
                        <div className="flex-1">
                          <p className={`font-bold text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{test.topicName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3" size={12} />
                            <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                              {new Date(test.completedAt?.toDate?.() || test.completedAt).toLocaleDateString()}
                            </p>
                          </div>
                          {test.timeSpent && (
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" size={10} />
                              <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{test.timeSpent}min</p>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-blue-500 font-black text-lg">{test.score}%</span>
                          <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {test.score}/{test.totalQuestions}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            
            {/* 2. TOPIC SELECTION SECTION */}
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
              </div> {/* Fixed: Added missing closing div for the topic container */}

              {/* 3. DYNAMIC CONTENT SECTION */}
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
                            <div>
                              <span className={`font-bold transition ${isDark ? 'text-slate-300 group-hover:text-blue-400' : 'text-slate-600 group-hover:text-blue-600'}`}>
                                {material.name}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                {material.duration && (
                                  <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {material.duration}
                                  </span>
                                )}
                                {material.pages && (
                                  <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                    {material.pages} pages
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => material.type === 'test' ? setShowTest(true) : window.open(material.url, '_blank')}
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

        {/* Test Component Modal */}
        {showTest && (
          <TestComponent
            topic={selectedTopic}
            onTestComplete={(results) => {
              // Refresh test history after test completion
              if (currentUser) {
                getTestResultsByUser(currentUser.uid).then(setTestHistory);
              }
              setShowTest(false);
            }}
            onClose={() => setShowTest(false)}
          />
        )}

        {/* Upload Component Modal */}
      </div>
    </>
  );
};

export default StudentDashboard;