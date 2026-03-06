import React from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from './firebase';

const ProtectedRoute = ({ children, allowedRole }) => {
  // We check LocalStorage for a quick check, 
  // but Firebase Auth state is the "True" source.
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const userRole = localStorage.getItem('userRole');

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (allowedRole && userRole !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;