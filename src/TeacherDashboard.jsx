import React, { useState, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, CheckCircle2 } from 'lucide-react'; 
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import { createTest, createContent, deleteContent, deleteTest, getContentByUploader, getTestsByCreator, updateContent, updateTest } from './services/databaseService';
import { useTheme } from './ThemeContext';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('create-test');
  const { isDark, toggleTheme } = useTheme();
  
  const [testTitle, setTestTitle] = useState('');
  const [contentTitle, setContentTitle] = useState('');
  const [contentTopic, setContentTopic] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [questions, setQuestions] = useState([
    { id: 1, type: 'mcq', question: '', options: ['', '', '', ''], correctOption: 0 } 
  ]);
  const [publishing, setPublishing] = useState(false);

  const [myTests, setMyTests] = useState([]);
  const [myContent, setMyContent] = useState([]);
  const [listLoading, setListLoading] = useState(false);

  const [editingTestId, setEditingTestId] = useState(null);
  const [editingContentId, setEditingContentId] = useState(null);

  const studentStats = [
    { id: 1, name: "Aarav Sharma", progress: 85, avgScore: 92, lastActive: "2 hours ago" },
    { id: 2, name: "Ishani Verma", progress: 40, avgScore: 78, lastActive: "5 mins ago" },
    { id: 3, name: "Rohan Gupta", progress: 100, avgScore: 95, lastActive: "Yesterday" },
  ];

  useEffect(() => {
    const loadLists = async () => {
      if (activeTab !== 'my-tests' && activeTab !== 'my-content') return;

      const currentUser = auth.currentUser;
      if (!currentUser) return;

      setListLoading(true);
      try {
        if (activeTab === 'my-tests') {
          const tests = await getTestsByCreator(currentUser.uid);
          setMyTests(tests || []);
        }
        if (activeTab === 'my-content') {
          const content = await getContentByUploader(currentUser.uid);
          setMyContent(content || []);
        }
      } catch (e) {
        console.error('Error loading teacher lists:', e);
      } finally {
        setListLoading(false);
      }
    };

    loadLists();
  }, [activeTab]);

  const addQuestion = () => {
    setQuestions([...questions, { 
      id: Date.now(), 
      type: 'mcq', 
      question: '', 
      options: ['', '', '', ''], 
      correctOption: 0 
    }]);
  };

  const updateQuestionType = (index, newType) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index].type = newType;
    if (newType === 'text') {
      updatedQuestions[index].options = [];
    } else if (newType !== 'text' && (updatedQuestions[index].options.length === 0 || updatedQuestions[index].options.every(opt => opt === ''))) {
      updatedQuestions[index].options = ['', '', '', ''];
    }
    setQuestions(updatedQuestions);
  };

  const updateQuestionData = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const updateOptionText = (qIndex, optIndex, text) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = text;
    setQuestions(updated);
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

  const startEditTest = (t) => {
    setEditingTestId(t.id);
    setActiveTab('create-test');
    setTestTitle(t.test_name || '');
    setQuestions(
      (t.questions || []).map((q, idx) => ({
        id: q.id ?? idx,
        type: q.type || 'mcq',
        question: q.question || '',
        options: q.options || ['', '', '', ''],
        correctOption: q.correctOption || 0
      }))
    );
  };

  const startEditContent = (c) => {
    setEditingContentId(c.id);
    setActiveTab('materials');
    setContentTitle(c.title || '');
    setContentTopic(c.topic || '');
    setYoutubeUrl(c.youtubeUrl || '');
    setDriveUrl(c.driveUrl || '');
  };

  const handleDeleteTest = async (testId) => {
    if (!confirm('Delete this test?')) return;
    try {
      await deleteTest(testId);
      setMyTests((prev) => prev.filter((t) => t.id !== testId));
    } catch (e) {
      console.error('Delete test failed:', e);
      alert('Failed to delete test.');
    }
  };

  const handleDeleteContent = async (contentId) => {
    if (!confirm('Delete this content?')) return;
    try {
      await deleteContent(contentId);
      setMyContent((prev) => prev.filter((c) => c.id !== contentId));
    } catch (e) {
      console.error('Delete content failed:', e);
      alert('Failed to delete content.');
    }
  };

  const handlePublishTest = async () => {
    if (!testTitle) return alert("Please enter a test title");
    setPublishing(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert("You must be logged in to publish tests");
        return;
      }

      const testData = {
        creator_id: currentUser.uid, 
        test_name: testTitle,        
        topic: "General",            
        max_score: 100,              
        questions: questions.map(q => ({
          question: q.question,
          type: q.type,
          options: q.options,
          correctOption: q.correctOption || 0
        })),
        published: true
      };

      if (editingTestId) {
        await updateTest(editingTestId, testData);
        alert('Test updated successfully!');
      } else {
        await createTest(testData);
        alert('Test published successfully with answer keys!');
      }

      setTestTitle('');
      setQuestions([{ id: 1, type: 'mcq', question: '', options: ['', '', '', ''], correctOption: 0 }]);
      setEditingTestId(null);
    } catch (error) {
      console.error('Error publishing test:', error);
      alert(editingTestId ? 'Failed to update test.' : 'Failed to publish test.');
    } finally {
      setPublishing(false);
    }
  };

  const handlePublishMaterial = async (e) => {
    e.preventDefault();
    if (!contentTitle || !contentTopic || (!youtubeUrl && !driveUrl)) {
      alert('Please fill in all required fields and provide at least one URL.');
      return;
    }
    setPublishing(true);
    try {
      const materialData = {
        title: contentTitle,
        topic: contentTopic,
        youtubeUrl: youtubeUrl.trim(),
        driveUrl: driveUrl.trim(),
        uploadedBy: auth.currentUser.uid,
        createdAt: new Date().toISOString()
      };
      if (editingContentId) {
        await updateContent(editingContentId, materialData);
      } else {
        await createContent(materialData);
      }
      setContentTitle('');
      setContentTopic('');
      setYoutubeUrl('');
      setDriveUrl('');
      alert(editingContentId ? 'Material updated successfully!' : 'Material published successfully!');
    } catch (error) {
      console.error('Error publishing material:', error);
      alert('Failed to publish material: ' + error.message);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className={`min-h-screen flex font-sans antialiased transition-colors duration-500 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#f8fafc] text-slate-900'}`}>
      
      <aside className={`w-72 flex flex-col p-6 sticky top-0 h-screen shadow-2xl transition-colors ${isDark ? 'bg-black border-r border-slate-800' : 'bg-[#0f172a] text-white'}`}>
        <div className="mb-10 px-2 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xl text-white">T</div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white">Teacher</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Instructor Workspace</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { id: 'materials', icon: '', label: 'Upload Content' },
            { id: 'create-test', icon: '', label: 'Create Test' },
            { id: 'my-tests', icon: '', label: 'My Tests' },
            { id: 'my-content', icon: '', label: 'My Content' },
            { id: 'tracking', icon: '', label: 'Student Tracking' }
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
              <span className={`text-xl ${activeTab === item.id ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <button 
          onClick={handleLogout} 
          className="mt-auto flex items-center gap-4 p-4 rounded-2xl font-bold text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer"
        >
          <span className="text-xl"></span>
          <span className="text-sm">Log out</span>
        </button>
      </aside>

      <main className="flex-1 p-8 md:p-12 overflow-y-auto relative">
        <button 
          onClick={toggleTheme}
          className={`absolute top-8 right-8 p-3 rounded-full border transition-all shadow-lg z-50 ${isDark ? 'bg-slate-800 border-slate-700 text-yellow-400' : 'bg-white border-slate-200 text-slate-600'}`}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {activeTab === 'materials' && (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className={`text-3xl font-black mb-8 tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>Upload Learning Material</h2>
            <div className={`p-8 rounded-[2rem] shadow-xl border space-y-8 transition-colors ${isDark ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-100 shadow-slate-200/50'}`}>
              {editingContentId && (
                <div className={`p-4 rounded-2xl text-xs font-bold ${isDark ? 'bg-slate-950 text-slate-400 border border-slate-800' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                  Editing existing content
                </div>
              )}
              <form onSubmit={handlePublishMaterial} className="space-y-4">
                <div>
                  <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Content Title *</label>
                  <input
                    type="text"
                    value={contentTitle}
                    onChange={(e) => setContentTitle(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border transition-all ${
                      isDark 
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500' 
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500'
                    }`}
                    placeholder="e.g., Introduction to Photosynthesis"
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Topic Name *</label>
                  <input
                    type="text"
                    value={contentTopic}
                    onChange={(e) => setContentTopic(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border transition-all ${
                      isDark 
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500' 
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500'
                    }`}
                    placeholder="e.g., Biology"
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>YouTube Video URL</label>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border transition-all ${
                      isDark 
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500' 
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500'
                    }`}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
                <div>
                  <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Google Drive URL (PDF/PPT/Word)</label>
                  <input
                    type="url"
                    value={driveUrl}
                    onChange={(e) => setDriveUrl(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border transition-all ${
                      isDark 
                      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500' 
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500'
                    }`}
                    placeholder="https://drive.google.com/file/d/..."
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={publishing}
                    className={`flex-1 py-3 px-6 rounded-xl font-black transition-all ${
                      publishing
                      ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {publishing ? 'Publishing...' : (editingContentId ? 'Update Material' : 'Publish Material')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setContentTitle('');
                      setContentTopic('');
                      setYoutubeUrl('');
                      setDriveUrl('');
                    }}
                    className={`px-6 py-3 rounded-xl font-black transition-all ${
                      isDark 
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Clear
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'create-test' && (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className={`text-3xl font-black mb-8 tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>Design Practice Test</h2>
            <div className={`p-8 md:p-10 rounded-[2.5rem] shadow-xl border space-y-10 transition-colors ${isDark ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-100 shadow-slate-200/50'}`}>
              {editingTestId && (
                <div className={`p-4 rounded-2xl text-xs font-bold ${isDark ? 'bg-slate-950 text-slate-400 border border-slate-800' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                  Editing existing test
                </div>
              )}
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Test Identity</label>
                <input 
                  type="text" 
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  placeholder="e.g. Fullstack React Certification Quiz" 
                  className={`w-full p-5 border rounded-2xl outline-none font-bold text-lg transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200'}`} 
                />
              </div>

              <div className="space-y-12">
                {questions.map((q, index) => (
                  <div key={q.id} className={`p-8 rounded-[2rem] border relative shadow-sm hover:shadow-md transition-all ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
                      <span className="bg-blue-600 text-white px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-200">
                        Question {index + 1}
                      </span>
                      
                      <select 
                        value={q.type}
                        onChange={(e) => updateQuestionType(index, e.target.value)}
                        className={`border rounded-xl px-4 py-2 text-xs font-bold outline-none shadow-sm cursor-pointer hover:border-blue-400 transition-colors ${isDark ? 'bg-slate-900 border-slate-600 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}
                      >
                        <option value="mcq">Multiple Choice (MCQ)</option>
                        <option value="checkbox">Checkboxes (Multi-select)</option>
                        <option value="text">Short Text Answer</option>
                      </select>
                    </div>

                    <input 
                        type="text" 
                        placeholder="Type your question prompt here..." 
                        value={q.question}
                        onChange={(e) => updateQuestionData(index, 'question', e.target.value)}
                        className={`w-full p-4 border rounded-2xl outline-none mb-8 font-semibold focus:border-blue-500 shadow-sm transition-colors ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-700'}`} 
                    />
                    
                    {q.type === 'text' ? (
                      <div className={`p-8 border-2 border-dashed rounded-2xl flex items-center justify-center gap-3 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <span className="text-xl">⌨️</span>
                        <p className="text-sm text-slate-400 font-medium italic">Students will see an open text box for response.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="relative group flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateQuestionData(index, 'correctOption', optIdx)}
                              className={`p-2 rounded-full transition-colors ${q.correctOption === optIdx ? 'text-green-500' : 'text-slate-300 hover:text-slate-400'}`}
                              title="Mark as correct answer"
                            >
                              <CheckCircle2 size={24} fill={q.correctOption === optIdx ? "currentColor" : "transparent"} />
                            </button>
                            <input 
                              type="text" 
                              value={opt}
                              onChange={(e) => updateOptionText(index, optIdx, e.target.value)}
                              placeholder={`Option ${optIdx + 1}`} 
                              className={`flex-1 p-4 border rounded-2xl outline-none text-sm font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm ${isDark ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 group-hover:border-slate-500' : 'bg-white border-slate-200 group-hover:border-slate-300'} ${q.correctOption === optIdx ? 'ring-2 ring-green-500 border-green-500' : ''}`} 
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-col md:flex-row gap-4 pt-4">
                <button onClick={addQuestion} className={`flex-1 py-5 border-2 border-dashed rounded-2xl font-black transition-all cursor-pointer flex items-center justify-center gap-2 uppercase text-xs tracking-widest ${isDark ? 'border-slate-700 text-slate-500 hover:border-blue-500 hover:text-blue-400 hover:bg-slate-800' : 'border-slate-300 text-slate-400 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50'}`}>
                  <span className="text-lg">+</span> Add New Question
                </button>
                <button 
                   onClick={handlePublishTest}
                   disabled={publishing}
                   className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-blue-200 hover:shadow-blue-300 hover:scale-[1.01] transition-all cursor-pointer uppercase text-xs tracking-widest disabled:opacity-50"
                >
                  {publishing ? 'Publishing...' : (editingTestId ? 'Update Test' : 'Publish Test Now')}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'my-tests' && (
          <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className={`text-3xl font-black mb-8 tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>My Tests</h2>
            <div className={`rounded-[2rem] shadow-xl border overflow-hidden transition-colors ${isDark ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-100 shadow-slate-200/50'}`}>
              <div className="p-6 space-y-3">
                {listLoading ? (
                  <div className="flex justify-center items-center h-24">
                    <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600"></div>
                  </div>
                ) : myTests.length === 0 ? (
                  <div className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No tests found.</div>
                ) : (
                  myTests.map((t) => (
                    <div key={t.id} className={`p-5 rounded-2xl border flex items-center justify-between gap-4 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="min-w-0">
                        <div className={`font-black truncate ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{t.test_name || 'Untitled Test'}</div>
                        <div className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Topic: {t.topic || 'General'}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => startEditTest(t)} className="px-4 py-2 rounded-xl text-xs font-black bg-blue-600 text-white hover:bg-blue-700 transition-colors">Edit</button>
                        <button onClick={() => handleDeleteTest(t.id)} className="px-4 py-2 rounded-xl text-xs font-black bg-red-600 text-white hover:bg-red-700 transition-colors">Delete</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'my-content' && (
          <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className={`text-3xl font-black mb-8 tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>My Content</h2>
            <div className={`rounded-[2rem] shadow-xl border overflow-hidden transition-colors ${isDark ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-100 shadow-slate-200/50'}`}>
              <div className="p-6 space-y-3">
                {listLoading ? (
                  <div className="flex justify-center items-center h-24">
                    <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600"></div>
                  </div>
                ) : myContent.length === 0 ? (
                  <div className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No content found.</div>
                ) : (
                  myContent.map((c) => (
                    <div key={c.id} className={`p-5 rounded-2xl border flex items-center justify-between gap-4 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="min-w-0">
                        <div className={`font-black truncate ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{c.title || 'Untitled Content'}</div>
                        <div className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Type: {c.type || 'content'} | Topic: {c.topic || 'General'}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => startEditContent(c)} className="px-4 py-2 rounded-xl text-xs font-black bg-blue-600 text-white hover:bg-blue-700 transition-colors">Edit</button>
                        <button onClick={() => handleDeleteContent(c.id)} className="px-4 py-2 rounded-xl text-xs font-black bg-red-600 text-white hover:bg-red-700 transition-colors">Delete</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tracking' && (
          <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className={`text-3xl font-black mb-8 tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>Student Performance Analytics</h2>
            <div className={`rounded-[2rem] shadow-xl border overflow-hidden transition-colors ${isDark ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-100 shadow-slate-200/50'}`}>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`${isDark ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50/50 border-slate-100'} border-b`}>
                      <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Student Name</th>
                      <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Course Progress</th>
                      <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Avg. Test Score</th>
                      <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Last Seen</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                    {studentStats.map((student) => (
                      <tr key={student.id} className={`transition-colors group ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-blue-50/30'}`}>
                        <td className={`p-6 font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{student.name}</td>
                        <td className="p-6">
                            <div className={`w-full h-2 rounded-full max-w-[120px] ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                <div className="bg-blue-600 h-2 rounded-full transition-all duration-1000" style={{width: `${student.progress}%`}}></div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 mt-1 block">{student.progress}% Complete</span>
                        </td>
                        <td className="p-6 font-black text-blue-600">{student.avgScore}%</td>
                        <td className="p-6">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold transition-colors ${isDark ? 'bg-slate-800 text-slate-400 group-hover:bg-slate-700' : 'bg-slate-100 text-slate-500 group-hover:bg-white'}`}>
                                {student.lastActive}
                            </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className={`p-6 text-center transition-colors ${isDark ? 'bg-slate-900/50' : 'bg-slate-50/50'}`}>
                    <button className="text-xs font-bold text-blue-600 hover:underline cursor-pointer tracking-wider uppercase">Download Detailed Report</button>
                </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherDashboard;