import { useEffect, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import newsAPI from "../../services/news.service";
import "./PublicNewsPage.css";
import "../dashboard/Dashboard.css";

export default function PublicNewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedNews, setSelectedNews] = useState(null); // For detail modal
  const [searchTerm, setSearchTerm] = useState("");

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await newsAPI.getAllNews();
      // Only display active news
      const allNews = res.data || res || [];
      const activeNews = allNews.filter((item) => item.isActive !== false);
      setNews(activeNews);
    } catch (err) {
      console.error("Failed to fetch public news", err);
      setError("Không thể tải bảng tin lúc này. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const filteredNews = news.filter((item) =>
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="lp pnp-layout">
      <Header />

      {/* Hero Header */}
      <section className="pnp-hero">
        <div className="pnp-hero-content">
          <span className="pnp-hero-tagline">Tin tức & Sự kiện</span>
          <h1 className="pnp-hero-title">Bảng Tin C-CBMS</h1>
          <p className="pnp-hero-desc">
            Cập nhật các chương trình khuyến mãi, sự kiện khai trương, và những tin tức mới nhất từ hệ thống rạp chiếu phim mini của chúng tôi.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="pnp-container">
        {/* Search and Filters */}
        <div className="pnp-toolbar">
          <div className="pnp-search-wrapper">
            <i className="ti ti-search pnp-search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm tin tức, sự kiện..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pnp-search-input"
            />
            {searchTerm && (
              <button className="pnp-clear-btn" onClick={() => setSearchTerm("")}>
                <i className="ti ti-x" />
              </button>
            )}
          </div>
        </div>

        {/* Loading and Error States */}
        {loading ? (
          <div className="pnp-state-display">
            <div className="spinner"></div>
            <p>Đang tải danh sách bảng tin...</p>
          </div>
        ) : error ? (
          <div className="pnp-state-display error">
            <i className="ti ti-alert-triangle" style={{ fontSize: "2rem", color: "#ef4444" }} />
            <p>{error}</p>
            <button className="pnp-retry-btn" onClick={fetchNews}>Thử lại</button>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="pnp-state-display empty">
            <i className="ti ti-news" style={{ fontSize: "2.5rem", color: "var(--text-muted)" }} />
            <p>{searchTerm ? "Không tìm thấy tin tức nào khớp với tìm kiếm." : "Chưa có tin tức nào được đăng tải."}</p>
          </div>
        ) : (
          /* News Grid */
          <div className="pnp-grid">
            {filteredNews.map((item) => (
              <div 
                className="pnp-card" 
                key={item._id} 
                onClick={() => setSelectedNews(item)}
              >
                <div className="pnp-card-image-wrap">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="pnp-card-image" />
                  ) : (
                    <div className="pnp-card-image-placeholder">
                      <i className="ti ti-news" />
                    </div>
                  )}
                  <span className="pnp-card-date">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString("vi-VN") : "-"}
                  </span>
                </div>
                <div className="pnp-card-body">
                  <h3 className="pnp-card-title">{item.title}</h3>
                  <p className="pnp-card-snippet">{item.content}</p>
                  <span className="pnp-card-more">
                    Chi tiết <i className="ti ti-arrow-right" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedNews && (
        <div className="pnp-modal-backdrop" onClick={() => setSelectedNews(null)}>
          <div className="pnp-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="pnp-modal-header">
              <span className="pnp-modal-date">
                Đăng ngày: {selectedNews.createdAt ? new Date(selectedNews.createdAt).toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" }) : "-"}
              </span>
              <button className="pnp-modal-close" onClick={() => setSelectedNews(null)}>
                <i className="ti ti-x" />
              </button>
            </div>
            
            <div className="pnp-modal-body">
              {selectedNews.image && (
                <div className="pnp-modal-image-wrap">
                  <img src={selectedNews.image} alt={selectedNews.title} className="pnp-modal-image" />
                </div>
              )}
              <h2 className="pnp-modal-title">{selectedNews.title}</h2>
              <div className="pnp-modal-text">
                {selectedNews.content?.split("\n").map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
