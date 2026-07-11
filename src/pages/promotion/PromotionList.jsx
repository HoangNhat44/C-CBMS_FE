import React, { useState, useEffect } from "react";
import promotionAPI from "../../services/promotion.service";
import PromotionForm from "./PromotionForm";

export default function PromotionList() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const res = await promotionAPI.getAllPromotions("", true);
      if (res.data?.success || res.success) {
        setPromotions(res.data?.data || res.data || []);
      } else if (Array.isArray(res)) {
        setPromotions(res);
      }
    } catch (err) {
      console.error("Fetch promotions failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleCreateOrUpdate = async (data) => {
    try {
      if (editingPromotion) {
        const res = await promotionAPI.updatePromotion(editingPromotion._id, data);
        if (res.data?.success || res.success) {
          setEditingPromotion(null);
          fetchPromotions();
        } else {
          alert(res.data?.message || res.message || "Có lỗi xảy ra");
        }
      } else {
        const res = await promotionAPI.createPromotion(data);
        if (res.data?.success || res.success) {
          setShowAddForm(false);
          fetchPromotions();
        } else {
          alert(res.data?.message || res.message || "Có lỗi xảy ra");
        }
      }
    } catch (err) {
      console.error(err);
      let errMsg = err.response?.data?.message || err.response?.data?.error || err.message || "Lỗi kết nối hoặc xử lý";
      if (errMsg.includes("E11000") && errMsg.includes("code_1")) {
        errMsg = "Mã khuyến mãi đã tồn tại trong hệ thống";
      }
      alert(errMsg);
    }
  };

  if (loading) {
    return <div style={{ padding: 20 }}>Đang tải dữ liệu khuyến mãi...</div>;
  }

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div className="pg-title">Quản lý khuyến mãi</div>
          <div className="pg-sub">Xem và cấu hình các chương trình giảm giá</div>
        </div>
        {(!showAddForm && !editingPromotion) && (
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary"
            style={{ padding: "8px 16px", borderRadius: 8, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}
          >
            <i className="ti ti-plus" /> Thêm khuyến mãi
          </button>
        )}
      </div>

      {(showAddForm || editingPromotion) ? (
        <PromotionForm
          promotion={editingPromotion}
          onSubmit={handleCreateOrUpdate}
          onCancel={() => {
            setShowAddForm(false);
            setEditingPromotion(null);
          }}
        />
      ) : (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-head">
            <div className="card-title">
              <i className="ti ti-ticket" aria-hidden="true" />
              Danh sách khuyến mãi
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="dash-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "12px 16px" }}>Code</th>
                  <th style={{ textAlign: "left", padding: "12px 16px" }}>Tiêu đề</th>
                  <th style={{ textAlign: "left", padding: "12px 16px" }}>Mức giảm</th>
                  <th style={{ textAlign: "left", padding: "12px 16px" }}>Thời gian</th>
                  <th style={{ textAlign: "left", padding: "12px 16px" }}>Trạng thái</th>
                  <th style={{ textAlign: "right", padding: "12px 16px" }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {promotions.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>Chưa có khuyến mãi nào.</td>
                  </tr>
                ) : (
                  promotions.map((p) => (
                    <tr key={p._id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontWeight: 600, background: "var(--surface)", padding: "4px 8px", borderRadius: 4, border: "1px solid var(--border)" }}>
                          {p.code}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>{p.title}</td>
                      <td style={{ padding: "12px 16px" }}>
                        {p.discountType === "percent" ? `${p.discountValue}%` : `${p.discountValue.toLocaleString()} VND`}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13 }}>
                        {new Date(p.startDate).toLocaleDateString("vi-VN")} - {new Date(p.endDate).toLocaleDateString("vi-VN")}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span className={`pill ${p.isActive ? "pill-on" : "pill-off"}`}>
                          {p.isActive ? "Đang chạy" : "Tạm dừng"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", padding: "12px 16px" }}>
                        <button
                          onClick={() => setEditingPromotion(p)}
                          style={{
                            background: "transparent",
                            border: "1px solid var(--border)",
                            padding: "6px 12px",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: 600
                          }}
                        >
                          Chỉnh sửa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
