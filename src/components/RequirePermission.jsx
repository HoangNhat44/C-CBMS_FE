import React from 'react';
import { useAuth } from '../context/AuthContext';

const RequirePermission = ({ code, require, children }) => {
  const { hasPermission, user } = useAuth();

  const targetPermission = code || require;

  // Owner role has full access to slot operations
  const isOwner = user?.role === 'owner' || user?.roleId?.name === 'owner' || user?.role?.name === 'owner';
  if (isOwner) {
    return <>{children}</>;
  }

  if (targetPermission && !hasPermission(targetPermission)) {
    return null;
  }

  return <>{children}</>;
};

export default RequirePermission;
