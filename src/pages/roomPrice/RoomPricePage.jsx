import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import { ownerMenuItems } from "../dashboard/Owner";
import branchAPI from "../../services/branch.service";
import roomPriceAPI from "../../services/roomPrice.service";
import { useAuth } from "../../context/AuthContext";
import "../dashboard/Dashboard.css";
import "./RoomPricePage.css";

export default function RoomPricePage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [activeTab, setActiveTab] = useState("matrix"); // "matrix" | "history"

  // Master Data
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [dayType, setDayType] = useState("weekday"); // "weekday" | "weekend"

  // Matrix State
  const [roomTypes, setRoomTypes] = useState([]);
  const [slots, setSlots] = useState([]);
  const [priceMap, setPriceMap] = useState({});
  const [editedPrices, setEditedPrices] = useState({});
  const [saveReason, setSaveReason] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Bulk Edit Modal
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState("percent"); // "percent" | "amount"
  const [bulkValue, setBulkValue] = useState("");

  // History State
  const [histories, setHistories] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);

  // Fetch branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await branchAPI.getAllBranches();
        const branchList = res.data?.data || res.data || [];
        setBranches(branchList);
        if (branchList.length > 0) {
          setSelectedBranchId(branchList[0]._id);
        }
      } catch (err) {
        console.error("Fetch branches error:", err);
      }
    };
    fetchBranches();
  }, []);

  // Fetch Price Matrix
  const fetchMatrix = useCallback(async () => {
    if (!selectedBranchId) return;
    try {
      setLoading(true);
      setError("");
      const res = await roomPriceAPI.getMatrix(selectedBranchId, dayType);
      if (res.data?.success) {
        const data = res.data.data;
        setRoomTypes(data.roomTypes || []);
        setSlots(data.slots || []);
        setPriceMap(data.priceMap || {});
        setEditedPrices(data.priceMap || {});
      }
    } catch (err) {
      console.error("Fetch price matrix failed:", err);
      setError(err.response?.data?.message || "Không thể tải ma trận giá phòng.");
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId, dayType]);

  useEffect(() => {
    if (activeTab === "matrix") {
      fetchMatrix();
    }
  }, [fetchMatrix, activeTab]);

  // Fetch Price History
  const fetchHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const res = await roomPriceAPI.getHistory({
        branchId: selectedBranchId,
        dayType,
        page: historyPage,
        limit: 10,
      });
      if (res.data?.success) {
        setHistories(res.data.data || []);
        setHistoryTotalPages(res.data.pagination?.totalPages || 1);
        setHistoryTotal(res.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Fetch price history failed:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, [selectedBranchId, dayType, historyPage]);

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [fetchHistory, activeTab]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Handle cell price edit
  const handleCellChange = (roomTypeId, slotId, value) => {
    const key = `${roomTypeId}_${slotId}`;
    const numVal = value === "" ? "" : Math.max(0, parseInt(value, 10) || 0);
    setEditedPrices((prev) => ({
      ...prev,
      [key]: numVal,
    }));
  };

  // Submit Matrix Price Changes
  const handleSaveMatrix = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const updates = [];
      roomTypes.forEach((rt) => {
        slots.forEach((st) => {
          const key = `${rt._id}_${st._id}`;
          const currentVal = editedPrices[key] !== undefined ? editedPrices[key] : (priceMap[key] || 0);
          updates.push({
            roomTypeId: rt._id,
            slotId: st._id,
            pricePerHour: Number(currentVal) || 0,
          });
        });
      });

      const res = await roomPriceAPI.updateMatrix({
        branchId: selectedBranchId,
        dayType,
        updates,
        reason: saveReason.trim() || `Cập nhật bảng giá phòng (${dayType === "weekday" ? "Ngày thường" : "Cuối tuần"})`,
      });

      if (res.data?.success) {
        setSuccess(res.data.message || "Cập nhật giá phòng và lưu lịch sử thành công!");
        setSaveReason("");
        await fetchMatrix();
      } else {
        setError(res.data?.message || "Cập nhật bảng giá thất bại.");
      }
    } catch (err) {
      console.error("Save price matrix failed:", err);
      setError(err.response?.data?.message || "Lỗi khi lưu bảng giá phòng.");
    } finally {
      setSaving(false);
    }
  };

  // Handle Bulk Adjust
  const handleApplyBulk = () => {
    const val = parseFloat(bulkValue);
    if (isNaN(val)) {
      alert("Vui lòng nhập số tiền hoặc phần trăm hợp lệ!");
      return;
    }

    const newMap = { ...editedPrices };

    Object.keys(newMap).forEach((key) => {
      const current = Number(newMap[key]) || 0;
      if (bulkMode === "percent") {
        newMap[key] = Math.round(current * (1 + val / 100));
      } else {
        newMap[key] = Math.max(0, current + val);
      }
    });

    setEditedPrices(newMap);
    setIsBulkModalOpen(false);
    setBulkValue("");
    setSuccess(`Đã áp dụng điều chỉnh ${bulkMode === "percent" ? `${val}%` : `${val.toLocaleString('vi-VN')}đ`} cho toàn bộ ô trong ma trận. Vui lòng bấm "Lưu bảng giá" để hoàn tất!`);
  };

  const selectedBranchName = useMemo(() => {
    return branches.find((b) => b._id === selectedBranchId)?.name || "Chi nhánh";
  }, [branches, selectedBranchId]);

  return (
    <div className="dash">
      <Sidebar
        menuItems={ownerMenuItems}
        active="roomprice"
        handleLogout={handleLogout}
        onLogoClick={() => navigate("/owner-dashboard")}
      />

      <div className="main">
        <Topbar breadcrumbs={[{ label: "Trang chủ", link: "/owner-dashboard" }, { label: "Quản lý giá phòng" }]} />

        <div className="content room-price-container">
          {/* Header */}
          <header className="price-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 className="pg-title">Quản lý Bảng giá Phòng & Lịch sử</h1>
              <p className="pg-sub">Thiết lập đơn giá thuê phòng theo Loại phòng, Slot khung giờ và Loại ngày (Ngày thường & Cuối tuần). Tự động ghi nhật ký sửa giá.</p>
            </div>
          </header>

          {/* Navigation Tabs */}
          <nav className="price-tabs-bar">
            <button
              className={`price-tab-btn ${activeTab === "matrix" ? "active" : ""}`}
              onClick={() => setActiveTab("matrix")}
            >
              <i className="ti ti-table" /> Ma trận giá phòng
            </button>
            <button
              className={`price-tab-btn ${activeTab === "history" ? "active" : ""}`}
              onClick={() => setActiveTab("history")}
            >
              <i className="ti ti-history" /> Nhật ký sửa giá ({historyTotal})
            </button>
          </nav>

          {/* Alert notifications */}
          {success && <div className="message-alert success">{success}</div>}
          {error && <div className="message-alert error">{error}</div>}

          {/* TAB 1: PRICE MATRIX */}
          {activeTab === "matrix" && (
            <>
              {/* Control Bar */}
              <section className="price-control-bar">
                <div className="price-control-group">
                  <label className="price-select-label">
                    <i className="ti ti-building-store" style={{ color: "#0f766e" }} /> Chi nhánh:
                    <select
                      className="price-select-input"
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(e.target.value)}
                    >
                      {branches.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="daytype-pills">
                    <button
                      className={`daytype-pill-btn ${dayType === "weekday" ? "active" : ""}`}
                      onClick={() => setDayType("weekday")}
                    >
                      📅 Ngày thường (T2 - T6)
                    </button>
                    <button
                      className={`daytype-pill-btn ${dayType === "weekend" ? "active" : ""}`}
                      onClick={() => setDayType("weekend")}
                    >
                      🥂 Cuối tuần (T7 - CN)
                    </button>
                  </div>
                </div>

                <div className="price-actions-group">
                  <button className="btn-bulk-edit" onClick={() => setIsBulkModalOpen(true)}>
                    <i className="ti ti-adjustments" /> Điều chỉnh hàng loạt
                  </button>
                  <button className="btn-save-matrix" onClick={handleSaveMatrix} disabled={saving || loading}>
                    <i className="ti ti-device-floppy" /> {saving ? "Đang lưu..." : "Lưu bảng giá"}
                  </button>
                </div>
              </section>

              {/* Optional Reason Input */}
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="Nhập ghi chú / lý do điều chỉnh giá (ví dụ: Áp dụng bảng giá mùa hè)..."
                  className="price-select-input"
                  style={{ flex: 1, background: "#ffffff" }}
                  value={saveReason}
                  onChange={(e) => setSaveReason(e.target.value)}
                />
              </div>

              {/* Matrix Table List */}
              {loading ? (
                <div className="state-display">Đang tải ma trận giá phòng...</div>
              ) : roomTypes.length === 0 ? (
                <div className="state-display">Chưa có dữ liệu Loại phòng. Vui lòng tạo Loại phòng trước!</div>
              ) : slots.length === 0 ? (
                <div className="state-display">Chưa có dữ liệu Slot khung giờ. Vui lòng tạo Slot trước!</div>
              ) : (
                <div className="matrix-wrapper">
                  <table className="matrix-table">
                    <thead>
                      <tr>
                        <th style={{ minWidth: "180px" }}>Loại phòng \ Slot</th>
                        {slots.map((st) => (
                          <th key={st._id} style={{ textAlign: "center" }}>
                            <div>{st.name}</div>
                            <div style={{ fontSize: "0.75rem", textTransform: "none", color: "#64748b", fontWeight: 600 }}>
                              ⏰ {st.startTime} - {st.endTime}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {roomTypes.map((rt) => (
                        <tr key={rt._id}>
                          <td style={{ fontWeight: 800, color: "#0f172a" }}>
                            <div>{rt.name}</div>
                            <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 500 }}>
                              Sức chứa: {rt.capacity} người
                            </div>
                          </td>

                          {slots.map((st) => {
                            const key = `${rt._id}_${st._id}`;
                            const val = editedPrices[key] !== undefined ? editedPrices[key] : (priceMap[key] || 0);

                            return (
                              <td key={st._id} style={{ textAlign: "center" }}>
                                <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                  <input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    className="cell-price-input"
                                    value={val === 0 ? "" : val}
                                    placeholder="0"
                                    onChange={(e) => handleCellChange(rt._id, st._id, e.target.value)}
                                  />
                                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#64748b" }}>đ/h</span>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* TAB 2: PRICE HISTORY LOG */}
          {activeTab === "history" && (
            <>
              {/* History Filter Bar */}
              <section className="price-control-bar">
                <div className="price-control-group">
                  <label className="price-select-label">
                    <i className="ti ti-building-store" style={{ color: "#0f766e" }} /> Chi nhánh:
                    <select
                      className="price-select-input"
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(e.target.value)}
                    >
                      <option value="">Tất cả Chi nhánh</option>
                      {branches.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="daytype-pills">
                    <button
                      className={`daytype-pill-btn ${dayType === "" ? "active" : ""}`}
                      onClick={() => setDayType("")}
                    >
                      Tất cả Loại ngày
                    </button>
                    <button
                      className={`daytype-pill-btn ${dayType === "weekday" ? "active" : ""}`}
                      onClick={() => setDayType("weekday")}
                    >
                      📅 Ngày thường
                    </button>
                    <button
                      className={`daytype-pill-btn ${dayType === "weekend" ? "active" : ""}`}
                      onClick={() => setDayType("weekend")}
                    >
                      🥂 Cuối tuần
                    </button>
                  </div>
                </div>
              </section>

              {/* History Table */}
              {historyLoading ? (
                <div className="state-display">Đang tải nhật ký sửa giá...</div>
              ) : histories.length === 0 ? (
                <div className="state-display">Chưa có nhật ký ghi nhận thay đổi giá phòng nào.</div>
              ) : (
                <div className="matrix-wrapper">
                  <table className="matrix-table">
                    <thead>
                      <tr>
                        <th>Thời gian</th>
                        <th>Chi nhánh</th>
                        <th>Loại phòng</th>
                        <th>Slot (Khung giờ)</th>
                        <th>Loại ngày</th>
                        <th>Giá cũ $\rightarrow$ Giá mới</th>
                        <th>Chênh lệch</th>
                        <th>Người thực hiện</th>
                        <th>Lý do / Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {histories.map((h) => {
                        const isIncrease = h.difference > 0;
                        const isDecrease = h.difference < 0;

                        return (
                          <tr key={h._id}>
                            <td style={{ fontSize: "0.85rem", fontWeight: 700, color: "#334e68" }}>
                              {new Date(h.createdAt).toLocaleString("vi-VN")}
                            </td>
                            <td style={{ fontWeight: 700 }}>{h.branchId?.name || selectedBranchName}</td>
                            <td style={{ fontWeight: 800, color: "#0f172a" }}>{h.roomTypeId?.name || "Loại phòng"}</td>
                            <td>
                              <div><strong>{h.slotId?.name || "Slot"}</strong></div>
                              {h.slotId?.startTime && (
                                <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                                  ⏰ {h.slotId.startTime} - {h.slotId.endTime}
                                </div>
                              )}
                            </td>
                            <td>
                              <span className="time-type-badge standard">
                                {h.dayType === "weekday" ? "📅 Ngày thường" : "🥂 Cuối tuần"}
                              </span>
                            </td>
                            <td>
                              <span style={{ color: "#64748b" }}>{h.oldPricePerHour?.toLocaleString("vi-VN")}đ</span>
                              <span style={{ margin: "0 6px" }}>→</span>
                              <strong style={{ color: "#0f766e" }}>{h.newPricePerHour?.toLocaleString("vi-VN")}đ</strong>
                            </td>
                            <td>
                              <span className={`history-diff-badge ${isIncrease ? "increase" : isDecrease ? "decrease" : "neutral"}`}>
                                {isIncrease ? `+${h.difference.toLocaleString("vi-VN")}đ` : `${h.difference.toLocaleString("vi-VN")}đ`}
                              </span>
                            </td>
                            <td style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                              👤 {h.updatedBy?.fullName || h.updatedBy?.name || h.updatedBy?.email || "Owner"}
                            </td>
                            <td style={{ fontSize: "0.85rem", color: "#475569" }}>
                              {h.reason || "Cập nhật đơn giá"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* History Pagination */}
                  {historyTotalPages > 1 && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", background: "#ffffff", borderTop: "1px solid #f1f5f9" }}>
                      <div style={{ fontSize: "0.88rem", color: "#64748b", fontWeight: 600 }}>
                        Trang <strong>{historyPage}</strong> trên <strong>{historyTotalPages}</strong> (Tổng <strong>{historyTotal}</strong> lịch sử)
                      </div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          disabled={historyPage === 1}
                          onClick={() => setHistoryPage((prev) => Math.max(prev - 1, 1))}
                          style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: historyPage === 1 ? "#f1f5f9" : "#ffffff", cursor: historyPage === 1 ? "not-allowed" : "pointer", fontWeight: 700 }}
                        >
                          ← Trang trước
                        </button>
                        <button
                          disabled={historyPage === historyTotalPages}
                          onClick={() => setHistoryPage((prev) => Math.min(prev + 1, historyTotalPages))}
                          style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: historyPage === historyTotalPages ? "#f1f5f9" : "#ffffff", cursor: historyPage === historyTotalPages ? "not-allowed" : "pointer", fontWeight: 700 }}
                        >
                          Trang sau →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Bulk Edit Modal */}
      {isBulkModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ width: "450px" }}>
            <div className="modal-header">
              <h2>Điều chỉnh giá hàng loạt</h2>
              <button className="modal-close" onClick={() => setIsBulkModalOpen(false)}>×</button>
            </div>
            <div className="modal-form">
              <p style={{ fontSize: "0.9rem", color: "#64748b", margin: 0 }}>
                Áp dụng thay đổi cho tất cả các ô đơn giá hiện đang hiển thị trong ma trận ({dayType === "weekday" ? "Ngày thường" : "Cuối tuần"}).
              </p>

              <label className="form-label">
                Loại điều chỉnh:
                <select
                  className="price-select-input"
                  value={bulkMode}
                  onChange={(e) => setBulkMode(e.target.value)}
                >
                  <option value="percent">Điều chỉnh theo phần trăm (%)</option>
                  <option value="amount">Điều chỉnh theo số tiền cộng/trừ (VNĐ)</option>
                </select>
              </label>

              <label className="form-label">
                Giá trị điều chỉnh {bulkMode === "percent" ? "(Ví dụ: 10 để tăng 10%, -5 để giảm 5%)" : "(Ví dụ: 20000 để tăng 20.000đ, -10000 để giảm 10.000đ)"}:
                <input
                  type="number"
                  placeholder={bulkMode === "percent" ? "Ví dụ: 15" : "Ví dụ: 20000"}
                  value={bulkValue}
                  onChange={(e) => setBulkValue(e.target.value)}
                />
              </label>

              <div className="modal-footer">
                <button className="modal-btn cancel" onClick={() => setIsBulkModalOpen(false)}>
                  Hủy bỏ
                </button>
                <button className="modal-btn submit" onClick={handleApplyBulk}>
                  Áp dụng ma trận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
