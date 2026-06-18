import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

const rooms = [
  { tag: "VIP",      tagClass: "tag-vip",      name: "Phòng VIP",       people: "2 - 4 người", area: "20 - 30m²", price: "150.000₫/giờ", img: "https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=400&q=80" },
  { tag: "Thường",   tagClass: "tag-standard",  name: "Phòng Thường",    people: "4 - 6 người", area: "25 - 40m²", price: "100.000₫/giờ", img: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80" },
  { tag: "Premium",  tagClass: "tag-premium",   name: "Phòng Premium",   people: "6 - 8 người", area: "40 - 60m²", price: "180.000₫/giờ", img: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400&q=80" },
  { tag: "Nhóm nhỏ", tagClass: "tag-small",     name: "Phòng Nhóm nhỏ", people: "2 - 3 người", area: "15 - 20m²", price: "80.000₫/giờ",  img: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=400&q=80" },
];

const features = [
  { icon: "ti-shield-check", title: "Xác nhận nhanh chóng",  desc: "Nhận xác nhận đặt phòng ngay lập tức" },
  { icon: "ti-calendar-x",   title: "Hủy/đổi linh hoạt",    desc: "Dễ dàng hủy hoặc đổi lịch theo quy định" },
  { icon: "ti-history",      title: "Lịch sử đặt phòng",    desc: "Quản lý và xem lại các lần đặt trước" },
  { icon: "ti-headset",      title: "Hỗ trợ tận tâm",       desc: "Đội ngũ hỗ trợ 24/7 luôn sẵn sàng giúp bạn" },
];

const highlights = [
  { icon: "ti-calendar",    title: "Đặt phòng linh hoạt", desc: "Theo ngày và khung giờ" },
  { icon: "ti-credit-card", title: "Thanh toán an toàn",  desc: "Nhiều phương thức" },
  { icon: "ti-coffee",      title: "Dịch vụ tiện ích",    desc: "Cà phê, snack, tiện nghi" },
];

const timeSlots = ["08:00 - 10:00", "10:00 - 12:00", "13:00 - 15:00", "15:00 - 17:00", "17:00 - 19:00", "19:00 - 21:00"];

export default function LandingPage() {
  const [date, setDate]         = useState("16/06/2025");
  const [slot, setSlot]         = useState("10:00 - 12:00");
  const [people, setPeople]     = useState("2 người");
  const [type, setType]         = useState("Tất cả");
  const navigate                = useNavigate();

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
          <div style={{ marginTop: 30 }}>
            <button 
              onClick={() => navigate("/apply-promotion")}
              style={{
                backgroundColor: "#f59e0b",
                color: "#fff",
                border: "none",
                padding: "12px 24px",
                borderRadius: 8,
                fontWeight: "bold",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 16
              }}
            >
              <i className="ti ti-ticket" /> Giảm giá test
            </button>
          </div>
        </div>
        <div className="hero-right">
          <img
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=700&q=85"
            alt="Không gian phòng họp hiện đại"
            className="hero-img"
          />
          <div className="hero-img-overlay">
            <span>TẬP TRUNG</span>
            <span>SÁNG TẠO</span>
            <span>TRUYỀN CẢM HỨNG</span>
          </div>
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
            <div className="sec-sub">Đa dạng loại phòng phù hợp với nhu cầu của bạn</div>
          </div>
          <a href="#" className="rooms-all">Xem tất cả phòng →</a>
        </div>
        <div className="rooms-grid">
          {rooms.map((r) => (
            <div className="room-card" key={r.name}>
              <div className="room-img-wrap">
                <img src={r.img} alt={r.name} className="room-img" />
                <span className={`room-tag ${r.tagClass}`}>{r.tag}</span>
              </div>
              <div className="room-info">
                <div className="room-name">{r.name}</div>
                <div className="room-meta">
                  <span><i className="ti ti-users" aria-hidden="true" /> {r.people}</span>
                  <span><i className="ti ti-layout-2" aria-hidden="true" /> {r.area}</span>
                </div>
                <div className="room-price">{r.price}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}