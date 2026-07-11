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

  if (requiredPermissions.length > 0 && !hasPermission(requiredPermissions)) {
    return <Navigate to="/access-denied" replace />;
  }

  if (allowedRoles.length > 0) {
    // roleId có thể là object populated (có .name) hoặc string id
    const roleNameRaw =
      (user?.roleId && typeof user.roleId === "object" ? user.roleId.name : null) ||
      user?.role?.name ||
      "";
    const roleName = roleNameRaw.toLowerCase();
    const allowed = allowedRoles.map(r => r.toLowerCase());
    if (!allowed.includes(roleName)) {
      return <Navigate to="/access-denied" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
