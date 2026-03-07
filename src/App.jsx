import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { ThemeProvider } from './ThemeContext';
import Login from './Login';
import StudentDashboard from './StudentDashboard';
import TeacherDashboard from './TeacherDashboard';
import AdminDashboard from './AdminDashboard';
import ForgotPassword from './ForgotPassword';
import Signup from './SignUp';
import ProtectedRoute from './ProtectedRoute'; // Import the guard

export default function App() {
  // --- Auth Observer: Keeps user logged in on page refresh ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, sync LocalStorage for the ProtectedRoute check
        localStorage.setItem('isAuthenticated', 'true');
      } else {
        // User is signed out
        localStorage.clear();
      }
    });
    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/Signup" element={<Signup />} />
          
          {/* --- PROTECTED ROUTES --- */}
          <Route 
            path="/student-dashboard" 
            element={
              <ProtectedRoute allowedRole="Student">
                <StudentDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/teacher-dashboard" 
            element={
              <ProtectedRoute allowedRole="Teacher">
                <TeacherDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedRoute allowedRole="Admin">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}