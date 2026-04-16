import {ChangeDetectionStrategy, Component, signal, inject} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {firstValueFrom} from 'rxjs';
import {GoogleGenAI, ThinkingLevel} from '@google/genai';
import {marked} from 'marked';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);

  url = signal('');
  temperature = signal(0.5);
  isLoading = signal(false);
  error = signal('');
  translatedHtml = signal<SafeHtml | null>(null);
  translatedTitle = signal('');
  fullHtmlString = signal<SafeHtml | null>(null);
  rawHtmlString = signal('');
  toasts = signal<Toast[]>([]);

  private toastIdCounter = 0;
  private cachedSi = '';
  private cachedPrompt = '';
  private cachedTemplateHtml = '';
  private cachedTemplateCss = '';
  private cachedTemplateJs = '';

  showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const id = this.toastIdCounter++;
    this.toasts.update(current => [...current, { id, message, type }]);
    
    // Auto remove after 5 seconds for success, 7 seconds for error/info
    const timeout = type === 'success' ? 5000 : 7000;
    setTimeout(() => {
      this.toasts.update(current => current.filter(t => t.id !== id));
    }, timeout);
  }

  async fetchPrompts() {
    if (!this.cachedSi) {
      this.cachedSi = await firstValueFrom(this.http.get('/prompts/web_system_instructions.md', { responseType: 'text' }));
    }
    if (!this.cachedPrompt) {
      this.cachedPrompt = await firstValueFrom(this.http.get('/prompts/web_prompt.md', { responseType: 'text' }));
    }
    if (!this.cachedTemplateHtml) {
      this.cachedTemplateHtml = await firstValueFrom(this.http.get('/template/reader.html', { responseType: 'text' }));
      this.cachedTemplateCss = await firstValueFrom(this.http.get('/template/reader.css', { responseType: 'text' }));
      this.cachedTemplateJs = await firstValueFrom(this.http.get('/template/reader.js', { responseType: 'text' }));
    }
  }

  async translate() {
    const originalUrl = this.url().trim();
    if (!originalUrl) return;

    // --- FRONTEND URL VALIDATION ---
    // 1. Valid URL format
    let urlObj: URL;
    try {
      urlObj = new URL(originalUrl);
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        throw new Error();
      }
    } catch {
      this.showToast('URL không hợp lệ. Vui lòng nhập một đường dẫn bắt đầu bằng http:// hoặc https://', 'error');
      return;
    }

    // 2. Reject static files
    const extensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.pdf', '.mp4', '.mp3', '.zip', '.rar', '.exe'];
    const pathnameLower = urlObj.pathname.toLowerCase();
    if (extensions.some(ext => pathnameLower.endsWith(ext))) {
      this.showToast('silaTranslator không hỗ trợ dịch trực tiếp các file tĩnh (ảnh, video, pdf, css...). Vui lòng nhập link của một bài báo.', 'error');
      return;
    }

    // 3. Reject homepages
    if (urlObj.pathname === '/' || urlObj.pathname === '') {
       this.showToast('Đây là đường dẫn trang chủ. silaTranslator tập trung vào việc dịch chi tiết nội dung. Vui lòng nhập link của một bài viết cụ thể!', 'error');
       return;
    }
    // --- END VALIDATION ---

    this.isLoading.set(true);
    this.error.set('');
    this.translatedHtml.set(null);
    this.fullHtmlString.set(null);
    this.rawHtmlString.set('');
    this.translatedTitle.set('');

    try {
      // 0. Fetch prompts
      await this.fetchPrompts();

      // 1. Extract content from the URL via our server proxy (Server now returns Markdown directly and performs Readerable + Length checks)
      const extraction = await firstValueFrom(
        this.http.post<{title: string, content: string}>('/api/extract', { url: originalUrl })
      );
      
      this.translatedTitle.set(extraction.title);

      // Markdown is returned from backend directly
      const markdownContent = extraction.content;

      // 3. Translate content using Gemini on the client
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const fullPrompt = `${this.cachedPrompt}\n\n${markdownContent}`;

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-pro-latest',
        contents: fullPrompt,
        config: {
          systemInstruction: this.cachedSi,
          temperature: this.temperature(),
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          }
        }
      });

      let translatedMarkdown = aiResponse.text || '';
      // Clean up potential markdown code blocks if the AI wraps the whole output
      translatedMarkdown = translatedMarkdown.replace(/^```markdown\n?/, '').replace(/\n?```$/, '');
      
      // 4. Convert translated Markdown back to HTML
      const finalHtml = await marked.parse(translatedMarkdown);

      const tokensIn = Math.round(fullPrompt.length / 4);
      const tokensOut = Math.round(translatedMarkdown.length / 4);
      const now = new Date();
      const dateStr = `${now.toLocaleDateString('vi-VN')} | Giờ: ${now.toLocaleTimeString('vi-VN')}`;

      let finalDoc = this.cachedTemplateHtml
        .replace('{{TITLE}}', extraction.title)
        .replace('{{CSS_CONTENT}}', this.cachedTemplateCss)
        .replace('{{JS_CONTENT}}', this.cachedTemplateJs)
        .replace(/{{ORIGINAL_URL}}/g, this.url())
        .replace('{{DATE}}', dateStr)
        .replace('{{MODEL}}', 'gemini-pro-latest')
        .replace('{{TEMP}}', this.temperature().toString())
        .replace('{{TOKENS_IN}}', tokensIn.toString())
        .replace('{{TOKENS_OUT}}', tokensOut.toString())
        .replace('{{SYSTEM_PROMPT}}', this.cachedSi.replace(/</g, '&lt;').replace(/>/g, '&gt;'))
        .replace('{{USER_PROMPT}}', this.cachedPrompt.replace(/</g, '&lt;').replace(/>/g, '&gt;'))
        .replace('{{TRANSLATED_CONTENT}}', finalHtml);

      this.rawHtmlString.set(finalDoc);
      this.fullHtmlString.set(this.sanitizer.bypassSecurityTrustHtml(finalDoc));
      this.translatedHtml.set(this.sanitizer.bypassSecurityTrustHtml(finalHtml));
      
      this.showToast('Dịch hoàn tất! Đã sẵn sàng để đọc.', 'success');
    } catch (err: any) {
      console.error('Translation error:', err);
      
      let errorMessage = 'Có lỗi xảy ra trong quá trình dịch. Vui lòng thử lại.';
      const errString = err.toString().toLowerCase();
      
      if (err.error && err.error.error) {
        // Backend returned a specified error logic (Length limit, not readerable)
        errorMessage = err.error.error;
      } else if (errString.includes('parsing') || errString.includes('http failure during parsing')) {
        errorMessage = 'Máy chủ bị quá tải khi phân tích trang web này (cấu trúc quá lớn hoặc từ chối kết nối). Vui lòng thử một đường link bài viết khác!';
      } else if (errString.includes('429') || errString.includes('quota') || errString.includes('exhausted')) {
        errorMessage = 'Bạn đã vượt quá giới hạn dịch miễn phí của AI. Vui lòng thử lại sau hoặc kiểm tra lại API Key.';
      } else if (errString.includes('api key not valid') || errString.includes('api_key_invalid')) {
        errorMessage = 'API Key không hợp lệ. Vui lòng kiểm tra lại API Key trong phần Settings (biểu tượng bánh răng) -> Secrets.';
      } else if (errString.includes('extract') || errString.includes('fetch') || errString.includes('could not extract')) {
        errorMessage = 'Không thể đọc nội dung từ liên kết này. Trang web có thể yêu cầu đăng nhập hoặc chặn truy cập.';
      } else if (errString.includes('network') || errString.includes('failed to fetch')) {
        errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra lại internet của bạn.';
      } else if (errString.includes('safety') || errString.includes('blocked')) {
        errorMessage = 'AI từ chối dịch nội dung này do vi phạm chính sách an toàn.';
      } else if (err.message) {
        errorMessage = `Lỗi: ${err.message}`;
      }

      this.showToast(errorMessage, 'error');
      this.error.set(errorMessage);
    } finally {
      this.isLoading.set(false);
    }
  }

  downloadHtml() {
    if (!this.rawHtmlString()) return;
    const blob = new Blob([this.rawHtmlString()], { type: 'text/html;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ban-dich-${new Date().getTime()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    this.showToast('Đã tải bản dịch (.html) về máy.', 'success');
  }
}
