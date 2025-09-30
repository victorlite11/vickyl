import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (requiredRole && payload.role !== requiredRole) {
      return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
  } catch {
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;
