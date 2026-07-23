import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ requiredPermissions = [], allowedRoles = [] }) => {
  const { user, loading, hasPermission } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role if allowedRoles is specified
  if (allowedRoles.length > 0) {
    const userRole = user?.roleId?.name?.toLowerCase() || user?.role?.name?.toLowerCase() || user?.role?.toLowerCase();
    if (!userRole || !allowedRoles.map(r => r.toLowerCase()).includes(userRole)) {
      return <Navigate to="/access-denied" replace />;
    }
  }

  // Check permission if requiredPermissions is specified
  if (requiredPermissions.length > 0 && !hasPermission(requiredPermissions)) {
    return <Navigate to="/access-denied" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
