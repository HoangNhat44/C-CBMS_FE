import React, { useState, useEffect } from "react";
import branchAPI from "../../services/branch.service";

export default function PromotionForm({ promotion, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: "",
    code: "",
    discountType: "percent",
    discountValue: 0,
    startDate: "",
    endDate: "",
    branchIds: [],
    isActive: true,
    maxUsage: "",
  });
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    // Fetch branches for selection
    const fetchBranches = async () => {
      try {
        const res = await branchAPI.getAllBranches();
        if (res.data?.success) {
          setBranches(res.data.data || []);
        } else if (res.success) { // Fallback just in case
          setBranches(res.data || []);
        } else if (Array.isArray(res)) {
          setBranches(res);
        }
      } catch (err) {
        console.error("Fetch branches failed", err);
      }
    };
    fetchBranches();
  }, []);

  useEffect(() => {
    if (promotion) {
      setFormData({
        title: promotion.title || "",
        code: promotion.code || "",
        discountType: promotion.discountType || "percent",
        discountValue: promotion.discountValue || 0,
        startDate: promotion.startDate ? new Date(promotion.startDate).toISOString().slice(0, 10) : "",
        endDate: promotion.endDate ? new Date(promotion.endDate).toISOString().slice(0, 10) : "",
        branchIds: promotion.branchIds?.map(b => b._id || b) || [],
        isActive: promotion.isActive !== undefined ? promotion.isActive : true,
        maxUsage: promotion.maxUsage || "",
      });
    }
  }, [promotion]);

  const handleBranchToggle = (branchId) => {
    setFormData((prev) => {
      const isSelected = prev.branchIds.includes(branchId);
      if (isSelected) {
        return { ...prev, branchIds: prev.branchIds.filter(id => id !== branchId) };
      } else {
        return { ...prev, branchIds: [...prev.branchIds, branchId] };
      }
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleRadioChange = (e) => {
    const { name, value } = e.target;
    if (name === "isActive") {
      setFormData((prev) => ({ ...prev, isActive: value === "true" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      maxUsage: formData.maxUsage !== "" ? Number(formData.maxUsage) : null
    };
    onSubmit(submitData);
  };

  return (
    <div className="card" style={{ maxWidth: 600, margin: "0 auto" }}>
      <div className="card-head">
        <div className="card-title">
          <i className="ti ti-ticket" aria-hidden="true" />
          {promotion ? "Chỉnh sửa khuyến mãi" : "Thêm khuyến mãi mới"}
        </div>
      </div>
      <form onSubmit={handleSubmit} style={{ padding: 20 }}>
        <div className="form-group" style={{ marginBottom: 15 }}>
          <label style={{ display: "block", marginBottom: 5, fontWeight: 600, fontSize: 13 }}>Tiêu đề</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8 }}
            required
          />
        </div>
        
        <div className="form-group" style={{ marginBottom: 15 }}>
          <label style={{ display: "block", marginBottom: 5, fontWeight: 600, fontSize: 13 }}>Mã code</label>
          <input
            type="text"
            name="code"
            value={formData.code}
            onChange={handleChange}
            style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8, textTransform: "uppercase" }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 15, display: "flex", gap: 20 }}>
          <div>
            <label style={{ display: "block", marginBottom: 5, fontWeight: 600, fontSize: 13 }}>Loại giảm giá</label>
            <div style={{ display: "flex", gap: 15 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <input type="radio" name="discountType" value="percent" checked={formData.discountType === "percent"} onChange={handleRadioChange} />
                Phần trăm (%)
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <input type="radio" name="discountType" value="fixed" checked={formData.discountType === "fixed"} onChange={handleRadioChange} />
                Giảm thẳng
              </label>
            </div>
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 15 }}>
          <label style={{ display: "block", marginBottom: 5, fontWeight: 600, fontSize: 13 }}>Giá trị giảm</label>
          <input
            type="number"
            name="discountValue"
            value={formData.discountValue}
            onChange={handleChange}
            style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8 }}
            min="0"
            required
          />
        </div>

        <div className="form-group" style={{ marginBottom: 15 }}>
          <label style={{ display: "block", marginBottom: 5, fontWeight: 600, fontSize: 13 }}>Giới hạn lượt sử dụng</label>
          <input
            type="number"
            name="maxUsage"
            value={formData.maxUsage}
            onChange={handleChange}
            placeholder="Bỏ trống nếu không giới hạn"
            style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8 }}
            min="1"
          />
        </div>

        <div style={{ display: "flex", gap: 15, marginBottom: 15 }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: 5, fontWeight: 600, fontSize: 13 }}>Ngày bắt đầu</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8 }}
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: 5, fontWeight: 600, fontSize: 13 }}>Ngày kết thúc</label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8 }}
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 15 }}>
          <label style={{ display: "block", marginBottom: 5, fontWeight: 600, fontSize: 13 }}>Áp dụng cho chi nhánh</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 15, padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)" }}>
            {branches.map(b => (
              <label key={b._id} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.branchIds.includes(b._id)}
                  onChange={() => handleBranchToggle(b._id)}
                />
                {b.name}
              </label>
            ))}
            {branches.length === 0 && <span style={{ color: "var(--text-muted)", fontSize: 13 }}>Chưa có chi nhánh nào</span>}
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 25 }}>
          <label style={{ display: "block", marginBottom: 5, fontWeight: 600, fontSize: 13 }}>Trạng thái</label>
          <div style={{ display: "flex", gap: 15 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <input type="radio" name="isActive" value="true" checked={formData.isActive === true} onChange={handleRadioChange} />
              Hoạt động
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <input type="radio" name="isActive" value="false" checked={formData.isActive === false} onChange={handleRadioChange} />
              Vô hiệu hóa
            </label>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn-outline"
              style={{ padding: "8px 16px", borderRadius: 8, cursor: "pointer", border: "1px solid var(--border)", background: "#fff", fontWeight: 600 }}
            >
              Hủy
            </button>
          )}
          <button
            type="submit"
            className="btn-primary"
            style={{ padding: "8px 16px", borderRadius: 8, cursor: "pointer", background: "#1d4ed8", color: "#ffffff", border: "none", fontWeight: 600 }}
          >
            {promotion ? "Lưu thay đổi" : "Thêm khuyến mãi"}
          </button>
        </div>
      </form>
    </div>
  );
}
