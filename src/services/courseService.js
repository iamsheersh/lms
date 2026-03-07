import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

/**
 * 1. Uploads a file to Firebase Storage and returns the public URL.
 * @param {File} file - The file object from the input field.
 * @param {Function} onProgress - Optional callback to track upload percentage.
 */
export const uploadFileToStorage = (file, onProgress) => {
  return new Promise((resolve, reject) => {
    // Create a unique file path in Storage
    const storageRef = ref(storage, `materials/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(Math.round(progress));
      },
      (error) => reject(error),
      async () => {
        // Get the final URL once upload is complete
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
};

/**
 * 2. Saves course metadata to Firestore.
 * @param {Object} courseData - { title, category, fileUrl, teacherId }
 */
export const saveCourseMetadata = async (courseData) => {
  try {
    const docRef = await addDoc(collection(db, "courses"), {
      ...courseData,
      createdAt: serverTimestamp(), // Uses Firebase server time
    });
    return docRef.id;
  } catch (error) {
    throw error;
  }
};

/**
 * 3. Combined function for the Teacher Dashboard
 */
export const publishCourseMaterial = async (file, title, category, teacherId, onProgress) => {
  try {
    // Step A: Upload File
    const fileUrl = await uploadFileToStorage(file, onProgress);

    // Step B: Save Info to Database
    const courseId = await saveCourseMetadata({
      title,
      category,
      fileUrl,
      teacherId,
      fileType: file.type
    });

    return courseId;
  } catch (error) {
    console.error("Error publishing material:", error);
    throw error;
  }
};