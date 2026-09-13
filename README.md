# 3W-silaTranslator
Ứng dụng dịch web từ tiếng Anh sang tiếng Việt. 

- **Link app trên AI Studio**: https://aistudio.google.com/apps/4cc7e19e-46dd-4d38-8617-ba38ef1c80c3?showPreview=true&showAssistant=true&fullscreenApplet=true (tận dụng được ngưỡng miễn phí hàng ngày tương đổi rộng rãi của Gemini).
- Hướng dẫn sử dụng: https://web-translator.wpsila.com

3W-silaTranslator sử dụng SI/Prompt mẫu `SI-Prompt-WEB-EV-Translate` (v1.0.4) ở đây (cùng tác giả): https://github.com/kiencang/SI-Prompt-WEB-EV-Translate

## Tuyên bố từ chối trách nhiệm
Công cụ này có thể được sử dụng cho mục đích nghiên cứu và học tập cá nhân.

3W-silaTranslator cũng như người phát triển nó không đưa ra bất kỳ bảo đảm rõ ràng hay ngụ ý nào, cũng như không tuyên bố rằng công cụ sẽ vận hành hoàn hảo, chính xác hoặc cập nhật. Người phát triển sẽ không chịu trách nhiệm cho bất kỳ tổn thất hay thiệt hại nào phát sinh trực tiếp hoặc gián tiếp liên quan đến hoặc phát sinh từ việc sử dụng công cụ này.

## Ghi công
Một số thư viện quan trọng mà ứng dụng này dùng:

*   **[Angular](https://angular.dev/)**: Lõi chính của ứng dụng.
*   **[Tailwind CSS](https://tailwindcss.com/)**: Xây dựng giao diện chính cho ứng dụng.
*   **[Marked](https://marked.js.org/)**: Chuyển Markdown sang cấu trúc HTML để hiển thị cho người dùng cuối.
*   **[Turndown](https://github.com/mixmark-io/turndown)**: Chuyển đổi ngược định dạng HTML thành cú pháp Markdown.
*   **[Mozilla Readability](https://github.com/mozilla/readability)**: Thư viện bóc tách nội dung chính của một bài báo/trang web (loại bỏ quảng cáo, menu, header...).
*   **[idb (IndexedDB Wrapper)](https://github.com/jakearchibald/idb)**: Thư viện wrap IndexedDB, hỗ trợ xử lý các tác vụ liên quan đến IndexedDB tốt hơn. Toàn bộ dữ liệu bản dịch được lưu cục bộ tại trình duyệt là thông qua IndexedDB.

