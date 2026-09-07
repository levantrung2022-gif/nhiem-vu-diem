# Đưa Nhiệm Vụ Điểm V2 lên Internet

Bộ này đã được chuẩn bị cho Render:
- `render.yaml` tự cấu hình Node/Express, health check, JWT secret và thư mục dữ liệu.
- SQLite được đặt trong `/var/data` để dùng persistent disk.

## Điều còn cần từ chủ website
Không thể tự tạo/đăng nhập tài khoản hosting thay bạn. Chỉ cần một tài khoản Render/GitHub của bạn để cấp quyền triển khai.

## Cách triển khai không cần Terminal
1. Tạo repository GitHub và tải toàn bộ thư mục này lên.
2. Vào Render → New → Blueprint.
3. Chọn repository.
4. Render đọc `render.yaml` và tạo web service.
5. Sau khi deploy xong, Render cấp URL `*.onrender.com`.

Lưu ý: persistent disk của Render là tính năng trả phí; không nên dùng SQLite trên filesystem ephemeral cho dữ liệu người dùng lâu dài.
