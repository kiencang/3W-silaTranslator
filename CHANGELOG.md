# Changelog

Tất cả những thay đổi đáng chú ý của dự án kiencang/SI-Prompt-EV-Translate sẽ được ghi lại trong file này.

Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
và dự án này tuân thủ [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.0.17] - 2026-04-19

### Fixed
- Điều chỉnh mã để nó giữ lại các video YouTube theo cách chắc chắn hơn (không bị AI hiểu nhầm làm quá trình khôi phục mã video bị thất bại).
- Bổ sung thông tin: Sản phẩm chỉ dùng cho mục đích cá nhân.

## [v1.0.16] - 2026-04-19

### Fixed
- Giữ lại các video YouTube trong bài dịch.

## [v1.0.15] - 2026-04-19

### Fixed
- Điều chỉnh nút toàn màn hình ở trang kết quả dịch để thu hút hơn.
- Tắt tính năng button 'nhịp thở' cho phần dịch web ở trang kết quả dịch.

## [v1.0.14] - 2026-04-19

### Fixed
- Điều chỉnh màu sắc cho logo text để nó ấn tượng hơn.
- Thêm chữ G lớn làm background cho phần tìm kiếm.
- Button 'nhịp thở' cho phần dịch web.

## [v1.0.13] - 2026-04-19

### Fixed
- Sửa lại loạt toast notification cho chuẩn hơn. Chỉnh thời gian báo lỗi lên 10s, giữ nguyên báo thành công là 5s.
- Điều chỉnh mã để thuận lợi hơn cho người mù sử dụng.
- Thay đổi chiều cao của một số chỗ (tranh chính, trang chờ kết quả dịch) để không xuất hiện Scrollbar vô duyên.

## [v1.0.12] - 2026-04-19

### Fixed
- Thêm thông báo lỗi nếu website đó bị chặn không truy cập được (ví dụ dùng Cloudflare).

### Added
- Bổ sung tính năng dịch file html, người dùng vẫn vào được các website chặn bot, họ tải file về và up lên để dịch.

## [v1.0.11] - 2026-04-19

### Fixed
- Cập nhật SI/Prompt lên phiên bản mới nhất.

## [v1.0.10] - 2026-04-19

### Fixed
- Chỉnh sửa kích cỡ nút thoát khỏi chế độ Zen mode cho nó nhỏ lại.
- Điều chỉnh vị trí của nút mục lục để nó đỡ tranh chấp không gian với nút Thoát Zen mode.

## [v1.0.9] - 2026-04-19

### Added
- Thêm tính năng nhập danh sách website ưa thích.

## [v1.0.8] - 2026-04-19

### Added
- Thêm tính năng dịch từ khóa tìm kiếm, và đẩy kết quả sang Google.

## [v1.0.7] - 2026-04-18

### Fixed
- Cập nhật cho ứng dụng lên SI/Prompt phiên bản mới nhất để dịch web (từ dự án `SI-Prompt-WEB-EV-Translate` cùng tác giả).

## [v1.0.6] - 2026-04-18

### Fixed
- Khắc phục tình trạng ảnh dạng click phóng to trong trang gốc xuất hiện lỗi khi chuyển sang markdown (dùng linkedom để xử lý).
- Cập nhật SI để dịch tiêu đề hay hơn.
- Bổ sung footer.

## [v1.0.5] - 2026-04-17

### Fixed
- Thu hẹp lại header chính của giao diện. Đổi bố cục tiêu đề. Thiết lập font chữ không chân cố định (Be Vietnam pro).
- Thêm tính năng thu gọn sticky để tránh cản trở luồng đọc của người dùng.

## [v1.0.4] - 2026-04-17

### Fixed
- Điều chỉnh để quá trình cắt gọt html diễn ra mà không gây quá tải cho máy chủ (cắt script, cắt style trước khi dựng cây DOM).
- Điều chỉnh kết quả dịch có bố cục gọn gàng hơn (thu gọn nút tải file html xuống).

## [v1.0.3] - 2026-04-17

### Fixed
- Chỉnh trang hiển thị lần đầu về dạng tối giản.
- Điều chỉnh kết quả dịch có bố cục gọn gàng hơn (loại bỏ, thu gọn thông tin).

## [v1.0.2] - 2026-04-17

### Fixed
- Chỉnh lại giao diện trên di động.
- Điều chỉnh giao diện chờ đợi trong quá trình dịch.

## [v1.0.1] - 2026-04-17

### Fixed
- Điều chỉnh kiểm soát thông báo lỗi khi nhập sai URL (dịch sai định dạng như dịch file css, js, jpg, dịch trang chủ, hoặc các trang gây quá tải cho server, v.v..).
- Điều chỉnh thanh temperature thành dạng chấm tròn đẹp hơn dạng thanh trượt chiếm diện tích và hơi nhạt!
