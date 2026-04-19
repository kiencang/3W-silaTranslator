import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';
import { parseHTML } from 'linkedom';
import { Readability, isProbablyReaderable } from '@mozilla/readability';
import TurndownService from 'turndown';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use(express.json({ limit: '50mb' }));

app.post('/api/extract', async (req, res) => {
  try {
    const { url, htmlContent } = req.body;
    if (!url) {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    let rawHtml = '';

    // 1. Dùng nội dung HTML từ client đẩy lên (Bypass) hoặc Tự Fetch từ URL
    if (htmlContent && typeof htmlContent === 'string') {
      rawHtml = htmlContent;
    } else {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`);
      }
      rawHtml = await response.text();
    }

    // CHIẾN LƯỢC 2: Tiền xử lý - Cắt gọt thẻ <script> và <style> (giữ lại <svg>) 
    // để làm nhẹ DOM xuống 80% bộ nhớ.
    let cleanHtml = rawHtml
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '');

    // Fast-fail: Từ chối các khối HTML lớn bất thường trước khi đưa vào phân tích DOM để tránh tràn bộ nhớ
    if (cleanHtml.length > 500000) {
      res.status(413).json({ error: 'Mã nguồn trang web này quá lớn (vượt quá 500,000 ký tự). Máy chủ từ chối phân tích để tránh rủi ro tràn bộ nhớ. Vui lòng chọn một bài viết thông thường.' });
      return;
    }

    // 2. Trích xuất nội dung chính của bài báo bằng thư viện Readability
    let parsedDOM: any = parseHTML(cleanHtml);
    let doc: any = parsedDOM.document;

    // CHIẾN LƯỢC 3: Lột vỏ ảnh (Unwrap Images)
    // Tìm các thẻ <img> nằm trong <a> (ví dụ: hiệu ứng Lightbox xem ảnh to).
    // Nếu thẻ <a> không chứa đoạn văn bản nào (chỉ bọc ảnh), thế mạng thẻ <a> bằng chính <img>.
    // Ngăn chặn triệt để lỗi vỡ Markdown lồng nhau khi đưa qua Turndown.
    const images = Array.from(doc.querySelectorAll('img'));
    for (const img of images as any[]) {
      const parentLink = img.closest('a');
      if (parentLink) {
        const textContent = parentLink.textContent || '';
        if (textContent.trim().length === 0) {
          parentLink.replaceWith(img);
        }
      }
    }

    // CHIẾN LƯỢC 4: Lột vỏ Link khổng lồ (Unwrap Block-Level Links)
    // Các thẻ <a> trong HTML5 thường bọc ngoài các khối lớn (div, h1-h6, p) như quảng cáo, thẻ bài viết.
    // Điều này sẽ làm gãy cú pháp Markdown cổ điển `[text](link)` do có chứa chèn dòng (Enter).
    // Ta bóc vỏ <a> đi, nhả ruột ra để bảo toàn cấu trúc phẳng.
    const EXPECTED_BLOCK_TAGS = ['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SECTION', 'ARTICLE', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'FIGURE'];
    const links = Array.from(doc.querySelectorAll('a'));
    for (const link of links as any[]) {
      if (!link.parentNode) continue;
      const hasBlockChildren = Array.from(link.children).some((child: any) => EXPECTED_BLOCK_TAGS.includes(child.tagName?.toUpperCase()));
      if (hasBlockChildren) {
        // Lột vỏ: Di chuyển mọi node con (nội dung) ra đứng trước thẻ <a> hiện tại
        while (link.firstChild) {
          link.parentNode.insertBefore(link.firstChild, link);
        }
        // Xóa vỏ <a> tàn dư
        link.parentNode.removeChild(link);
      }
    }

    // Kiểm tra xem trang web có cấu trúc phù hợp để đọc không (ví dụ: là một bài báo)
    if (!isProbablyReaderable(doc)) {
      parsedDOM = null; doc = null; // Quét rác sớm
      let errorMessage = 'Trang web này không có cấu trúc của một bài viết/bài báo. Vui lòng thử lại với một link nội dung cụ thể.';
      
      const firewallKeywords = ['cloudflare', 'complete the challenge', 'unusual activity', 'access denied', 'prove you are human', 'robot check'];
      const lowerHtml = cleanHtml.toLowerCase();
      
      if (firewallKeywords.some(keyword => lowerHtml.includes(keyword))) {
        errorMessage += ' Trang web này có thể đang sử dụng tường lửa chống Bot chặn tự động trích xuất nội dung. Chúng tôi không thể truy cập bài viết.';
      }
      
      res.status(400).json({ error: errorMessage });
      return;
    }

    let reader: any = new Readability(doc);
    let article: any = reader.parse();

    if (!article || !article.content) {
      parsedDOM = null; doc = null; reader = null; // Quét rác sớm
      throw new Error('Không thể trích xuất nội dung chính từ URL này');
    }

    // 3. Chuyển đổi HTML sang Markdown và kiểm tra giới hạn độ dài
    const turndownService = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });

    // CHIẾN LƯỢC: Bảo tồn YouTube Video (Placeholder Strategy)
    const youtubeVideos: string[] = [];
    turndownService.addRule('youtubeIframe', {
      filter: ['iframe'],
      replacement: function (content, node: any) {
        const src = node.getAttribute('src') || '';
        if (src.includes('youtube.com') || src.includes('youtu.be')) {
          const index = youtubeVideos.length;
          // Lấy chuỗi HTML nguyên bản của thẻ iframe
          const html = node.outerHTML || `<iframe src="${src}" width="${node.getAttribute('width') || '100%'}" height="${node.getAttribute('height') || '400'}" frameborder="0" allowfullscreen></iframe>`;
          youtubeVideos.push(html);
          return `\n\n\`[SILA_YOUTUBE_${index}]\`\n\n`;
        }
        return ''; // Bỏ qua các iframe khác
      }
    });

    const markdownContent = turndownService.turndown(article.content);

    // CHIẾN LƯỢC 1: Giải phóng RAM chủ động trước khi Server kịp phản hồi.
    const responseTitle = article.title;
    
    // Gán cờ rỗng cho các Object DOM khổng lồ
    parsedDOM = null;
    doc = null;
    reader = null;
    article = null;
    cleanHtml = '';

    if (markdownContent.length > 100000) {
      res.status(413).json({ error: 'Bài viết này quá dài (vượt quá giới hạn 25.000 tokens quy định). Vui lòng chọn bài viết ngắn hơn để đảm bảo chất lượng bản dịch.' });
      return;
    }

    res.json({ 
      title: responseTitle,
      content: markdownContent,
      youtubeVideos: youtubeVideos
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Đã xảy ra lỗi trong quá trình trích xuất nội dung';
    console.error('Lỗi trích xuất:', error);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * Phục vụ các file tĩnh từ thư mục /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: 0,
    index: false,
    redirect: false,
  }),
);

/**
 * Xử lý tất cả các request khác bằng cách render ứng dụng Angular.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Khởi động máy chủ nếu module này là điểm đầu vào chính, hoặc được chạy thông qua PM2.
 * Máy chủ sẽ lắng nghe trên cổng được định nghĩa bởi biến môi trường `PORT`, hoặc mặc định là 3000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 3000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }
    console.log(`Máy chủ Node Express đang lắng nghe tại http://localhost:${port}`);
  });
}

/**
 * Trình xử lý request được sử dụng bởi Angular CLI (cho dev-server và trong quá trình build) hoặc Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
export { app };
