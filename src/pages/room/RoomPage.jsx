import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import { ownerMenuItems } from "../dashboard/Owner";
import branchAPI from "../../services/branch.service";
import roomAPI from "../../services/room.service";
import roomTypeAPI from "../../services/roomType.service";
import RoomForm from "./RoomForm";
import "../dashboard/Dashboard.css";
import "./RoomPage.css";

const statusLabels = {
  available: "Có sẵn",
  maintenance: "Bảo trì",
  inactive: "Ngừng hoạt động",
};

const statusClasses = {
  available: "pill-on",
  maintenance: "pill-warn",
  inactive: "pill-off",
};

const fallbackBranches = [
  {
    _id: "demo-branch",
    name: "Chi nhánh Owner",
    address: "Dữ liệu tạm khi backend chưa sẵn sàng",
  },
];

const fallbackRoomTypes = [
  {
    _id: "demo-room-type",
    name: "Phòng tiêu chuẩn",
    capacity: 4,
  },
];



export default function RoomPage() {
  const navigate = useNavigate();

  const [branches, setBranches] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("list");
  const [editingRoom, setEditingRoom] = useState(null);
  const [detailRoom, setDetailRoom] = useState(null);
  const [apiOffline, setApiOffline] = useState(false);

  const selectedBranch = useMemo(
    () => branches.find((branch) => branch._id === selectedBranchId),
    [branches, selectedBranchId]
  );





  useEffect(() => {
    async function fetchMeta() {
      try {
        const [branchRes, typeRes] = await Promise.all([
          branchAPI.getAllBranches(),
          roomTypeAPI.getAllRoomTypes(),
        ]);
        const branchData = branchRes.data?.data || branchRes.data || [];
        const typeData = typeRes.data || [];

        setBranches(branchData);
        setRoomTypes(typeData);
        if (!selectedBranchId && branchData.length > 0) {
          setSelectedBranchId(branchData[0]._id);
        }
        setApiOffline(false);
      } catch (error) {
        console.error("Fetch room metadata failed", error);
        setApiOffline(true);
        setBranches(fallbackBranches);
        setRoomTypes(fallbackRoomTypes);
        if (!selectedBranchId) {
          setSelectedBranchId(fallbackBranches[0]._id);
        }
      }
    }

    fetchMeta();
  }, [selectedBranchId]);

  const fetchRooms = useCallback(async (branchId = selectedBranchId) => {
    try {
      setLoading(true);
      const res = await roomAPI.getAllRooms({ branchId });
      if (res.success) {
        setRooms(res.data || []);
      }
    } catch (error) {
      console.error("Fetch rooms failed", error);
      setApiOffline(true);
      setRooms((prev) => prev.filter((room) => (room.branchId?._id || room.branchId) === branchId));
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId]);

  useEffect(() => {
    if (!selectedBranchId) {
      setLoading(false);
      return;
    }

    fetchRooms(selectedBranchId);
  }, [selectedBranchId, fetchRooms]);

  const handleLogout = () => {
    localStorage.removeItem("token");

    navigate("/login", { replace: true });
  };

  const handleSaveRoom = async (formData) => {
    // formData is a FormData instance from RoomForm
    const branchId = formData.get("branchId") || selectedBranchId;

    try {
      if (editingRoom) {
        const res = await roomAPI.updateRoom(editingRoom._id, formData);
        if (!res.success) throw new Error(res.message || "Update room failed");
      } else {
        const res = await roomAPI.createRoom(formData);
        if (!res.success) throw new Error(res.message || "Create room failed");
      }

      setMode("list");
      setEditingRoom(null);
      await fetchRooms(branchId);
      setSelectedBranchId(branchId);
    } catch (error) {
      console.error("Save room failed", error);
      
      // If it's a client/permission error (400, 401, 403), do not do offline fallback
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        alert(error.response.data?.message || "Bạn không có quyền để thực hiện hành động này");
        return;
      }

      // Build local fallback from FormData for network errors only
      const localData = {};
      for (const [key, value] of formData.entries()) {
        if (key !== "image") localData[key] = value;
      }
      
      // Fix: localData.facilities might be a JSON string, parse it to array
      if (typeof localData.facilities === "string") {
        try {
          localData.facilities = JSON.parse(localData.facilities);
        } catch {
          localData.facilities = [];
        }
      }

      const branch = branches.find((item) => item._id === localData.branchId);
      const roomType = roomTypes.find((item) => item._id === localData.roomTypeId);
      const localRoom = {
        ...localData,
        _id: editingRoom?._id || `local-${Date.now()}`,
        branchId: branch || localData.branchId,
        roomTypeId: roomType || localData.roomTypeId,
      };

      setApiOffline(true);
      setRooms((prev) =>
        editingRoom
          ? prev.map((room) => (room._id === editingRoom._id ? localRoom : room))
          : [localRoom, ...prev]
      );
      setSelectedBranchId(branchId);
      setMode("list");
      setEditingRoom(null);
    }
  };

  const handleViewDetail = async (room) => {
    if (apiOffline || String(room._id).startsWith("local-")) {
      setDetailRoom(room);
      setMode("detail");
      return;
    }

    try {
      const res = await roomAPI.getRoomById(room._id);
      if (res.success) {
        setDetailRoom(res.data);
        setMode("detail");
      }
    } catch (error) {
      console.error("Get room detail failed", error);
      alert(error.response?.data?.message || "Không tải được chi tiết phòng");
    }
  };

  const handleUpdateStatus = async (room, status) => {
    try {
      const res = await roomAPI.updateRoomStatus(room._id, status);
      if (!res.success) throw new Error(res.message || "Update status failed");
      await fetchRooms();
    } catch (error) {
      console.error("Update room status failed", error);
      
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        alert(error.response.data?.message || "Bạn không có quyền để thực hiện hành động này");
        return;
      }

      setApiOffline(true);
      setRooms((prev) => prev.map((item) => (item._id === room._id ? { ...item, status } : item)));
    }
  };

  return (
    <div className="dash">
      <Sidebar
        menuItems={ownerMenuItems}
        active="room"
        handleLogout={handleLogout}
        onLogoClick={() => navigate("/owner-dashboard")}
      />

      <div className="main">
        <Topbar breadcrumbs={[{ label: "Trang chủ", link: "/owner-dashboard" }, { label: "Quản lý phòng" }]} />

        <div className="content">
          <div className="room-page-head">
            <div>
              <div className="pg-title">Quản lý phòng</div>
              <div className="pg-sub">
                Owner chọn chi nhánh để xem danh sách, xem chi tiết, tạo phòng, cập nhật phòng và đổi trạng thái.
              </div>
              {apiOffline && (
                <div className="room-offline-note">
                  Backend chưa phản hồi, trang đang dùng dữ liệu tạm trên trình duyệt.
                </div>
              )}
            </div>
            <button
              className="btn-primary"
              onClick={() => {
                setEditingRoom(null);
                setDetailRoom(null);
                setMode("create");
              }}
              disabled={!selectedBranchId}
            >
              <i className="ti ti-plus" /> Tạo phòng
            </button>
          </div>

          <div className="room-toolbar card">
            <label>
              Chi nhánh
              <select
                value={selectedBranchId}
                onChange={(event) => {
                  setSelectedBranchId(event.target.value);
                  setMode("list");
                  setEditingRoom(null);
                  setDetailRoom(null);
                }}
              >
                {branches.map((branch) => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="room-branch-summary">
              <span>{selectedBranch?.address || "Chưa có chi nhánh"}</span>
              <strong>{rooms.length} phòng</strong>
            </div>
          </div>

          {(mode === "create" || mode === "edit") && (
            <RoomForm
              room={editingRoom}
              branches={branches}
              roomTypes={roomTypes}
              selectedBranchId={selectedBranchId}
              onSubmit={handleSaveRoom}
              onCancel={() => {
                setMode("list");
                setEditingRoom(null);
              }}
            />
          )}

          {mode === "detail" && detailRoom && (
            <div className="card room-detail">
              <div className="card-head">
                <div className="card-title">
                  <i className="ti ti-info-circle" aria-hidden="true" />
                  Chi tiết phòng
                </div>
                <button className="btn-outline" onClick={() => setMode("list")}>Quay lại</button>
              </div>
              <div className="room-detail-grid">
                <div>
                  <span>Tên phòng</span>
                  <strong>{detailRoom.roomName}</strong>
                </div>
                <div>
                  <span>Chi nhánh</span>
                  <strong>{detailRoom.branchId?.name || "-"}</strong>
                </div>
                <div>
                  <span>Loại phòng</span>
                  <strong>{detailRoom.roomTypeId?.name || "-"}</strong>
                </div>
                <div>
                  <span>Sức chứa</span>
                  <strong>{detailRoom.capacity} người</strong>
                </div>
                <div>
                  <span>Trạng thái</span>
                  <strong>{statusLabels[detailRoom.status] || detailRoom.status}</strong>
                </div>
                <div>
                  <span>Tiện ích</span>
                  <strong>{detailRoom.facilities?.join(", ") || "-"}</strong>
                </div>
              </div>
            </div>
          )}

          {mode === "list" && (
            <div className="card">
              <div className="card-head">
                <div className="card-title">
                  <i className="ti ti-list" aria-hidden="true" />
                  Danh sách phòng
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="dash-table room-table">
                  <thead>
                    <tr>
                      <th>Tên phòng</th>
                      <th>Loại phòng</th>
                      <th>Sức chứa</th>
                      <th>Tiện ích</th>
                      <th>Trạng thái</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="room-empty">Đang tải danh sách phòng...</td>
                      </tr>
                    ) : rooms.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="room-empty">Chi nhánh này chưa có phòng.</td>
                      </tr>
                    ) : (
                      rooms.map((room) => (
                        <tr key={room._id}>
                          <td>{room.roomName}</td>
                          <td>{room.roomTypeId?.name || "-"}</td>
                          <td>{room.capacity}</td>
                          <td>{room.facilities?.slice(0, 3).join(", ") || "-"}</td>
                          <td>
                            <span className={`pill ${statusClasses[room.status] || "pill-off"}`}>
                              {statusLabels[room.status] || room.status}
                            </span>
                          </td>
                          <td>
                            <div className="room-actions">
                              <button type="button" onClick={() => handleViewDetail(room)}>
                                Xem
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingRoom(room);
                                  setDetailRoom(null);
                                  setMode("edit");
                                }}
                              >
                                Sửa
                              </button>
                              <select value={room.status} onChange={(event) => handleUpdateStatus(room, event.target.value)}>
                                <option value="available">Có sẵn</option>
                                <option value="maintenance">Bảo trì</option>
                                <option value="inactive">Ngừng hoạt động</option>
                              </select>
                            </div>
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
      </div>

    </div>
  );
}
