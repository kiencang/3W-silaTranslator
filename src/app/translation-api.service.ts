import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = { url };
    if (htmlContent) {
      payload.htmlContent = htmlContent;
    }
    return firstValueFrom(
      this.http.post<{title: string, content: string, youtubeVideos?: string[]}>('/api/extract', payload)
    );
  }

  async translateContent(markdownContent: string, selectedModel: string, useSearchGrounding: boolean, userApiKey: string) {
    const headersObject: Record<string, string> = {};
    if (userApiKey) {
      headersObject['x-user-api-key'] = userApiKey;
    }

    return firstValueFrom(
      this.http.post<{translatedMarkdown: string}>('/api/translate', {
        markdownContent,
        systemInstruction: this.cachedSi,
        userPrompt: this.cachedPrompt,
        model: selectedModel,
        useSearchGrounding
      }, { headers: headersObject })
    );
  }

  async translateSearchQuery(query: string, userApiKey: string) {
    const systemInstruction = `Bạn là một AI chuyên dịch truy vấn tìm kiếm (search queries) từ tiếng Việt sang tiếng Anh. Nhiệm vụ DUY NHẤT của bạn là trả về MỘT (1) truy vấn tìm kiếm tiếng Anh hiệu quả nhất, dựa trên đánh giá của bạn về ý định (search intent) và cách tìm kiếm phổ biến nhất trong tiếng Anh.

QUY TẮC BẮT BUỘC TUÂN THỦ:
1.  **CHỈ MỘT KẾT QUẢ:** Luôn luôn và chỉ luôn trả về DUY NHẤT MỘT chuỗi văn bản là bản dịch truy vấn tốt nhất. KHÔNG được đưa ra nhiều lựa chọn.
2.  **CHỈ VĂN BẢN THUẦN TÚY:** Kết quả trả về CHỈ BAO GỒM văn bản tiếng Anh đã dịch. TUYỆT ĐỐI KHÔNG thêm bất kỳ lời chào, lời giải thích, ghi chú, dấu ngoặc kép bao quanh, định dạng markdown, hoặc bất kỳ ký tự/từ ngữ nào khác ngoài chính truy vấn đã dịch.
3.  **ƯU TIÊN HIỆU QUẢ TÌM KIẾM:** Mục tiêu là tạo ra truy vấn mà người dùng tiếng Anh thực sự sẽ gõ vào máy tìm kiếm. Ưu tiên từ khóa cốt lõi, ý định, sự ngắn gọn, và các cụm từ tìm kiếm phổ biến (how to, best, near me, price, review, etc.).
4.  **ĐỘ CHÍNH XÁC VỀ Ý ĐỊNH:** Nắm bắt chính xác nhất ý định đằng sau truy vấn gốc tiếng Việt. Nếu mơ hồ, hãy chọn cách diễn giải phổ biến hoặc khả năng cao nhất.
5.  **ĐỊNH DẠNG ĐẦU RA:** Đảm bảo đầu ra là một chuỗi văn bản thuần túy (plain text string) duy nhất, sẵn sàng để sao chép và dán trực tiếp vào thanh tìm kiếm.`;

    const prompt = `Provide the single best English search query translation for the following Vietnamese query. Output ONLY the raw English text, nothing else:\n[${query}]`;

    const headersObject: Record<string, string> = {};
    if (userApiKey) {
      headersObject['x-user-api-key'] = userApiKey;
    }

    return firstValueFrom(
      this.http.post<{translatedQuery: string}>('/api/translate-query', {
        query,
        systemInstruction,
        userPrompt: prompt
      }, { headers: headersObject })
    );
  }
}
