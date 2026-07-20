import { useEffect, useState, useRef } from "react";

const API_BASE = process.env.REACT_APP_API_BASE_URL?.replace(/\/api\/?$/, "").replace(/\/$/, "") || "";

const emptyForm = {
  branchId: "",
  roomTypeId: "",
  roomName: "",
  capacity: 1,
  facilities: "",
  status: "available",
};

export default function RoomForm({ room, branches, roomTypes, selectedBranchId, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(emptyForm);
  const [imageFiles, setImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (room) {
      setFormData({
        branchId: room.branchId?._id || room.branchId || selectedBranchId || "",
        roomTypeId: room.roomTypeId?._id || room.roomTypeId || "",
        roomName: room.roomName || "",
        capacity: room.capacity || 1,
        facilities: (room.facilities || []).join(", "),
        status: room.status || "available",
      });
      setImageFiles([]);
      setNewImagePreviews([]);
      
      let combinedImages = [];
      if (Array.isArray(room.image)) combinedImages.push(...room.image);
      else if (room.image) combinedImages.push(room.image);

      if (Array.isArray(room.images)) combinedImages.push(...room.images);
      else if (room.images) combinedImages.push(room.images);

      const formattedImages = combinedImages.map(img => 
        img.startsWith("http") ? img : `${API_BASE}${img}`
      );
      setExistingImages(formattedImages);
      return;
    }

    setFormData({ ...emptyForm, branchId: selectedBranchId || "" });
    setImageFiles([]);
    setNewImagePreviews([]);
    setExistingImages([]);
    setImageUrlInput("");
  }, [room, selectedBranchId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "capacity" ? Number(value) : value,
    }));
  };

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    setImageFiles(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
    
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAddImageUrl = () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    setExistingImages(prev => [...prev, url]);
    setImageUrlInput("");
  };

  const handleRemoveExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNewImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const fd = new FormData();
    fd.append("branchId", formData.branchId);
    fd.append("roomTypeId", formData.roomTypeId);
    fd.append("roomName", formData.roomName);
    fd.append("capacity", formData.capacity);
    fd.append("status", formData.status);

    // Send facilities as JSON string array
    const facilitiesArr = formData.facilities
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    fd.append("facilities", JSON.stringify(facilitiesArr));

    // Attach new image files
    imageFiles.forEach(file => {
      fd.append("images", file);
    });

    // Attach existing images to keep
    // Extract relative path from absolute URL if necessary
    existingImages.forEach(img => {
      const relativePath = img.replace(API_BASE, "");
      fd.append("existingImages", relativePath);
    });

    onSubmit(fd);
  };

  return (
    <div className="card room-form-card">
      <div className="card-head">
        <div className="card-title">
          <i className="ti ti-door" aria-hidden="true" />
          {room ? "Cập nhật phòng" : "Tạo phòng mới"}
        </div>
      </div>

      <form className="room-form" onSubmit={handleSubmit}>
        <div className="room-form-grid">
          <label>
            Chi nhánh
            <select name="branchId" value={formData.branchId} onChange={handleChange} required>
              <option value="">Chọn chi nhánh</option>
              {branches.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Loại phòng
            <select name="roomTypeId" value={formData.roomTypeId} onChange={handleChange} required>
              <option value="">Chọn loại phòng</option>
              {roomTypes.map((type) => (
                <option key={type._id} value={type._id}>
                  {type.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Tên phòng
            <input
              name="roomName"
              value={formData.roomName}
              onChange={handleChange}
              placeholder="VD: Room A1"
              required
            />
          </label>

          <label>
            Sức chứa
            <input
              name="capacity"
              type="number"
              min="1"
              value={formData.capacity}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Trạng thái
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="available">Có sẵn</option>
              <option value="maintenance">Bảo trì</option>
              <option value="inactive">Ngừng hoạt động</option>
            </select>
          </label>

          <label>
            Tiện ích
            <input
              name="facilities"
              value={formData.facilities}
              onChange={handleChange}
              placeholder="Máy lạnh, TV, Karaoke"
            />
          </label>
        </div>

        {/* Image Upload Section */}
        <div className="image-upload-section">
          <label className="image-upload-label">Ảnh phòng</label>
          
          <div className="image-url-input-group" style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <input 
              type="text" 
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              placeholder="Nhập URL ảnh từ web (VD: https://...)"
              style={{ flex: 1 }}
            />
            <button type="button" className="btn-outline" onClick={handleAddImageUrl}>
              Thêm URL
            </button>
          </div>

          <div className="image-gallery">
            {existingImages.map((img, idx) => (
              <div key={`exist-${idx}`} className="image-preview-container">
                <img src={img} alt="Preview" className="image-preview" />
                <div className="image-preview-overlay">
                  <button
                    type="button"
                    className="image-preview-remove"
                    onClick={(e) => { e.stopPropagation(); handleRemoveExistingImage(idx); }}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
            
            {newImagePreviews.map((img, idx) => (
              <div key={`new-${idx}`} className="image-preview-container">
                <img src={img} alt="Preview" className="image-preview" />
                <div className="image-preview-overlay">
                  <button
                    type="button"
                    className="image-preview-remove"
                    onClick={(e) => { e.stopPropagation(); handleRemoveNewImage(idx); }}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}

            <div
              className="image-upload-zone multiple"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="image-upload-placeholder">
                <span className="image-upload-icon">📷</span>
                <span>Thêm ảnh</span>
              </div>
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleImageChange}
            style={{ display: "none" }}
          />
        </div>

        <div className="room-form-actions">
          <button type="button" className="btn-outline" onClick={onCancel}>
            Hủy
          </button>
          <button type="submit" className="btn-primary">
            {room ? "Lưu thay đổi" : "Tạo phòng"}
          </button>
        </div>
      </form>
    </div>
  );
}
