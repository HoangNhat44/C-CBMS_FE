import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import promotionAPI from "../../services/promotion.service";

export default function ApplyPromotion() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputCode, setInputCode] = useState("");
  const [selectedPromo, setSelectedPromo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        setLoading(true);
        const res = await promotionAPI.getAllPromotions();
        if (res.data?.success || res.success) {
          const allPromos = res.data?.data || res.data || [];
          const now = new Date();
          
          // Lọc: active = true, nằm trong khoảng ngày, và KHÔNG CÓ code
          const validPromos = allPromos.filter(p => {
            const isActive = p.isActive;
            const startDate = p.startDate ? new Date(p.startDate) : new Date(0);
            const endDate = p.endDate ? new Date(p.endDate) : new Date("2100-01-01");
            const isWithinDate = now >= startDate && now <= endDate;
            const hasNoCode = !p.code || p.code.trim() === "";

            return isActive && isWithinDate && hasNoCode;
          });

          setPromotions(validPromos);
        }
      } catch (err) {
        console.error("Fetch promotions failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPromotions();
  }, []);

  const handleApplyCode = () => {
    if (!inputCode.trim()) return;
    // Tạm thời chỉ set mock hoặc có thể check từ API sau này. 
    // Yêu cầu chỉ bảo làm giao diện chưa cần chức năng xử lý sâu.
    alert(`Đã nhấn áp dụng mã: ${inputCode}`);
  };

  const handleConfirm = () => {
    if (!selectedPromo && !inputCode) {
      alert("Vui lòng chọn hoặc nhập mã giảm giá trước khi xác nhận!");
      return;
    }
    alert(`Đã xác nhận áp dụng mã thành công!`);
    navigate(-1);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", padding: "40px 20px" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ 
            background: "none", border: "none", color: "#64748b", cursor: "pointer", 
            display: "flex", alignItems: "center", gap: 5, marginBottom: 20, fontSize: 14, fontWeight: 600
          }}
        >
          <i className="ti ti-arrow-left" /> Quay lại
        </button>

        <div style={{ backgroundColor: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 4px 24px rgba(0,0,0,0.04)", marginBottom: 20 }}>
          <h2 style={{ margin: "0 0 8px 0", color: "#1e293b", fontSize: 20 }}>Mã giảm giá</h2>
          <p style={{ margin: "0 0 24px 0", color: "#64748b", fontSize: 14 }}>Nhập mã giảm giá của bạn hoặc chọn mã có sẵn bên dưới</p>

          {/* Ô nhập mã giảm giá */}
          <div style={{ display: "flex", gap: 10, marginBottom: 30 }}>
            <input 
              type="text" 
              placeholder="Nhập mã code..." 
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              style={{
                flex: 1, padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 15, textTransform: "uppercase"
              }}
            />
            <button 
              onClick={handleApplyCode}
              style={{
                backgroundColor: inputCode.trim() ? "#3b82f6" : "#cbd5e1",
                color: "#fff", border: "none", padding: "0 24px", borderRadius: 8, fontWeight: 600, cursor: inputCode.trim() ? "pointer" : "not-allowed", transition: "0.2s"
              }}
            >
              Áp dụng
            </button>
          </div>

          <h3 style={{ fontSize: 16, color: "#1e293b", marginBottom: 16 }}>Mã giảm giá đang có</h3>

          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>Đang tải mã giảm giá...</div>
          ) : promotions.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#64748b", backgroundColor: "#f1f5f9", borderRadius: 12 }}>
              Hiện tại không có khuyến mãi khả dụng
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {promotions.map((promo) => {
                const isSelected = selectedPromo?._id === promo._id;
                return (
                  <div 
                    key={promo._id} 
                    onClick={() => setSelectedPromo(isSelected ? null : promo)}
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "space-between",
                      padding: 16, 
                      border: `2px solid ${isSelected ? "#3b82f6" : "#e2e8f0"}`, 
                      borderRadius: 12,
                      cursor: "pointer",
                      backgroundColor: isSelected ? "#eff6ff" : "#fff",
                      transition: "all 0.2s"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: "#1e293b" }}>{promo.title}</span>
                      </div>
                      <div style={{ color: "#64748b", fontSize: 13 }}>
                        Giảm {promo.discountType === "percent" ? `${promo.discountValue}%` : `${promo.discountValue.toLocaleString()}đ`}
                        {promo.endDate && ` • HSD: ${new Date(promo.endDate).toLocaleDateString("vi-VN")}`}
                      </div>
                    </div>
                    <div>
                      <div style={{ 
                        width: 24, height: 24, borderRadius: "50%", border: `2px solid ${isSelected ? "#3b82f6" : "#cbd5e1"}`,
                        display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: isSelected ? "#3b82f6" : "transparent"
                      }}>
                        {isSelected && <i className="ti ti-check" style={{ color: "#fff", fontSize: 14 }} />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Khối Xác nhận */}
        <div style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 -4px 24px rgba(0,0,0,0.04)", position: "sticky", bottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 14, color: "#64748b" }}>Đã chọn</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
                {selectedPromo ? selectedPromo.title : inputCode ? `Mã: ${inputCode.toUpperCase()}` : "Chưa chọn"}
              </div>
            </div>
            <button 
              onClick={handleConfirm}
              style={{
                backgroundColor: (selectedPromo || inputCode.trim()) ? "#10b981" : "#cbd5e1",
                color: "#fff", border: "none", padding: "14px 32px", borderRadius: 8, fontWeight: "bold", fontSize: 16,
                cursor: (selectedPromo || inputCode.trim()) ? "pointer" : "not-allowed", transition: "0.2s"
              }}
            >
              Xác nhận
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
