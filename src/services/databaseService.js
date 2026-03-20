import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';

// Collections based on ER Diagram
const ROLE_COLLECTION = 'roles';
const USER_COLLECTION = 'users';
const TESTS_COLLECTION = 'tests';
const TEST_HISTORY_COLLECTION = 'test_history';
const CONTENT_COLLECTION = 'content';
const VIDEO_PROGRESS_COLLECTION = 'video_progress';

// ============================================
// ROLE MANAGEMENT (ROLE entity)
// ============================================

export const initializeRoles = async () => {
  try {
    const rolesSnapshot = await getDocs(collection(db, ROLE_COLLECTION));
    if (rolesSnapshot.empty) {
      const defaultRoles = [
        { role_id: 1, role_name: 'Admin' },
        { role_id: 2, role_name: 'Teacher' },
        { role_id: 3, role_name: 'Student' }
      ];
      
      for (const role of defaultRoles) {
        await addDoc(collection(db, ROLE_COLLECTION), role);
      }
      console.log('Default roles initialized');
    }
  } catch (error) {
    console.error('Error initializing roles:', error);
  }
};

export const getRoles = async () => {
  try {
    const rolesSnapshot = await getDocs(collection(db, ROLE_COLLECTION));
    return rolesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching roles:', error);
    return [];
  }
};

export const getRoleById = async (roleId) => {
  try {
    const q = query(
      collection(db, ROLE_COLLECTION),
      where('role_id', '==', roleId)
    );
    const roleSnapshot = await getDocs(q);
    return roleSnapshot.empty
      ? null
      : { id: roleSnapshot.docs[0].id, ...roleSnapshot.docs[0].data() };
  } catch (error) {
    console.error('Error fetching role:', error);
    return null;
  }
};

export const getRoleByName = async (roleName) => {
  try {
    const q = query(
      collection(db, ROLE_COLLECTION),
      where('role_name', '==', roleName)
    );
    const roleSnapshot = await getDocs(q);
    return roleSnapshot.empty ? null : { id: roleSnapshot.docs[0].id, ...roleSnapshot.docs[0].data() };
  } catch (error) {
    console.error('Error fetching role by name:', error);
    return null;
  }
};

// ============================================
// USER MANAGEMENT (USER entity)
// ============================================

export const createUser = async (userData) => {
  try {
    const role = await getRoleByName(userData.role_name || 'Student');
    const userDataWithRole = {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role_id: role ? role.role_id : 3,
      createdAt: serverTimestamp()
    };

    if (!userData.uid) {
      throw new Error('createUser requires userData.uid so the profile can be stored at users/{uid}');
    }

    await setDoc(doc(db, USER_COLLECTION, userData.uid), userDataWithRole, { merge: true });
    return { id: userData.uid, ...userDataWithRole };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const getUserByUid = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, USER_COLLECTION, uid));
    return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
  } catch (error) {
    console.error('Error fetching user by uid:', error);
    return null;
  }
};

export const getUserById = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, USER_COLLECTION, userId));
    return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};

