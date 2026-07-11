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

  // Map: roleId -> Set(permission codes)
  const [rolePermissionsMap, setRolePermissionsMap] = useState({});

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

    } catch (err) {
      setError('Tải danh sách vai trò và quyền hạn thất bại');
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

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      const updatePromises = roles.map(role => {
        const codes = Array.from(rolePermissionsMap[role._id]);
        return roleAPI.updateRolePermissions(role._id, codes);
      });

      await Promise.all(updatePromises);
      setSuccess('Cập nhật quyền hạn thành công!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Cập nhật quyền hạn thất bại');
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
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
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
