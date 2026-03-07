import React, { useState, useRef, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, CheckCircle2 } from 'lucide-react'; 
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import { createTest, createContent, deleteContent, deleteTest, getContentByUploader, getTestsByCreator, updateContent, updateTest } from './services/databaseService';
import { useTheme } from './ThemeContext';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null); 
  const [activeTab, setActiveTab] = useState('create-test');
  const { isDark, toggleTheme } = useTheme();
  
  const [testTitle, setTestTitle] = useState('');
  const [contentTitle, setContentTitle] = useState('');
  const [contentCategory, setContentCategory] = useState('video');
  const [contentUrl, setContentUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null); 
  const [questions, setQuestions] = useState([
    { id: 1, type: 'mcq', question: '', options: ['', '', '', ''], correctOption: 0 } 
  ]);
  const [publishing, setPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); 

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
    setActiveTab('upload');
    setContentTitle(c.title || '');
    setContentCategory(c.type || 'video');
    setContentUrl(c.url || '');
    setSelectedFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
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

  const handlePublishMaterial = async () => {
    if (!contentTitle) return alert("Please provide a title");

    setPublishing(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert("You must be logged in to publish materials");
        return;
      }

      const contentData = {
        uploader_id: currentUser.uid,  
        title: contentTitle,           
        topic: "General",              
        type: contentCategory,         
        url: selectedFile ? URL.createObjectURL(selectedFile) : (contentUrl || '#'), 
        description: `Uploaded file: ${selectedFile ? selectedFile.name : 'No file'}`,
        published: true
      };

      if (editingContentId) {
        const updateData = { ...contentData };
        if (!selectedFile && !contentUrl) {
          delete updateData.url;
        }
        await updateContent(editingContentId, updateData);
      } else {
        await createContent(contentData);
      }
      console.log('Material published successfully!');
      alert(editingContentId ? 'Material updated successfully!' : 'Material published successfully!');
      setContentTitle('');
      setContentUrl('');
      setSelectedFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setEditingContentId(null);
    } catch (error) {
      console.error('Full error object:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);

      if (error.code === 'permission-denied') {
        alert('Firebase Permission Denied. Please update your Firestore security rules in Firebase Console.\n\nGo to: Firebase Console > Firestore Database > Rules\n\nAdd this rule:\nmatch /{document=**} {\n  allow read, write: if request.auth != null;\n}');
      } else {
        alert('Failed to publish material: ' + error.message);
      }
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className={`min-h-screen flex font-sans antialiased transition-colors duration-500 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#f8fafc] text-slate-900'}`}>
      
      <aside className={`w-72 border-r flex flex-col p-6 sticky top-0 h-screen shadow-sm transition-colors ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="mb-10 px-2">
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">
            Teacher Panel
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Instructor Workspace</p>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { id: 'upload', icon: '📤', label: 'Upload Content' },
            { id: 'create-test', icon: '📝', label: 'Create Test' },
            { id: 'my-tests', icon: '📚', label: 'My Tests' },
            { id: 'my-content', icon: '🗂️', label: 'My Content' },
            { id: 'tracking', icon: '📊', label: 'Student Tracking' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all duration-200 group ${
                activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-[1.02]' 
                : `${isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`
              }`}
            >
              <span className={`text-xl ${activeTab === item.id ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <button 
          onClick={handleLogout} 
          className="mt-auto flex items-center gap-4 p-4 rounded-2xl font-bold text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all duration-200 cursor-pointer group"
        >
          <span className="text-xl opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-transform">👋</span>
          <span className="text-sm">Logout</span>
        </button>
      </aside>

      <main className="flex-1 p-8 md:p-12 overflow-y-auto relative">
        <button 
          onClick={toggleTheme}
          className={`absolute top-8 right-8 p-3 rounded-full border transition-all shadow-lg z-50 ${isDark ? 'bg-slate-800 border-slate-700 text-yellow-400' : 'bg-white border-slate-200 text-slate-600'}`}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {activeTab === 'upload' && (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className={`text-3xl font-black mb-8 tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>Upload Learning Materials</h2>
            <div className={`p-8 rounded-[2rem] shadow-xl border space-y-8 transition-colors ${isDark ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-100 shadow-slate-200/50'}`}>
              {editingContentId && (
                <div className={`p-4 rounded-2xl text-xs font-bold ${isDark ? 'bg-slate-950 text-slate-400 border border-slate-800' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                  Editing existing content
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Content Title</label>
                  <input 
                    type="text" 
                    value={contentTitle}
                    onChange={(e) => setContentTitle(e.target.value)}
                    placeholder="e.g. Advanced JavaScript Patterns" 
                    className={`w-full p-4 border rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                  <select 
                    value={contentCategory}
                    onChange={(e) => setContentCategory(e.target.value)}
                    className={`w-full p-4 border rounded-2xl outline-none cursor-pointer focus:border-blue-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <option value="video">Video Lecture</option>
                    <option value="pdf">PDF Resource</option>
                    <option value="link">Resource Link</option>
                  </select>
                </div>
              </div>

              {contentCategory === 'link' && (
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Resource URL</label>
                  <input
                    type="text"
                    value={contentUrl}
                    onChange={(e) => setContentUrl(e.target.value)}
                    placeholder="https://..."
                    className={`w-full p-4 border rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
              )}

              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={(e) => setSelectedFile(e.target.files[0])}
              />
              <div 
                onClick={() => fileInputRef.current.click()}
                className={`border-2 border-dashed rounded-[2rem] p-16 text-center transition-all cursor-pointer group ${selectedFile ? 'border-blue-500 bg-blue-50/20' : isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-blue-50/50 hover:border-blue-300'}`}
              >
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">{selectedFile ? '✅' : '📁'}</span>
                </div>
                <p className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {selectedFile ? selectedFile.name : 'Drag & drop files or browse'}
                </p>
                {uploadProgress > 0 && <p className="text-blue-500 font-bold mt-2">{uploadProgress}% Uploaded</p>}
              </div>

              <button 
                onClick={handlePublishMaterial}
                disabled={publishing}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-[0.99] dark:bg-blue-600 dark:hover:bg-blue-700 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {publishing ? 'Publishing...' : (editingContentId ? 'Update Material' : 'Publish Material')}
              </button>
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
                  className={`w-full p-5 border rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 font-bold text-lg transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200'}`} 
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