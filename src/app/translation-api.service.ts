import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Readability, isProbablyReaderable } from '@mozilla/readability';
import TurndownService from 'turndown';

@Injectable({
  providedIn: 'root'
})
export class TranslationApiService {
  private http = inject(HttpClient);

  cachedSi = '';
  cachedPrompt = '';
  cachedTemplateHtml = '';
  cachedTemplateCss = '';
  cachedTemplateJs = '';

  async fetchPrompts() {
    const bypassCache = `?v=${new Date().getTime()}`;
    this.cachedSi = await firstValueFrom(this.http.get('/prompts/web_system_instructions.md' + bypassCache, { responseType: 'text' }));
    this.cachedPrompt = await firstValueFrom(this.http.get('/prompts/web_prompt.md' + bypassCache, { responseType: 'text' }));
    
    this.cachedTemplateHtml = await firstValueFrom(this.http.get('/template/reader.html' + bypassCache, { responseType: 'text' }));
    this.cachedTemplateCss = await firstValueFrom(this.http.get('/template/reader.css' + bypassCache, { responseType: 'text' }));
    this.cachedTemplateJs = await firstValueFrom(this.http.get('/template/reader.js' + bypassCache, { responseType: 'text' }));
  }

  async extractContent(url: string, htmlContent?: string) {
    let rawHtml = htmlContent || '';

    if (!htmlContent) {
      if (url) {
        const payload = { url };
        // Fetch raw HTML through our server to bypass CORS
        const res = await firstValueFrom(
          this.http.post<{rawHtml: string}>('/api/fetch-html', payload)
        );
        rawHtml = res.rawHtml;
      } else {
        throw new Error('URL or HTML content is required');
      }
    }

    let cleanHtml = rawHtml
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '');

