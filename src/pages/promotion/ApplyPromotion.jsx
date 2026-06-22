import { useState } from "react";
import promotionAPI from "../../services/promotion.service";
import branchAPI from "../../services/branch.service";

export default function ApplyPromotion() {
  const [code, setCode] = useState("");
  const [branchId, setBranchId] = useState("");
  const [branches, setBranches] = useState([]);
  const [message, setMessage] = useState("");

  const loadBranches = async () => {
    if (branches.length > 0) return;

    try {
      const res = await branchAPI.getAllBranches();
      setBranches(res.data?.data || []);
    } catch (error) {
      console.error("Fetch branches failed", error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      const res = await promotionAPI.applyPromotion(code, branchId);
      setMessage(res.message || "Áp dụng khuyến mãi thành công.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Không áp dụng được khuyến mãi.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f0f4f8", padding: 24 }}>
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#ffffff",
          border: "1px solid #d9e2ec",
          borderRadius: 10,
          padding: 24,
          boxShadow: "0 12px 32px rgba(16,42,67,.08)",
        }}
      >
        <h2 style={{ margin: "0 0 16px", color: "#102a43" }}>Áp dụng khuyến mãi</h2>
        <label style={{ display: "block", marginBottom: 12, fontWeight: 700, color: "#52606d" }}>
          Mã khuyến mãi
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            required
            style={{ width: "100%", marginTop: 6, padding: 10, border: "1px solid #d9e2ec", borderRadius: 8 }}
          />
        </label>
        <label style={{ display: "block", marginBottom: 18, fontWeight: 700, color: "#52606d" }}>
          Chi nhánh
          <select
            value={branchId}
            onFocus={loadBranches}
            onChange={(event) => setBranchId(event.target.value)}
            style={{ width: "100%", marginTop: 6, padding: 10, border: "1px solid #d9e2ec", borderRadius: 8 }}
          >
            <option value="">Tất cả chi nhánh</option>
            {branches.map((branch) => (
              <option key={branch._id} value={branch._id}>
                {branch.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          style={{
            width: "100%",
            border: "none",
            borderRadius: 8,
            background: "#0f766e",
            color: "#ffffff",
            padding: "10px 14px",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Áp dụng
        </button>
        {message && <div style={{ marginTop: 14, color: "#52606d", fontWeight: 700 }}>{message}</div>}
      </form>
    </div>
  );
}
