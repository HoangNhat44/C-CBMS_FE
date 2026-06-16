export default function Footer() {
  return (
    <footer className="footer" style={{
      background: "linear-gradient(135deg, #0d5e57, #0f766e)",
      color: "rgba(255, 255, 255, 0.8)",
      padding: "64px 32px 32px",
      marginTop: "auto"
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 48 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#fff", fontSize: 18, fontWeight: 900, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: "#fff" }}>
              C
            </div>
            C-CBMS
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            Hệ thống quản lý và đặt phòng thông minh, mang đến trải nghiệm làm việc và hội họp tuyệt vời nhất.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <a href="#" style={{ color: "var(--accent-text)", fontSize: 20 }}><i className="ti ti-brand-facebook" /></a>
            <a href="#" style={{ color: "var(--accent-text)", fontSize: 20 }}><i className="ti ti-brand-twitter" /></a>
            <a href="#" style={{ color: "var(--accent-text)", fontSize: 20 }}><i className="ti ti-brand-instagram" /></a>
          </div>
        </div>
        
        <div>
          <h4 style={{ color: "#fff", fontSize: 15, fontWeight: 800, marginBottom: 16 }}>Dịch vụ</h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 14, display: "flex", flexDirection: "column", gap: 12 }}>
            <li><a href="#" style={{ color: "inherit", textDecoration: "none" }}>Đặt phòng họp</a></li>
            <li><a href="#" style={{ color: "inherit", textDecoration: "none" }}>Thuê không gian sự kiện</a></li>
            <li><a href="#" style={{ color: "inherit", textDecoration: "none" }}>Chỗ ngồi làm việc</a></li>
            <li><a href="#" style={{ color: "inherit", textDecoration: "none" }}>Dịch vụ tiện ích</a></li>
          </ul>
        </div>

        <div>
          <h4 style={{ color: "#fff", fontSize: 15, fontWeight: 800, marginBottom: 16 }}>Công ty</h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 14, display: "flex", flexDirection: "column", gap: 12 }}>
            <li><a href="#" style={{ color: "inherit", textDecoration: "none" }}>Về chúng tôi</a></li>
            <li><a href="#" style={{ color: "inherit", textDecoration: "none" }}>Tuyển dụng</a></li>
            <li><a href="#" style={{ color: "inherit", textDecoration: "none" }}>Tin tức</a></li>
            <li><a href="#" style={{ color: "inherit", textDecoration: "none" }}>Liên hệ</a></li>
          </ul>
        </div>

        <div>
          <h4 style={{ color: "#fff", fontSize: 15, fontWeight: 800, marginBottom: 16 }}>Hỗ trợ</h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 14, display: "flex", flexDirection: "column", gap: 12 }}>
            <li><a href="#" style={{ color: "inherit", textDecoration: "none" }}>Trung tâm trợ giúp</a></li>
            <li><a href="#" style={{ color: "inherit", textDecoration: "none" }}>Điều khoản sử dụng</a></li>
            <li><a href="#" style={{ color: "inherit", textDecoration: "none" }}>Chính sách bảo mật</a></li>
            <li><a href="#" style={{ color: "inherit", textDecoration: "none" }}>Câu hỏi thường gặp</a></li>
          </ul>
        </div>
      </div>
      
      <div style={{ maxWidth: 1280, margin: "48px auto 0", paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
        <div>&copy; {new Date().getFullYear()} C-CBMS. Bản quyền đã được bảo hộ.</div>
        <div style={{ display: "flex", gap: 16 }}>
          <a href="#" style={{ color: "inherit", textDecoration: "none" }}>Quyền riêng tư</a>
          <a href="#" style={{ color: "inherit", textDecoration: "none" }}>Điều khoản</a>
        </div>
      </div>
    </footer>
  );
}
