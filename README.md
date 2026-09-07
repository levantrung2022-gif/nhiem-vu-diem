# Nhiệm Vụ Điểm V2

V2 là bản web chạy thật trên máy với **đăng ký/đăng nhập + SQLite database + Node/Express backend + cookie session JWT**.

## Chạy local
1. Cài Node.js 20+.
2. Mở terminal tại thư mục này.
3. Chạy `npm install`.
4. Đặt biến môi trường `JWT_SECRET` thành chuỗi bí mật dài khi triển khai thật.
5. Chạy `npm start`.
6. Mở `http://localhost:3000`.

Database `data.sqlite` tự tạo khi chạy.

## Có gì trong V2
- Đăng ký/đăng nhập/đăng xuất.
- Mật khẩu được băm bằng bcrypt.
- Session bằng HttpOnly cookie + JWT.
- Điểm lưu ở server/database, không dùng localStorage làm nguồn dữ liệu chính.
- Nhiệm vụ và lịch sử hoàn thành.
- Chặn hoàn thành cùng một nhiệm vụ nhiều lần trong cùng ngày.
- Xếp hạng ngày và tuần.
- API health check.

## Lưu ý an toàn nền tảng
Hệ thống chỉ điều hướng người dùng tới nội dung và ghi nhận xác nhận thủ công. Không có bot tự Follow/Like/Comment, không tạo tài khoản giả và không có cơ chế né phát hiện của nền tảng. Nếu triển khai TikTok hoặc nền tảng khác, cần thiết kế nhiệm vụ phù hợp với điều khoản của nền tảng.

## Bản production tiếp theo
Nên bổ sung: PostgreSQL/Supabase, email verification, reset password, CSRF protection, rate limiting, admin role, moderation, audit log, HTTPS, backup database, và cấu hình cookie/secret production.
