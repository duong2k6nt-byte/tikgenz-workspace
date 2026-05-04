# Tikgenz Entertainment – Workspace Management System

Hệ thống quản lý công việc nội bộ của **Tikgenz Entertainment**.

## 🚀 Truy cập

👉 **URL:** [https://GITHUB_USERNAME.github.io/tikgenz-workspace](https://GITHUB_USERNAME.github.io/tikgenz-workspace)

## 🔑 Tài khoản mặc định

| Username | Password | Quyền |
|---|---|---|
| admin | admin123 | Admin (toàn quyền) |

## 📋 Tính năng

- ✅ Quản lý Task theo Kanban Board
- ✅ Phân quyền 4 cấp: Admin / Quản lý / Trưởng nhóm / Nhân viên
- ✅ Nhiệm vụ chung & nhiệm vụ theo dự án
- ✅ Bảng thông báo (Admin/Quản lý edit)
- ✅ Nghiệm thu kết quả (link/ảnh)
- ✅ Realtime sync qua Firebase
- ✅ Thông báo deadline

## ⚙️ Setup Firebase

1. Vào `firebase-config.js`
2. Điền thông tin từ Firebase Console vào
3. Push lại lên GitHub

## 📁 Cấu trúc files

```
├── index.html          # Giao diện chính
├── style.css           # CSS styles
├── data.js             # Data layer + Firebase sync
├── app.js              # Logic ứng dụng
├── firebase-config.js  # Firebase configuration
├── Khoi_dong_Tikgenz.bat  # Chạy local
└── Deploy_GitHub.bat   # Deploy lên GitHub
```
