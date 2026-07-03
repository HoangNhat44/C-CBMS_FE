import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Dashboard.css";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import PromotionList from "../promotion/PromotionList";
import userAPI from "../../services/user.service";
import bookingAPI from "../../services/booking.service";
import feedbackAPI from "../../services/feedback.service";
import branchAPI from "../../services/branch.service";
import promotionAPI from "../../services/promotion.service";

export const ownerMenuItems = [
  {
    section: "Tổng quan",
    items: [{ icon: "ti-chart-bar", label: "Doanh thu", badge: "Mới", key: "revenue" }],
  },
  {
    section: "Đặt phòng",
    items: [{ icon: "ti-calendar-event", label: "Lịch sử đặt phòng", key: "bookinghistory" }],
  },
  {
    section: "Cơ sở vật chất",
    items: [
      { icon: "ti-building", label: "Quản lý cơ sở", key: "facility" },
      { icon: "ti-layout-grid", label: "Quản lý loại phòng", key: "roomtype", child: true },
      { icon: "ti-door", label: "Quản lý phòng", key: "room", child: true },
      { icon: "ti-clock", label: "Quản lý slot", key: "slot" },
    ],
  },
  {
    section: "Khách hàng",
    items: [{ icon: "ti-star", label: "Đánh giá khách hàng", key: "review" }],
  },
  {
    section: "Marketing",
    items: [
      { icon: "ti-ticket", label: "Quản lý khuyến mãi", key: "promotion" },
      { icon: "ti-news", label: "Quản lý tin tức", key: "news" },
    ],
  },
  {
    section: "Danh mục & sản phẩm",
    items: [
      { icon: "ti-category", label: "Quản lý danh mục", key: "category" },
      { icon: "ti-package", label: "Quản lý sản phẩm", key: "product" },
      { icon: "ti-sparkles", label: "Dịch vụ đi kèm", key: "service" },
    ],
  },
  {
    section: "Hệ thống",
    items: [{ icon: "ti-user-plus", label: "Thêm người dùng", key: "adduser" }],
  },
];

const metrics = [
  { icon: "ti-coin", label: "Doanh thu", value: "84.2M", trend: "+12%", up: true, color: "#4f8ef7" },
  { icon: "ti-star", label: "Đánh giá TB", value: "4.6", trend: "+0.2", up: true, color: "#8b5cf6" },
];





// Decode JWT payload (không cần verify, chỉ lấy thông tin hiển thị)
function decodeToken(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}


