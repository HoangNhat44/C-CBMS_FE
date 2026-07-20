import React, { useState, useEffect } from "react";
import userAPI from "../../services/user.service";
import roleAPI from "../../services/role.service";
import branchAPI from "../../services/branch.service";
import UserForm from "./UserForm";
import { useAuth } from "../../context/AuthContext";

export default function AddUserModal({ onClose, onSuccess }) {
  const { user: currentUser } = useAuth();
  const [rolesList, setRolesList] = useState([]);
  const [branchesList, setBranchesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [rRes, bRes] = await Promise.all([
          roleAPI.getAllRoles(),
          branchAPI.getAllBranches()
        ]);
        if (rRes.data?.success) setRolesList(rRes.data.data || []);
        if (bRes.data?.success) setBranchesList(bRes.data.data || []);
      } catch (err) {
        console.error("Fetch data failed", err);
        setError(err.response?.data?.message || err.message || "Lỗi khi lấy dữ liệu");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreateUser = async (data) => {
    try {
      const res = await userAPI.createUser(data);
      if (res.data?.success) {
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const currentRoleName = currentUser?.role?.name?.toLowerCase() || currentUser?.roleId?.name?.toLowerCase() || "";
  let allowedRoles = rolesList.filter(r => r.name?.toLowerCase() !== "admin");
  if (currentRoleName === "staff") {
    allowedRoles = allowedRoles.filter(r => r.name?.toLowerCase() === "customer");
  } else if (currentRoleName === "owner") {
    allowedRoles = allowedRoles.filter(r => ["customer", "staff"].includes(r.name?.toLowerCase()));
  }

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", overflow: "auto", padding: "20px 0" }}>
      <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 600, position: "relative", padding: 24, margin: "auto", zIndex: 10000 }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "var(--text-muted)", zIndex: 10 }}>&times;</button>
        {error ? (
          <div style={{ padding: 20, textAlign: "center", color: "red" }}>{error}</div>
        ) : loading ? (
          <div style={{ padding: 20, textAlign: "center" }}>Đang tải...</div>
        ) : (
          <UserForm
            roles={allowedRoles}
            branches={branchesList}
            onSubmit={handleCreateUser}
            onCancel={onClose}
          />
        )}
      </div>
    </div>
  );
}
