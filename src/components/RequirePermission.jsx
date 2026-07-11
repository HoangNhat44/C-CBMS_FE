import React from 'react';
import { useAuth } from '../context/AuthContext';

const RequirePermission = ({ code, children }) => {
  const { hasPermission } = useAuth();

  if (!hasPermission(code)) {
    return null;
  }

  return <>{children}</>;
};

export default RequirePermission;
