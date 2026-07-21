import React, { createContext, useContext, useState, useEffect } from "react";
import authAPI from "../services/auth.service";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const response = await authAPI.verifyToken();
          const { user } = response.data.data;
          setUser(user);
          // Assuming user.role.permissions is an array of permission objects or codes
          if (user?.roleId?.permissions) {
            setPermissions(user.roleId.permissions.map(p => p.code || p));
          } else if (user?.role?.permissions) {
            setPermissions(user.role.permissions.map(p => p.code || p));
          }
        } catch (error) {
          console.error("Token verification failed:", error);
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (userData, token) => {
    localStorage.setItem("token", token);
    setUser(userData);
    if (userData?.roleId?.permissions) {
      setPermissions(userData.roleId.permissions.map(p => p.code || p));
    } else if (userData?.role?.permissions) {
      setPermissions(userData.role.permissions.map(p => p.code || p));
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem("token");
    setUser(null);
    setPermissions([]);
  };

  const hasPermission = (requiredCodes) => {
    if (user?.role === 'owner' || user?.roleId?.name === 'owner' || user?.role?.name === 'owner') return true;
    if (!permissions.length) return false;
    const codesToCheck = Array.isArray(requiredCodes) ? requiredCodes : [requiredCodes];
    return permissions.some(code => codesToCheck.includes(code));
  };

  const value = {
    user,
    permissions,
    loading,
    login,
    logout,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
