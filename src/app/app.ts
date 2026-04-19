import {ChangeDetectionStrategy, Component, signal, computed, inject} from '@angular/core';
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
  timeoutId?: any;
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
  translationTime = signal(0);
  isZenMode = signal(false);
  
  searchQuery = signal('');
  isSearchLoading = signal(false);

  uploadedHtmlFile = signal<File | null>(null);
  uploadedHtmlContent = signal<string>('');

  favoriteSites = signal<string[]>([]);
  isSitesModalOpen = signal(false);
  modalSiteInputs = signal<{id: number, url: string}[]>([]);
  private modalInputIdCounter = 0;
  
  formattedTime = computed(() => {
    const t = this.translationTime();
    const m = Math.floor(t / 60).toString().padStart(2, '0');
    const s = (t % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  });

  private toastIdCounter = 0;
  private timerInterval: any;
  private cachedSi = '';
  private cachedPrompt = '';
  private cachedTemplateHtml = '';
  private cachedTemplateCss = '';
  private cachedTemplateJs = '';

  constructor() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedSites = localStorage.getItem('wpsila_fav_sites');
      if (savedSites) {
        try {
          const parsed = JSON.parse(savedSites);
          if (Array.isArray(parsed)) {
            this.favoriteSites.set(parsed);
          }
        } catch (e) {}
      }
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0] as File;
    if (!file) return;

    if (file.size > 500 * 1024) {
      this.showToast("File HTML quá lớn (trên 500KB có thể do chứa ảnh hoặc/và mã rác). Bạn vui lòng tải lại/lưu lại trang web với tùy chọn 'Webpage, HTML Only' (Chỉ HTML) nhé!", "error");
      event.target.value = '';
      return;
    }

    this.uploadedHtmlFile.set(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      this.uploadedHtmlContent.set(e.target?.result as string);
      event.target.value = '';
    };
    reader.readAsText(file);
  }

  removeUploadedFile() {
    this.uploadedHtmlFile.set(null);
    this.uploadedHtmlContent.set('');
  }

  getDomainName(url: string): string {
    try {
      let cleanUrl = url.trim();
      if (!/^https?:\/\//i.test(cleanUrl)) {
        cleanUrl = 'https://' + cleanUrl;
      }
      const domain = new URL(cleanUrl).hostname;
      return domain.replace(/^www\./i, '');
    } catch (e) {
      return url;
    }
  }

  openSitesModal() {
    const current = this.favoriteSites();
    let initialInputs: {id: number, url: string}[] = [];
    if (current.length === 0) {
      initialInputs = [
        { id: this.modalInputIdCounter++, url: '' },
        { id: this.modalInputIdCounter++, url: '' },
        { id: this.modalInputIdCounter++, url: '' }
      ];
    } else {
      initialInputs = current.map(url => ({ id: this.modalInputIdCounter++, url }));
    }
    this.modalSiteInputs.set(initialInputs);
    this.isSitesModalOpen.set(true);
    
    // Trap focus/Auto focus
    setTimeout(() => {
      const firstInput = document.getElementById(`modal-input-${initialInputs[0]?.id}`);
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  }

  addModalInput() {
    if (this.modalSiteInputs().length < 10) {
      this.modalSiteInputs.update(inputs => [...inputs, { id: this.modalInputIdCounter++, url: '' }]);
    }
  }

  removeModalInput(id: number) {
    this.modalSiteInputs.update(inputs => inputs.filter(item => item.id !== id));
  }

  updateModalInput(id: number, value: string) {
    this.modalSiteInputs.update(inputs => 
      inputs.map(item => item.id === id ? { ...item, url: value } : item)
    );
  }

  saveSites() {
    const validSites = this.modalSiteInputs()
      .map(item => item.url.trim())
      .filter(url => url.length > 0)
      .map(url => {
        if (!/^https?:\/\//i.test(url)) {
          return 'https://' + url;
        }
        return url;
      });

    this.favoriteSites.set(validSites);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('wpsila_fav_sites', JSON.stringify(validSites));
    }
    this.isSitesModalOpen.set(false);
    
    if (validSites.length === 0) {
      this.showToast('Bạn chưa nhập bất cứ website nào.', 'info');
    } else {
      this.showToast('Đã lưu danh sách website!', 'success');
    }
  }

  showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const id = this.toastIdCounter++;
    
    // Auto remove after 5 seconds for success, 10 seconds for error/info
    const timeout = type === 'success' ? 5000 : 10000;
    const timeoutId = setTimeout(() => {
      this.removeToast(id);
    }, timeout);
    
    this.toasts.update(current => [...current, { id, message, type, timeoutId }]);
  }

  removeToast(id: number) {
    this.toasts.update(current => {
      const toast = current.find(t => t.id === id);
      if (toast && toast.timeoutId) {
        clearTimeout(toast.timeoutId);
      }
      return current.filter(t => t.id !== id);
    });
  }

  async fetchPrompts() {
    const bypassCache = `?v=${new Date().getTime()}`;
    // Always fetch latest to ensure UI updates apply immediately without requiring a full page refresh
    this.cachedSi = await firstValueFrom(this.http.get('/prompts/web_system_instructions.md' + bypassCache, { responseType: 'text' }));
    this.cachedPrompt = await firstValueFrom(this.http.get('/prompts/web_prompt.md' + bypassCache, { responseType: 'text' }));
    
    this.cachedTemplateHtml = await firstValueFrom(this.http.get('/template/reader.html' + bypassCache, { responseType: 'text' }));
    this.cachedTemplateCss = await firstValueFrom(this.http.get('/template/reader.css' + bypassCache, { responseType: 'text' }));
    this.cachedTemplateJs = await firstValueFrom(this.http.get('/template/reader.js' + bypassCache, { responseType: 'text' }));
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
      this.showToast('URL không hợp lệ. Vui lòng nhập một đường dẫn bắt đầu bằng http:// hoặc https://. Đơn giản là hãy copy đường link của bài viết trên thanh địa chỉ trình duyệt rồi dán vào là cách chắc chắn nhất.', 'error');
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

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.translationTime.set(0);
    this.timerInterval = setInterval(() => this.translationTime.update(v => v + 1), 1000);

    try {
      // 0. Fetch prompts
      await this.fetchPrompts();

      // 1. Extract content via our server proxy (passing HTML content if user uploaded a file)
      const payload: any = { url: originalUrl };
      if (this.uploadedHtmlContent()) {
        payload.htmlContent = this.uploadedHtmlContent();
      }

      const extraction = await firstValueFrom(
        this.http.post<{title: string, content: string, youtubeVideos?: string[]}>('/api/extract', payload)
      );
      
      this.translatedTitle.set(extraction.title);

      // Markdown is returned from backend directly
      // Prepend the title inside markdown so the AI translates it!
      const markdownContent = `# ${extraction.title}\n\n${extraction.content}`;

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

      // Parse the output to find the translated title
      let translatedTitleString = extraction.title; // fallback
      const h1Match = translatedMarkdown.match(/^\s*#\s+(.+)$/m);
      if (h1Match) {
         translatedTitleString = h1Match[1].trim();
      }
      this.translatedTitle.set(translatedTitleString);
      
      // 4. Convert translated Markdown back to HTML
      let finalHtml = await marked.parse(translatedMarkdown);

      // 5. Restore YouTube Videos
      if (extraction.youtubeVideos && extraction.youtubeVideos.length > 0) {
        extraction.youtubeVideos.forEach((videoHtml, i) => {
          // Bọc lại bằng wrapper để tối ưu hiển thị (Responsive Iframe)
          const responsiveVideoHtml = `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; border-radius: 8px; margin: 24px 0px;">
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
              ${videoHtml.replace(/<iframe /gi, '<iframe style="width: 100%; height: 100%; position: absolute; top: 0; left: 0;" ')}
            </div>
          </div>`;
          const regex = new RegExp(`<p>\\[YOUTUBE_VIDEO_${i}\\]<\\/p>|\\[YOUTUBE_VIDEO_${i}\\]`, 'gi');
          finalHtml = finalHtml.replace(regex, responsiveVideoHtml);
        });
      }

      const tokensIn = Math.round(fullPrompt.length / 4);
      const tokensOut = Math.round(translatedMarkdown.length / 4);
      const now = new Date();
      const dateStr = `${now.toLocaleDateString('vi-VN')} | Giờ: ${now.toLocaleTimeString('vi-VN')}`;

      let finalDoc = this.cachedTemplateHtml
        .replace('{{TITLE}}', translatedTitleString)
        .replace('{{CSS_CONTENT}}', this.cachedTemplateCss)
        .replace('{{JS_CONTENT}}', this.cachedTemplateJs)
        .replace(/{{ORIGINAL_URL}}/g, this.url())
        .replace('{{DATE}}', dateStr)
        .replace('{{MODEL}}', 'gemini-pro-latest')
        .replace('{{TEMP}}', this.temperature().toString())
        .replace('{{TOKENS_IN}}', tokensIn.toString())
        .replace('{{TOKENS_OUT}}', tokensOut.toString())
        .replace('{{TRANSLATED_CONTENT}}', finalHtml);

      this.rawHtmlString.set(finalDoc);
      this.fullHtmlString.set(this.sanitizer.bypassSecurityTrustHtml(finalDoc));
      this.translatedHtml.set(this.sanitizer.bypassSecurityTrustHtml(finalHtml));
      
      this.showToast('Đã dịch xong, bạn hãy đọc nó ngay nhé!', 'success');
    } catch (err: any) {
      console.error('Translation error:', err);
      
      let errorMessage = 'Có lỗi xảy ra trong quá trình dịch. Vui lòng thử lại.';
      const errString = err.toString().toLowerCase();
      
      if (err.error && err.error.error) {
        // Backend returned a specified error logic (Length limit, not readerable)
        errorMessage = err.error.error;
      } else if (errString.includes('parsing') || errString.includes('http failure during parsing')) {
        errorMessage = 'Hệ thống đang trích xuất dữ liệu chậm do website nguồn phản hồi lâu hoặc máy chủ đang tải nặng. Vui lòng đợi trong giây lát và thử lại nhé!';
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
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.isLoading.set(false);
    }
  }

  async translateSearchQuery() {
    let query = this.searchQuery().trim();
    
    // Group 1: Validate input
    if (!query) {
      this.showToast('Vui lòng nhập từ khóa bạn muốn tìm kiếm.', 'error');
      return;
    }
    
    if (query.length > 300) {
      this.showToast('Từ khóa quá dài. Vui lòng nhập ngắn gọn để Google tìm kiếm chính xác nhất.', 'error');
      return;
    }

    const urlPattern = /^(https?:\/\/|www\.)|(\.[a-z]{2,}(\/|$))/i;
    // Basic check for URL string. If it looks like a URL, notify user to use "Dịch Web"
    if (urlPattern.test(query)) {
      this.showToast('Đây là khu vực dịch từ khóa để tìm kiếm, nếu bạn muốn dịch web thì sử dụng tính năng ở phần đầu trang [chỗ có nút "Dịch Web"].', 'info');
      return;
    }

    this.isSearchLoading.set(true);

    try {
      const systemInstruction = `Bạn là một AI chuyên dịch truy vấn tìm kiếm (search queries) từ tiếng Việt sang tiếng Anh. Nhiệm vụ DUY NHẤT của bạn là trả về MỘT (1) truy vấn tìm kiếm tiếng Anh hiệu quả nhất, dựa trên đánh giá của bạn về ý định (search intent) và cách tìm kiếm phổ biến nhất trong tiếng Anh.

QUY TẮC BẮT BUỘC TUÂN THỦ:
1.  **CHỈ MỘT KẾT QUẢ:** Luôn luôn và chỉ luôn trả về DUY NHẤT MỘT chuỗi văn bản là bản dịch truy vấn tốt nhất. KHÔNG được đưa ra nhiều lựa chọn.
2.  **CHỈ VĂN BẢN THUẦN TÚY:** Kết quả trả về CHỈ BAO GỒM văn bản tiếng Anh đã dịch. TUYỆT ĐỐI KHÔNG thêm bất kỳ lời chào, lời giải thích, ghi chú, dấu ngoặc kép bao quanh, định dạng markdown, hoặc bất kỳ ký tự/từ ngữ nào khác ngoài chính truy vấn đã dịch.
3.  **ƯU TIÊN HIỆU QUẢ TÌM KIẾM:** Mục tiêu là tạo ra truy vấn mà người dùng tiếng Anh thực sự sẽ gõ vào máy tìm kiếm. Ưu tiên từ khóa cốt lõi, ý định, sự ngắn gọn, và các cụm từ tìm kiếm phổ biến (how to, best, near me, price, review, etc.).
4.  **ĐỘ CHÍNH XÁC VỀ Ý ĐỊNH:** Nắm bắt chính xác nhất ý định đằng sau truy vấn gốc tiếng Việt. Nếu mơ hồ, hãy chọn cách diễn giải phổ biến hoặc khả năng cao nhất.
5.  **ĐỊNH DẠNG ĐẦU RA:** Đảm bảo đầu ra là một chuỗi văn bản thuần túy (plain text string) duy nhất, sẵn sàng để sao chép và dán trực tiếp vào thanh tìm kiếm.`;

      const prompt = `Provide the single best English search query translation for the following Vietnamese query. Output ONLY the raw English text, nothing else:\n[${query}]`;

      // Group 2: Call Gemini API
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const aiResponse = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.2
        }
      });

      let translatedQuery = aiResponse.text || '';
      // Clean up whitespace/markdown gracefully just in case
      translatedQuery = translatedQuery.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim();
      
      // Group 3: Popup Blocker & unexpected empty result
      if (!translatedQuery) {
        this.showToast('Có chút trục trặc khi trích xuất kết quả. Vui lòng thử lại từ khóa khác.', 'error');
        return;
      }

      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(translatedQuery)}`;
      const newWindow = window.open(searchUrl, '_blank');
      
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        this.showToast('Trình duyệt của bạn đang chặn mở tab mới. Vui lòng cấp quyền Popup cho trang web này để xem kết quả.', 'error');
      } else {
        this.searchQuery.set(''); // Clear input on success
      }
      
    } catch (err: any) {
      console.error('Search Translation error:', err);
      let errorMessage = 'Có lỗi xảy ra trong quá trình dịch. Vui lòng thử lại.';
      const errString = err.toString().toLowerCase();

      if (errString.includes('429') || errString.includes('quota') || errString.includes('exhausted')) {
        errorMessage = 'Bạn đã vượt quá giới hạn dịch miễn phí của AI. Vui lòng thử lại sau.';
      } else if (errString.includes('api key not valid') || errString.includes('api_key_invalid')) {
        errorMessage = 'API Key không hợp lệ. Vui lòng kiểm tra lại trong phần Cài đặt.';
      } else if (errString.includes('network') || errString.includes('failed to fetch')) {
        errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra lại internet của bạn.';
      } else if (errString.includes('safety') || errString.includes('blocked')) {
        errorMessage = 'Từ khóa bị AI từ chối dịch do vi phạm chính sách an toàn.';
      }

      this.showToast(errorMessage, 'error');
    } finally {
      this.isSearchLoading.set(false);
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
    
    this.showToast('Đã tải bản dịch (.html) về máy. Bạn có thể đọc được bài dịch bằng tất cả các trình duyệt phổ thông.', 'success');
  }
}