export default function OwnerDashboard() {
  const [active, setActive] = useState("revenue");
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [revenueByBranch, setRevenueByBranch] = useState([]);
  const [feedbacksList, setFeedbacksList] = useState([]);
  const [promotionsList, setPromotionsList] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.activeTab) {
      setActive(location.state.activeTab);
    }
  }, [location.state]);

  useEffect(() => {
    localStorage.setItem("current_dashboard", "owner");
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = decodeToken(token);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        // Valid token logic
      } else {
        localStorage.removeItem("token");
      }
    }

    const fetchCustomers = async () => {
      try {
        const uRes = await userAPI.getAllUsers();
        if (uRes.data?.success) {
          const list = uRes.data.data;
          const customers = list.filter(u => !u.roleId || (u.roleId.name !== "Admin" && u.roleId.name !== "Staff" && u.roleId.name !== "Owner"));
          setTotalCustomers(customers.length);
        }
      } catch (err) {
        console.error("Fetch customers failed", err);
      }
    };

    const fetchRevenue = async () => {
      try {
        const [bRes, brRes] = await Promise.all([
          bookingAPI.getAllBookings(),
          branchAPI.getAllBranches()
        ]);
        
        let branches = [];
        if (brRes.data?.success) {
           branches = brRes.data.data;
        }

        if (bRes.data?.success) {
          const bookings = bRes.data.data;
          
          let total = 0;
          const branchMap = {};
          
          bookings.forEach((b) => {
            if (b.status === "completed" || b.status === "confirmed") {
              const amount = b.finalTotal || 0;
              total += amount;
              
              const bId = typeof b.branchId === "object" ? b.branchId?._id : b.branchId;
              if (bId) {
                if (!branchMap[bId]) branchMap[bId] = 0;
                branchMap[bId] += amount;
              }
            }
          });
          setTotalRevenue(total);
          
          const revenueList = branches.map(br => ({
             name: br.name,
             val: branchMap[br._id] || 0
          })).sort((a, b) => b.val - a.val);
          
          setRevenueByBranch(revenueList);
        }
      } catch (err) {
        console.error("Fetch revenue failed", err);
      }
    };

    const fetchFeedbacks = async () => {
      try {
        const fRes = await feedbackAPI.getAllFeedbacks();
        if (fRes.data?.success) {
          const feedbacks = fRes.data.data;
          setFeedbacksList(feedbacks);
          if (feedbacks.length > 0) {
            const sum = feedbacks.reduce((acc, f) => acc + (f.rating || 0), 0);
            setAverageRating((sum / feedbacks.length).toFixed(1));
          } else {
            setAverageRating(0);
          }
        }
      } catch (err) {
        console.error("Fetch feedbacks failed", err);
      }
    };

    const fetchPromotions = async () => {
      try {
        const pRes = await promotionAPI.getAllPromotions();
        if (pRes.success) {
          setPromotionsList(pRes.data);
        }
      } catch (err) {
        console.error("Fetch promotions failed", err);
      }
    };

    fetchCustomers();
    fetchRevenue();
    fetchFeedbacks();
    fetchPromotions();
  }, []);


  const handleLogout = () => {
    localStorage.removeItem("token");

    navigate("/login", { replace: true });
  };

  return (
    <div className="dash">
      {/* ── SIDEBAR ── */}
      <Sidebar
        menuItems={ownerMenuItems}
        active={active}
        setActive={(key) => {
          if (key === "facility") {
            navigate("/branches");
            return;
          }
          if (key === "slot") {
            navigate("/slots");
            return;
          }
          if (key === "room") {
            navigate("/room");
            return;
          }
          if (key === "roomtype") {
            navigate("/roomtype");
            return;
          }
          if (key === "news") {
            navigate("/news");
            return;
          }
          if (key === "category") {
            navigate("/categories");
            return;
          }
          if (key === "product") {
            navigate("/products");
            return;
          }
          if (key === "review") {
            navigate("/feedbacks");
            return;
          }
          if (key === "bookinghistory") {
            navigate("/bookinghistory");
            return;
          }
          setActive(key);
        }}
        handleLogout={handleLogout}
        onLogoClick={() => navigate("/owner-dashboard")}
      />

      {/* ── MAIN ── */}
      <div className="main">
        <Topbar breadcrumbs={[{ label: "Trang chủ", link: "/owner-dashboard" }, { label: "Doanh thu" }]} />

        {/* Content */}
        <div className="content">
          {active === "promotion" ? (
            <PromotionList />
          ) : (
            <>
              <div>
                <div className="pg-title">Doanh thu</div>
                <div className="pg-sub">Tổng quan hoạt động tháng 6 · 2025</div>
              </div>

              {/* Metrics */}
              <div className="metrics" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
                {metrics.map((m) => (
                  <div className="metric" key={m.label}>
                    <div className="metric-accent" style={{ background: m.color }} />
                    <div className="metric-lbl">
                      <i className={`ti ${m.icon}`} aria-hidden="true" />
                      {m.label}
                    </div>
                    <div className="metric-val">
                      {m.label === "Doanh thu"
                        ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(totalRevenue)
                        : m.label === "Đánh giá TB"
                        ? averageRating
                        : m.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Row 2 */}
              <div className="row2">
                <div className="card">
                  <div className="card-head">
                    <div className="card-title">
                      <i className="ti ti-building" aria-hidden="true" />
                      Doanh thu theo cơ sở
                    </div>
                  </div>
                  {revenueByBranch.map((r) => (
                    <div key={r.name} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border-light)" }}>
                      <div style={{ fontWeight: 600, color: "var(--text-main)" }}>{r.name}</div>
                      <div style={{ fontWeight: 700, color: "#16a34a" }}>
                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(r.val)}
                      </div>
                    </div>
                  ))}
                  {revenueByBranch.length === 0 && (
                    <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)" }}>
                      Chưa có dữ liệu
                    </div>
                  )}
                </div>

                <div className="card">
                  <div className="card-head">
                    <div className="card-title">
                      <i className="ti ti-star" aria-hidden="true" />
                      Đánh giá gần đây
                    </div>
                  </div>
                  {feedbacksList.slice(0, 5).map((r) => {
                    const name = r.customerId?.fullName || "Khách hàng";
                    const initials = name.substring(0, 2).toUpperCase();
                    return (
                      <div className="rv-item" key={r._id}>
                        <div className="rv-av" style={{ background: "#dbeafe", color: "#1d4ed8" }}>
                          {initials}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="rv-name">
                            {name}{" "}
                            <span className="rv-stars" style={{ color: r.rating < 4 ? "#94a3b8" : "#f59e0b" }}>
                              {"★".repeat(r.rating || 5)}{"☆".repeat(5 - (r.rating || 5))}
                            </span>
                          </div>
                          <div className="rv-text">{r.comment || "Không có nội dung"}</div>
                        </div>
                      </div>
                    );
                  })}
                  {feedbacksList.length === 0 && (
                    <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)" }}>
                      Chưa có đánh giá nào
                    </div>
                  )}
                </div>
              </div>


            </>
          )}
        </div>
      </div>

    </div>
  );
}



