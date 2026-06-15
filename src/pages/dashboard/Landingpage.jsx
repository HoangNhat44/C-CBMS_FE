import { useState } from "react";
import "./Dashboard.css";

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
  const [date, setDate]     = useState("16/06/2025");
  const [slot, setSlot]     = useState("10:00 - 12:00");
  const [people, setPeople] = useState("2 người");
  const [type, setType]     = useState("Tất cả");

  return (
    <div className="lp">

      {/* ── NAV ── */}
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-brand">
            <div className="auth-brand__logo">
          <img src="/logo.png" alt="Logo" className="auth-brand__logo-icon" />
          C-CBMS
        </div>
          </div>
          <div className="nav-links">
            <a href="#" className="nav-link active">Trang chủ</a>
            <a href="#" className="nav-link">Phòng &amp; Tiện ích</a>
            <a href="#" className="nav-link">Dịch vụ</a>
            <a href="#" className="nav-link">Bảng giá</a>
            <a href="#" className="nav-link">Hướng dẫn</a>
          </div>
          <div className="nav-auth">
            <button className="btn-outline">Đăng nhập</button>
            <button className="btn-primary">Đăng ký</button>
          </div>
        </div>
      </nav>

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
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=700&q=85"
            alt="Không gian phòng họp hiện đại"
            className="hero-img"
          />
          <div className="hero-img-overlay">
            <span>FOCUS</span>
            <span>CREATE</span>
            <span>INSPIRE</span>
          </div>
        </div>
      </section>

      {/* ── SEARCH BAR ── */}
      <div className="search-wrap">
        <div className="search-bar">
          <div className="search-field">
            <label className="sf-label">Chọn ngày</label>
            <div className="sf-row">
              <input className="sf-input" value={date} onChange={e => setDate(e.target.value)} />
              <i className="ti ti-calendar sf-icon" aria-hidden="true" />
            </div>
          </div>
          <div className="search-divider" />
          <div className="search-field">
            <label className="sf-label">Khung giờ</label>
            <div className="sf-row">
              <select className="sf-input sf-select" value={slot} onChange={e => setSlot(e.target.value)}>
                {timeSlots.map(s => <option key={s}>{s}</option>)}
              </select>
              <i className="ti ti-clock sf-icon" aria-hidden="true" />
            </div>
          </div>
          <div className="search-divider" />
          <div className="search-field">
            <label className="sf-label">Số người</label>
            <div className="sf-row">
              <select className="sf-input sf-select" value={people} onChange={e => setPeople(e.target.value)}>
                {["1 người","2 người","3 người","4 người","5 người","6+ người"].map(p => <option key={p}>{p}</option>)}
              </select>
              <i className="ti ti-users sf-icon" aria-hidden="true" />
            </div>
          </div>
          <div className="search-divider" />
          <div className="search-field">
            <label className="sf-label">Loại phòng</label>
            <div className="sf-row">
              <select className="sf-input sf-select" value={type} onChange={e => setType(e.target.value)}>
                {["Tất cả","VIP","Premium","Thường","Nhóm nhỏ"].map(t => <option key={t}>{t}</option>)}
              </select>
              <i className="ti ti-building-estate sf-icon" aria-hidden="true" />
            </div>
          </div>
          <button className="btn-search">
            <i className="ti ti-search" aria-hidden="true" />
            Tìm phòng
          </button>
        </div>
      </div>

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

      {/* ── CTA BANNER ── */}
      <section className="cta-banner">
        <div className="cta-inner">
          <div className="cta-left">
            <i className="ti ti-tag cta-icon" aria-hidden="true" />
            <div>
              <div className="cta-title">Ưu đãi dành riêng cho thành viên</div>
              <div className="cta-desc">Đăng ký tài khoản để nhận nhiều ưu đãi và tích điểm hấp dẫn!</div>
            </div>
          </div>
          <button className="btn-cta">
            <i className="ti ti-user-plus" aria-hidden="true" />
            Đăng ký ngay
          </button>
        </div>
      </section>

    </div>
  );
}