export const getUserByEmail = async (email) => {
  try {
    const q = query(
      collection(db, USER_COLLECTION),
      where('email', '==', email)
    );
    const userSnapshot = await getDocs(q);
    return userSnapshot.empty ? null : { id: userSnapshot.docs[0].id, ...userSnapshot.docs[0].data() };
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
};

export const getUsersByRole = async (roleId) => {
  try {
    const q = query(
      collection(db, USER_COLLECTION),
      where('role_id', '==', roleId)
    );
    const usersSnapshot = await getDocs(q);
    return usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching users by role:', error);
    return [];
  }
};

export const getAllUsers = async () => {
  try {
    const usersSnapshot = await getDocs(collection(db, USER_COLLECTION));
    return usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching all users:', error);
    return [];
  }
};

export const updateUserRole = async (userId, roleId) => {
  try {
    await updateDoc(doc(db, USER_COLLECTION, userId), { role_id: roleId });
    return { id: userId, role_id: roleId };
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

// ============================================
// TESTS MANAGEMENT (TESTS entity)
// ============================================

export const createTest = async (testData) => {
  try {
    const testWithMetadata = {
      creator_id: testData.creator_id,
      test_name: testData.test_name,
      topic: testData.topic,
      max_score: testData.max_score || 100,
      questions: testData.questions || [],
      createdAt: serverTimestamp(),
      published: testData.published ?? false
    };
    
    const docRef = await addDoc(collection(db, TESTS_COLLECTION), testWithMetadata);
    return { id: docRef.id, ...testWithMetadata };
  } catch (error) {
    console.error('Error creating test:', error);
    throw error;
  }
};

export const getTests = async () => {
  try {
    const testsSnapshot = await getDocs(collection(db, TESTS_COLLECTION));
    return testsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching tests:', error);
    return [];
  }
};

export const getTestsByCreator = async (creatorId) => {
  try {
    const q = query(
      collection(db, TESTS_COLLECTION),
      where('creator_id', '==', creatorId),
      orderBy('createdAt', 'desc')
    );
    const testsSnapshot = await getDocs(q);
    return testsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching tests by creator:', error);
    return [];
  }
};

export const getPublishedTestsByTopic = async (topic) => {
  try {
    const testsSnapshot = await getDocs(collection(db, TESTS_COLLECTION));
    const tests = testsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const normalizedTopic = String(topic ?? '').trim().toLowerCase();
    return tests
      .filter(t => t.published !== false)
      .filter(t => String(t.topic ?? '').trim().toLowerCase() === normalizedTopic);
  } catch (error) {
    console.error('Error fetching published tests by topic:', error);
    return [];
  }
};

export const getTestById = async (testId) => {
  try {
    const testDoc = await getDoc(doc(db, TESTS_COLLECTION, testId));
    return testDoc.exists() ? { id: testDoc.id, ...testDoc.data() } : null;
  } catch (error) {
    console.error('Error fetching test:', error);
    return null;
  }
};

export const updateTest = async (testId, testData) => {
  try {
    await updateDoc(doc(db, TESTS_COLLECTION, testId), testData);
    return { id: testId, ...testData };
  } catch (error) {
    console.error('Error updating test:', error);
    throw error;
  }
};

export const deleteTest = async (testId) => {
  try {
    await deleteDoc(doc(db, TESTS_COLLECTION, testId));
    return true;
  } catch (error) {
    console.error('Error deleting test:', error);
    throw error;
  }
};

// ============================================
// TEST HISTORY MANAGEMENT (TEST_HISTORY entity)
// ============================================

export const recordTestScore = async (testHistoryData) => {
  try {
    const historyData = {
      user_id: testHistoryData.user_id,
      test_id: testHistoryData.test_id,
      score: testHistoryData.score,
      date_taken: serverTimestamp(),
      timeSpent: testHistoryData.timeSpent || 0,
      answers: testHistoryData.answers || [],
      test_name: testHistoryData.test_name,
      topic: testHistoryData.topic,
      totalQuestions: testHistoryData.totalQuestions
    };
    
    const docRef = await addDoc(collection(db, TEST_HISTORY_COLLECTION), historyData);
    return { id: docRef.id, ...historyData };
  } catch (error) {
    console.error('Error recording test score:', error);
    throw error;
  }
};

export const getTestHistoryByUser = async (userId) => {
  try {
    const q = query(
      collection(db, TEST_HISTORY_COLLECTION),
      where('user_id', '==', userId)
    );
    const historySnapshot = await getDocs(q);
    const items = historySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    items.sort((a, b) => {
      const aTime = (a.date_taken?.toMillis?.() ?? new Date(a.date_taken || 0).getTime() ?? 0);
      const bTime = (b.date_taken?.toMillis?.() ?? new Date(b.date_taken || 0).getTime() ?? 0);
      return bTime - aTime;
    });
    return items.slice(0, 20);
  } catch (error) {
    console.error('Error fetching test history:', error);
    return [];
  }
};

export const getTestHistoryByTest = async (testId) => {
  try {
    const q = query(
      collection(db, TEST_HISTORY_COLLECTION),
      where('test_id', '==', testId)
    );
    const historySnapshot = await getDocs(q);
    const items = historySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    items.sort((a, b) => {
      const aTime = (a.date_taken?.toMillis?.() ?? new Date(a.date_taken || 0).getTime() ?? 0);
      const bTime = (b.date_taken?.toMillis?.() ?? new Date(b.date_taken || 0).getTime() ?? 0);
      return bTime - aTime;
    });
    return items;
  } catch (error) {
    console.error('Error fetching test history by test:', error);
    return [];
  }
};

export const getUserTestStats = async (userId) => {
  try {
    const history = await getTestHistoryByUser(userId);
    if (history.length === 0) return { totalTests: 0, averageScore: 0, bestScore: 0 };
    
    const totalTests = history.length;
    const averageScore = history.reduce((sum, record) => sum + (record.score || 0), 0) / totalTests;
    const bestScore = Math.max(...history.map(record => record.score || 0));
    
    return { totalTests, averageScore: Math.round(averageScore), bestScore };
  } catch (error) {
    console.error('Error calculating user test stats:', error);
    return { totalTests: 0, averageScore: 0, bestScore: 0 };
  }
};

// ============================================
// CONTENT MANAGEMENT (CONTENT entity)
// ============================================

export const createContent = async (contentData) => {
  try {
    // Auto-detect content type based on URLs
    let type = 'document';
    let url = contentData.driveUrl || contentData.url || '';
    
    if (contentData.youtubeUrl) {
      type = 'video';
      url = contentData.youtubeUrl;
    } else if (contentData.driveUrl) {
      type = 'document';
      url = contentData.driveUrl;
    }
    
    const contentWithMetadata = {
      uploadedBy: contentData.uploadedBy || contentData.uploader_id,
      title: contentData.title,
      topic: contentData.topic,
      youtubeUrl: contentData.youtubeUrl || '',
      driveUrl: contentData.driveUrl || '',
      type,
      url,
      description: contentData.description || '',
      createdAt: contentData.createdAt || serverTimestamp(),
      published: contentData.published !== undefined ? contentData.published : true
    };
    
    const docRef = await addDoc(collection(db, CONTENT_COLLECTION), contentWithMetadata);
    return { id: docRef.id, ...contentWithMetadata };
  } catch (error) {
    console.error('Error creating content:', error);
    throw error;
  }
};

export const getContent = async () => {
  try {
    const contentSnapshot = await getDocs(collection(db, CONTENT_COLLECTION));
    return contentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching content:', error);
    return [];
  }
};

export const getContentByUploader = async (uploaderId) => {
  try {
    const q = query(
      collection(db, CONTENT_COLLECTION),
      where('uploadedBy', '==', uploaderId),
      orderBy('createdAt', 'desc')
    );
    const contentSnapshot = await getDocs(q);
    return contentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching content by uploader:', error);
    return [];
  }
};

export const getContentByTopic = async (topic) => {
  try {
    const q = query(
      collection(db, CONTENT_COLLECTION),
      where('topic', '==', topic),
      orderBy('createdAt', 'desc')
    );
    const contentSnapshot = await getDocs(q);
    return contentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching content by topic:', error);
    return [];
  }
};

export const getContentById = async (contentId) => {
  try {
    const contentDoc = await getDoc(doc(db, CONTENT_COLLECTION, contentId));
    return contentDoc.exists() ? { id: contentDoc.id, ...contentDoc.data() } : null;
  } catch (error) {
    console.error('Error fetching content:', error);
    return null;
  }
};

export const updateContent = async (contentId, contentData) => {
  try {
    await updateDoc(doc(db, CONTENT_COLLECTION, contentId), contentData);
    return { id: contentId, ...contentData };
  } catch (error) {
    console.error('Error updating content:', error);
    throw error;
  }
};

export const deleteContent = async (contentId) => {
  try {
    await deleteDoc(doc(db, CONTENT_COLLECTION, contentId));
    return true;
  } catch (error) {
    console.error('Error deleting content:', error);
    throw error;
  }
};

// ============================================
// VIDEO PROGRESS MANAGEMENT (VIDEO_PROGRESS entity)
// ============================================

export const updateVideoProgress = async (progressData) => {
  try {
    const q = query(
      collection(db, VIDEO_PROGRESS_COLLECTION),
      where('user_id', '==', progressData.user_id),
      where('content_id', '==', progressData.content_id)
    );
    const existingSnapshot = await getDocs(q);
    
    const progressRecord = {
      user_id: progressData.user_id,
      content_id: progressData.content_id,
      completion_percentage: progressData.completion_percentage || 0,
      last_watched: serverTimestamp(),
      total_watch_time: progressData.total_watch_time || 0
    };
    
    if (existingSnapshot.empty) {
      const docRef = await addDoc(collection(db, VIDEO_PROGRESS_COLLECTION), progressRecord);
      return { id: docRef.id, ...progressRecord };
    } else {
      const existingDoc = existingSnapshot.docs[0];
      await updateDoc(doc(db, VIDEO_PROGRESS_COLLECTION, existingDoc.id), progressRecord);
      return { id: existingDoc.id, ...progressRecord };
    }
  } catch (error) {
    console.error('Error updating video progress:', error);
    throw error;
  }
};

export const getVideoProgressByUser = async (userId) => {
  try {
    const q = query(
      collection(db, VIDEO_PROGRESS_COLLECTION),
      where('user_id', '==', userId)
    );
    const progressSnapshot = await getDocs(q);
    const items = progressSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    items.sort((a, b) => {
      const aTime = (a.last_watched?.toMillis?.() ?? new Date(a.last_watched || 0).getTime() ?? 0);
      const bTime = (b.last_watched?.toMillis?.() ?? new Date(b.last_watched || 0).getTime() ?? 0);
      return bTime - aTime;
    });
    return items;
  } catch (error) {
    console.error('Error fetching video progress:', error);
    return [];
  }
};

export const getVideoProgressForContent = async (userId, contentId) => {
  try {
    const q = query(
      collection(db, VIDEO_PROGRESS_COLLECTION),
      where('user_id', '==', userId),
      where('content_id', '==', contentId)
    );
    const progressSnapshot = await getDocs(q);
    return progressSnapshot.empty ? null : { id: progressSnapshot.docs[0].id, ...progressSnapshot.docs[0].data() };
  } catch (error) {
    console.error('Error fetching video progress for content:', error);
    return null;
  }
};

export const getUserOverallProgress = async (userId) => {
  try {
    const progress = await getVideoProgressByUser(userId);
    if (progress.length === 0) return { totalContent: 0, averageCompletion: 0, completedContent: 0 };
    
    const totalContent = progress.length;
    const averageCompletion = progress.reduce((sum, record) => sum + (record.completion_percentage || 0), 0) / totalContent;
    const completedContent = progress.filter(record => (record.completion_percentage || 0) >= 90).length;
    
    return { 
      totalContent, 
      averageCompletion: Math.round(averageCompletion), 
      completedContent 
    };
  } catch (error) {
    console.error('Error calculating user overall progress:', error);
    return { totalContent: 0, averageCompletion: 0, completedContent: 0 };
  }
};

// ============================================
// COMPOSITE QUERIES & ANALYTICS
// ============================================

export const getTeacherDashboardStats = async (teacherId) => {
  try {
    const tests = await getTestsByCreator(teacherId);
    const content = await getContentByUploader(teacherId);
    
    const testHistoryPromises = tests.map(test => getTestHistoryByTest(test.id));
    const testHistories = await Promise.all(testHistoryPromises);
    const allTestHistory = testHistories.flat();
    
    const totalTests = tests.length;
    const totalContent = content.length;
    const totalStudentsTakenTests = new Set(allTestHistory.map(h => h.user_id)).size;
    const averageScore = allTestHistory.length > 0 
      ? Math.round(allTestHistory.reduce((sum, h) => sum + (h.score || 0), 0) / allTestHistory.length)
      : 0;
    
    return {
      totalTests,
      totalContent,
      totalStudentsTakenTests,
      averageScore,
      recentActivity: allTestHistory.slice(0, 5)
    };
  } catch (error) {
    console.error('Error fetching teacher dashboard stats:', error);
    return {
      totalTests: 0,
      totalContent: 0,
      totalStudentsTakenTests: 0,
      averageScore: 0,
      recentActivity: []
    };
  }
};

export const getStudentDashboardData = async (studentId) => {
  try {
    const testHistory = await getTestHistoryByUser(studentId);
    const testStats = await getUserTestStats(studentId);
    
    const videoProgress = await getVideoProgressByUser(studentId);
    const overallProgress = await getUserOverallProgress(studentId);
    
    const allContent = await getContent();
    
    return {
      testHistory,
      testStats,
      videoProgress,
      overallProgress,
      availableContent: allContent
    };
  } catch (error) {
    console.error('Error fetching student dashboard data:', error);
    return {
      testHistory: [],
      testStats: { totalTests: 0, averageScore: 0, bestScore: 0 },
      videoProgress: [],
      overallProgress: { totalContent: 0, averageCompletion: 0, completedContent: 0 },
      availableContent: []
    };
  }
};

// ============================================
// INITIALIZATION
// ============================================

export const initializeERDiagramData = async () => {
  try {
    await initializeRoles();
    console.log('ER Diagram data structure initialized successfully');
  } catch (error) {
    console.error('Error initializing ER diagram data:', error);
  }
};

// ============================================
// BACKWARDS COMPATIBILITY (Legacy functions)
// ============================================

export const getTopics = async () => {
  try {
    const content = await getContent();
    const topics = [...new Set(content.map(c => c.topic).filter(Boolean))];
    return topics.map((topic, index) => ({ 
      id: `topic-${index}`, 
      name: topic, 
      description: `Content related to ${topic}`,
      icon: '📚'
    }));
  } catch (error) {
    console.error('Error fetching topics:', error);
    return [];
  }
};

export const getMaterialsByTopic = async (topicId) => {
  try {
    const content = await getContent();
    return content.filter(c => c.topic === topicId);
  } catch (error) {
    console.error('Error fetching materials by topic:', error);
    return [];
  }
};

export const addTest = async (testData) => {
  return createTest(testData);
};

export const addMaterial = async (materialData) => {
  const contentData = {
    uploader_id: materialData.uploader_id || 'system',
    title: materialData.title || materialData.name,
    topic: materialData.topic || 'General',
    type: materialData.type || 'video',
    url: materialData.url || '#',
    description: materialData.description || ''
  };
  return createContent(contentData);
};

export const getTestResultsByUser = async (userId) => {
  return getTestHistoryByUser(userId);
};

export const saveTestResult = async (userId, testResult) => {
  const historyData = {
    user_id: userId,
    test_id: testResult.testId,
    score: testResult.score,
    timeSpent: testResult.timeSpent || 0,
    answers: testResult.answers || [],
    test_name: testResult.testName,
    topic: testResult.topic,
    totalQuestions: testResult.totalQuestions
  };
  return recordTestScore(historyData);
};

export const getCourses = async () => {
  return getTopics();
};

export const updateMaterial = async (materialId, materialData) => {
  return updateContent(materialId, materialData);
};

export const deleteMaterial = async (materialId) => {
  return deleteContent(materialId);
};

export const initializeSampleData = async () => {
  try {
    await initializeERDiagramData();
    
    const existingContent = await getContent();
    if (existingContent.length === 0) {
      const sampleContent = [
        { 
          uploader_id: 'teacher-1',
          title: 'Mathematics Fundamentals',
          topic: 'Mathematics',
          type: 'video',
          url: '#',
          description: 'Basic math concepts',
          published: true
        },
        { 
          uploader_id: 'teacher-1',
          title: 'Science Basics',
          topic: 'Science',
          type: 'pdf',
          url: '#',
          description: 'Introduction to science',
          published: true
        }
      ];
      
      for (const content of sampleContent) {
        await createContent(content);
      }
    }
    
    console.log('Sample data initialized successfully');
  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
};
