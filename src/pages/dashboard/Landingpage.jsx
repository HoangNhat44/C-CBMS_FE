import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import roomTypeAPI from "../../services/roomType.service";
import "./Dashboard.css";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useAuth } from "../../context/AuthContext";

const features = [
  { icon: "ti-shield-check", title: "Xác nhận nhanh chóng", desc: "Nhận xác nhận đặt phòng ngay lập tức" },
  { icon: "ti-calendar-x", title: "Hủy/đổi linh hoạt", desc: "Dễ dàng hủy hoặc đổi lịch theo quy định" },
  { icon: "ti-history", title: "Lịch sử đặt phòng", desc: "Quản lý và xem lại các lần đặt trước" },
  { icon: "ti-headset", title: "Hỗ trợ tận tâm", desc: "Đội ngũ hỗ trợ 24/7 luôn sẵn sàng giúp bạn" },
];

const highlights = [
  { icon: "ti-calendar", title: "Đặt phòng linh hoạt", desc: "Theo ngày và khung giờ" },
  { icon: "ti-credit-card", title: "Thanh toán an toàn", desc: "Nhiều phương thức" },
  { icon: "ti-coffee", title: "Dịch vụ tiện ích", desc: "Cà phê, snack, tiện nghi" },
];

export default function LandingPage() {
  const [rooms, setRooms] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await roomTypeAPI.getPublicRoomTypes();
        if (res.success) {
          setRooms(res.data);
        }
      } catch (error) {
        console.error("Failed to load room types:", error);
      }
    };
    fetchRooms();
  }, []);

  const getTagInfo = (name) => {
    const n = (name || "").toLowerCase();
    if (n.includes("vip")) return { tag: "VIP", tagClass: "tag-vip" };
    if (n.includes("premium")) return { tag: "Premium", tagClass: "tag-premium" };
    if (n.includes("nhóm") || n.includes("nhỏ")) return { tag: "Nhóm nhỏ", tagClass: "tag-small" };
    return { tag: "Thường", tagClass: "tag-standard" };
  };

  const formatPrice = (price) => {
    if (!price || price === 0) return "Đang cập nhật";
    return new Intl.NumberFormat("vi-VN").format(price) + "₫/giờ";
  };

  if (user) {
    const role = user?.roleId?.name?.toLowerCase() || user?.role?.name?.toLowerCase() || user?.role?.toLowerCase();
    if (role && role !== "customer") {
      return <Navigate to="/access-denied" replace />;
    }
  }

  return (
    <div className="lp">
      <Header />

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-left">
          <h1 className="hero-title">
            Không gian lý tưởng<br />
            cho <span className="hero-accent">mọi khoảnh khắc</span>
          </h1>
          <p className="hero-desc">
            Đặt phòng nhanh chóng, tiện lợi theo ngày và khung giờ.<br />
            Trải nghiệm không gian riêng tư, hiện đại và đầy cảm hứng.
          </p>
          <div className="hero-badges">
            {highlights.map((h) => (
              <div className="hero-badge" key={h.title}>
                <div className="hb-icon">
                  <i className={`ti ${h.icon}`} aria-hidden="true" />
                </div>
                <div>
                  <div className="hb-title">{h.title}</div>
                  <div className="hb-desc">{h.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-right">
          <img
            src="/images/banner3.jpg"
            alt="Phòng giải trí"
            className="hero-img"
          />
        </div>
      </section>


      {/* ── FEATURE STRIP ── */}
      <section className="feature-strip">
        {features.map((f) => (
          <div className="feat" key={f.title}>
            <div className="feat-icon">
              <i className={`ti ${f.icon}`} aria-hidden="true" />
            </div>
            <div>
              <div className="feat-title">{f.title}</div>
              <div className="feat-desc">{f.desc}</div>
            </div>
          </div>
        ))}
      </section>

      {/* ── ROOMS ── */}
      <section className="rooms-section">
        <div className="rooms-head">
          <div>
            <div className="sec-title">Khám phá không gian</div>
            <p>Đa dạng loại phòng phù hợp với nhu cầu của bạn</p>
          </div>
          <button type="button" className="rooms-all" onClick={() => setShowAll(!showAll)} style={{ background: "none", border: "none", cursor: "pointer" }}>
            {showAll ? "Thu gọn ←" : "Xem tất cả phòng →"}
          </button>
        </div>
        <div className="rooms-grid">
          {(showAll ? rooms : rooms.slice(0, 4)).map((r) => {
            const { tag, tagClass } = getTagInfo(r.name);
            return (
              <div className="room-card" key={r._id || r.name}>
                <div className="room-img-wrap">
                  <img src={r.image || "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80"} alt={r.name} className="room-img" />
                  <span className={`room-tag ${tagClass}`}>{tag}</span>
                </div>
                <div className="room-info">
                  <div className="room-name">{r.name}</div>
                  <div className="room-meta">
                    <span><i className="ti ti-users" aria-hidden="true" /> Lên đến {r.capacity} người</span>
                    {/* <span><i className="ti ti-layout-2" aria-hidden="true" /> {r.area}</span> */}
                  </div>
                  <div className="room-price">{formatPrice(r.price)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Footer />
    </div>
  );
}