import React, { useState, useEffect } from 'react';
import roleAPI from '../../services/role.service';
import permissionAPI from '../../services/permission.service';
import './RolePermission.css';

const RolePermission = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [info, setInfo] = useState('');

  // Map: roleId -> Set(permission codes)
  const [rolePermissionsMap, setRolePermissionsMap] = useState({});
  const [initialRolePermissionsMap, setInitialRolePermissionsMap] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [roleRes, permRes] = await Promise.all([
        roleAPI.getAllRoles(),
        permissionAPI.getAllPermissions()
      ]);

      const fetchedRoles = roleRes.data.data;
      const fetchedPerms = permRes.data.data;

      setRoles(fetchedRoles);
      setPermissions(fetchedPerms);

      const initialMap = {};
      fetchedRoles.forEach(role => {
        initialMap[role._id] = new Set(role.permissions.map(p => p.code));
      });
      setRolePermissionsMap(initialMap);
      setInitialRolePermissionsMap(initialMap);

    } catch (err) {
      setError(err.response?.data?.message || 'Tải danh sách vai trò và quyền hạn thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (roleId, permissionCode, isChecked) => {
    setRolePermissionsMap(prev => {
      const newMap = { ...prev };
      const roleSet = new Set(newMap[roleId]);
      if (isChecked) {
        roleSet.add(permissionCode);
      } else {
        roleSet.delete(permissionCode);
      }
      newMap[roleId] = roleSet;
      return newMap;
    });
  };

  const hasChanges = () => {
    for (const role of roles) {
      const initial = initialRolePermissionsMap[role._id];
      const current = rolePermissionsMap[role._id];
      if (!initial || !current) continue;
      if (initial.size !== current.size) return true;
      for (const code of current) {
        if (!initial.has(code)) return true;
      }
    }
    return false;
  };

  const handleSave = async () => {
    if (!hasChanges()) {
      setInfo('Không có thay đổi nào để lưu!');
      setTimeout(() => setInfo(''), 3000);
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');
      setInfo('');
      
      const updatePromises = roles.map(role => {
        const codes = Array.from(rolePermissionsMap[role._id]);
        return roleAPI.updateRolePermissions(role._id, codes);
      });

      await Promise.all(updatePromises);
      
      // Update initial state to reflect new saved state
      setInitialRolePermissionsMap(rolePermissionsMap);

      setSuccess('Lưu thay đổi phân quyền thành công!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Cập nhật quyền hạn thất bại!');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Group permissions by module
  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = [];
    }
    acc[perm.module].push(perm);
    return acc;
  }, {});

  if (loading) return <div>Đang tải...</div>;

  return (
    <div className="role-permission-container">
      <h2>Ma trận Phân quyền</h2>
      
      {/* Toast Notifications */}
      {error && (
        <div className="toast-message error-message">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
          {error}
        </div>
      )}
      {success && (
        <div className="toast-message success-message">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          {success}
        </div>
      )}
      {info && (
        <div className="toast-message info-message">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          {info}
        </div>
      )}
      
      <div className="matrix-table-wrapper">
        <table className="matrix-table">
          <thead>
            <tr>
              <th>Module / Quyền</th>
              {roles.map(role => (
                <th key={role._id}>{role.name.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.keys(groupedPermissions).map(moduleName => (
              <React.Fragment key={moduleName}>
                <tr className="module-row">
                  <td colSpan={roles.length + 1}>
                    <strong>{moduleName}</strong>
                  </td>
                </tr>
                {groupedPermissions[moduleName].map(perm => (
                  <tr key={perm.code}>
                    <td className="perm-name">{perm.name}</td>
                    {roles.map(role => (
                      <td key={`${role._id}-${perm.code}`} className="checkbox-cell">
                        <input 
                          type="checkbox" 
                          checked={rolePermissionsMap[role._id]?.has(perm.code) || false}
                          onChange={(e) => handleCheckboxChange(role._id, perm.code, e.target.checked)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="actions">
        <button className="save-btn" onClick={handleSave} disabled={saving}>
          {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
        </button>
      </div>
    </div>
  );
};

export default RolePermission;