    if (cleanHtml.length > 5000000) {
      throw new Error('Mã nguồn trang web này quá lớn (vượt quá 5MB). Trình duyệt từ chối phân tích để tránh rủi ro tràn bộ nhớ. Vui lòng chọn một bài viết thông thường.');
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(cleanHtml, 'text/html');

    // MỚI: Tuyệt đối hóa các URL tương đối
    if (url) {
      try {
        const baseUrlObj = new URL(url);
        
        const anchors = Array.from(doc.querySelectorAll('a'));
        for (const a of anchors) {
          const href = a.getAttribute('href');
          if (href && !href.startsWith('javascript:') && !href.startsWith('mailto:') && !href.startsWith('#')) {
            try {
              a.setAttribute('href', new URL(href, baseUrlObj).href);
            } catch (e) {
              // Ignore invalid URLs
            }
          }
        }
        
        const imgs = Array.from(doc.querySelectorAll('img'));
        for (const img of imgs) {
          const src = img.getAttribute('src');
          if (src && !src.startsWith('data:')) {
            try {
              img.setAttribute('src', new URL(src, baseUrlObj).href);
            } catch (e) {
              // Ignore invalid URLs
            }
          }
        }
      } catch (e) {
        console.warn('Invalid base URL:', e);
      }
    }

    const images = Array.from(doc.querySelectorAll('img'));
    for (const img of images) {
      const parentLink = img.closest('a');
      if (parentLink) {
        const textContent = parentLink.textContent || '';
        if (textContent.trim().length === 0) {
          parentLink.replaceWith(img);
        }
      }
    }

    const EXPECTED_BLOCK_TAGS = ['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SECTION', 'ARTICLE', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'FIGURE'];
    const links = Array.from(doc.querySelectorAll('a'));
    for (const link of links) {
      if (!link.parentNode) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hasBlockChildren = Array.from(link.children).some((child: any) => EXPECTED_BLOCK_TAGS.includes(child.tagName?.toUpperCase()));
      if (hasBlockChildren) {
        while (link.firstChild) {
          link.parentNode.insertBefore(link.firstChild, link);
        }
        link.parentNode.removeChild(link);
      }
    }

    if (!isProbablyReaderable(doc)) {
      let errorMessage = 'Trang web này không có cấu trúc của một bài viết/bài báo. Vui lòng thử lại với một link nội dung cụ thể.';
      
      const firewallKeywords = ['cloudflare', 'complete the challenge', 'unusual activity', 'access denied', 'prove you are human', 'robot check'];
      const lowerHtml = cleanHtml.toLowerCase();
      
      if (firewallKeywords.some(keyword => lowerHtml.includes(keyword))) {
        errorMessage += ' Trang web này có thể đang sử dụng tường lửa chống Bot chặn tự động trích xuất nội dung. Chúng tôi không thể truy cập bài viết. Bạn có thể mở liên kết, nhấn Ctrl+S (hoặc Cmd+S) để lưu trang web (chỉ HTML) về máy dưới dạng file .html, sau đó dùng nút "Tải lên" (kẹp ghim) để dịch nhé!';
      }
      
      throw new Error(errorMessage);
    }

    const reader = new Readability(doc);
    const article = reader.parse();

    if (!article || !article.content) {
      throw new Error('Không thể trích xuất nội dung chính từ URL này');
    }

    const turndownService = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });

    const youtubeVideos: string[] = [];
    turndownService.addRule('youtubeIframe', {
      filter: ['iframe'],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      replacement: function (content, node: any) {
        const src = node.getAttribute('src') || '';
        if (src.includes('youtube.com') || src.includes('youtu.be')) {
          const index = youtubeVideos.length;
          const html = node.outerHTML || `<iframe src="${src}" width="${node.getAttribute('width') || '100%'}" height="${node.getAttribute('height') || '400'}" frameborder="0" allowfullscreen></iframe>`;
          youtubeVideos.push(html);
          return `\n\n\`[SILA_YOUTUBE_${index}]\`\n\n`;
        }
        return '';
      }
    });

    const markdownContent = turndownService.turndown(article.content);

    if (markdownContent.length > 100000) {
      throw new Error('Bài viết này quá dài (vượt quá 100,000 ký tự). Vui lòng chọn bài viết ngắn hơn để đảm bảo chất lượng bản dịch.');
    }

    return { 
      title: article.title || 'Untitled Article',
      content: markdownContent,
      youtubeVideos: youtubeVideos
    };
  }

  async translateContent(markdownContent: string, selectedModel: string, useSearchGrounding: boolean, userApiKey: string) {
    if (!userApiKey || !userApiKey.trim()) {
      throw new Error('Chưa cấu hình API Key. Kính mời quý khách nhấp vào biểu tượng chiếc chìa khóa ở góc trên để cấu hình API Key cá nhân.');
    }

    const fullPrompt = `${this.cachedPrompt}\n\n${markdownContent}`;
    const model = selectedModel || 'gemini-flash-latest';
    const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${userApiKey.trim()}`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = {
      systemInstruction: {
        parts: [{ text: this.cachedSi }]
      },
      contents: [{
        role: "user",
        parts: [{ text: fullPrompt }]
      }],
      generationConfig: {
        thinkingConfig: {
          thinkingLevel: "HIGH"
        }
      }
    };

    if (useSearchGrounding) {
      payload.tools = [{ googleSearch: {} }];
    }

    try {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error?.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      const cleanedText = text.replace(/^```markdown\n?/, '').replace(/\n?```$/, '');

      return { translatedMarkdown: cleanedText };
    } catch (error: any) {
      console.error('Translation Error:', error);
      let errorMessage = error.message || 'Lỗi trong quá trình dịch';
      
      if (errorMessage.includes('429') || errorMessage.includes('Quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        errorMessage = 'Bạn đã vượt quá giới hạn lượt sử dụng Google Gemini API (Lỗi 429). Vui lòng chờ khoảng 1 phút rồi thử lại, hoặc kiểm tra lại gói cước API của bạn.';
      }
      
      throw new Error(errorMessage);
    }
  }

  async translateSearchQuery(query: string, userApiKey: string) {
    if (!userApiKey || !userApiKey.trim()) {
      throw new Error('Chưa cấu hình API Key. Kính mời quý khách nhấp vào biểu tượng chiếc chìa khóa ở góc trên để cấu hình API Key cá nhân.');
    }

    const systemInstruction = `Bạn là một AI chuyên dịch truy vấn tìm kiếm (search queries) từ tiếng Việt sang tiếng Anh. Nhiệm vụ DUY NHẤT của bạn là trả về MỘT (1) truy vấn tìm kiếm tiếng Anh hiệu quả nhất, dựa trên đánh giá của bạn về ý định (search intent) và cách tìm kiếm phổ biến nhất trong tiếng Anh.

QUY TẮC BẮT BUỘC TUÂN THỦ:
1.  **CHỈ MỘT KẾT QUẢ:** Luôn luôn và chỉ luôn trả về DUY NHẤT MỘT chuỗi văn bản là bản dịch truy vấn tốt nhất. KHÔNG được đưa ra nhiều lựa chọn.
2.  **CHỈ VĂN BẢN THUẦN TÚY:** Kết quả trả về CHỈ BAO GỒM văn bản tiếng Anh đã dịch. TUYỆT ĐỐI KHÔNG thêm bất kỳ lời chào, lời giải thích, ghi chú, dấu ngoặc kép bao quanh, định dạng markdown, hoặc bất kỳ ký tự/từ ngữ nào khác ngoài chính truy vấn đã dịch.
3.  **ƯU TIÊN HIỆU QUẢ TÌM KIẾM:** Mục tiêu là tạo ra truy vấn mà người dùng tiếng Anh thực sự sẽ gõ vào máy tìm kiếm. Ưu tiên từ khóa cốt lõi, ý định, sự ngắn gọn, và các cụm từ tìm kiếm phổ biến (how to, best, near me, price, review, etc.).
4.  **ĐỘ CHÍNH XÁC VỀ Ý ĐỊNH:** Nắm bắt chính xác nhất ý định đằng sau truy vấn gốc tiếng Việt. Nếu mơ hồ, hãy chọn cách diễn giải phổ biến hoặc khả năng cao nhất.
5.  **ĐỊNH DẠNG ĐẦU RA:** Đảm bảo đầu ra là một chuỗi văn bản thuần túy (plain text string) duy nhất, sẵn sàng để sao chép và dán trực tiếp vào thanh tìm kiếm.`;

    const prompt = `Provide the single best English search query translation for the following Vietnamese query. Output ONLY the raw English text, nothing else:\n[${query}]`;
    const model = 'gemini-flash-latest';
    const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${userApiKey.trim()}`;

    const payload: any = {
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [{
        role: "user",
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        thinkingConfig: {
          thinkingLevel: "HIGH"
        }
      }
    };

    try {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error?.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      const cleanedText = text.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim();

      return { translatedQuery: cleanedText };
    } catch (error: any) {
      console.error('Query Translation Error:', error);
      let errorMessage = error.message || 'Lỗi dịch từ khóa';
      
      if (errorMessage.includes('429') || errorMessage.includes('Quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        errorMessage = 'Bạn đã vượt quá giới hạn lượt sử dụng Google Gemini API (Lỗi 429). Vui lòng chờ khoảng 1 phút rồi thử lại.';
      }
      
      throw new Error(errorMessage);
    }
  }
}
