import {ChangeDetectionStrategy, Component, signal, computed, inject} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {marked} from 'marked';

import {MatIconModule} from '@angular/material/icon';
import {HistoryService, TranslationHistoryItem} from './history.service';
import {FooterComponent} from './footer.component';
import {HeaderComponent} from './header.component';
import {ShareModalComponent} from './share-modal.component';
import {HistoryModalComponent} from './history-modal.component';
import {SitesModalComponent} from './sites-modal.component';
import {ApiKeyModalComponent} from './api-key-modal.component';
import {InitialViewComponent} from './initial-view.component';
import {ResultViewComponent} from './result-view.component';
import {TranslationApiService} from './translation-api.service';
import {DocumentUtilService} from './document-util.service';
import {ToastComponent} from './toast.component';
import {ToastService} from './toast.service';
import {TranslationTimerService} from './translation-timer.service';
import {TranslationLoadingComponent} from './translation-loading.component';
import {SearchTranslationService} from './search-translation.service';
import {StorageService} from './storage.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule, MatIconModule, FooterComponent, HeaderComponent, ShareModalComponent, HistoryModalComponent, SitesModalComponent, ApiKeyModalComponent, InitialViewComponent, ResultViewComponent, ToastComponent, TranslationLoadingComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  private historyService = inject(HistoryService);
  private translationApi = inject(TranslationApiService);
  private documentUtil = inject(DocumentUtilService);
  private toastService = inject(ToastService);
  private timerService = inject(TranslationTimerService);
  searchTranslationTracker = inject(SearchTranslationService);
  storageManager = inject(StorageService);

  url = signal('');
  isLoading = signal(false);
  error = signal('');
  translatedHtml = signal<SafeHtml | null>(null);
  translatedTitle = signal('');
  fullHtmlString = signal<SafeHtml | null>(null);
  rawHtmlString = signal('');
  isZenMode = signal(false);
  useSearchGrounding = signal(false);
  
  formattedTime = this.timerService.formattedTime;
  selectedModel = signal<'gemini-pro-latest' | 'gemini-flash-latest'>('gemini-flash-latest');
  
  isValidUrlInput = computed(() => {
    const input = this.url().trim();
    if (!input) return false;
    const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/i;
    return urlPattern.test(input);
  });

  uploadedHtmlFile = signal<File | null>(null);
  uploadedHtmlContent = signal<string>('');

  isSitesModalOpen = signal(false);
  isShareModalOpen = signal(false);
  isHistoryModalOpen = signal(false);
  isApiKeyModalOpen = signal(false);

  openSitesModal() {
    this.isSitesModalOpen.set(true);
  }

  openApiKeyModal() {
    this.isApiKeyModalOpen.set(true);
  }

  saveApiKey(key: string) {
    this.storageManager.saveApiKey(key);
    this.isApiKeyModalOpen.set(false);
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      this.toastService.showToast("File HTML quá lớn (trên 5MB). Bạn vui lòng tải lại/lưu lại trang web với tùy chọn 'Webpage, HTML Only' (Chỉ HTML) nhé!", "error");
      target.value = '';
      return;
    }

    this.uploadedHtmlFile.set(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      this.uploadedHtmlContent.set(e.target?.result as string);
      target.value = '';
    };
    reader.readAsText(file);
  }

  removeUploadedFile() {
    this.uploadedHtmlFile.set(null);
    this.uploadedHtmlContent.set('');
  }

  saveSites(validSites: string[]) {
    this.storageManager.saveSites(validSites);
    this.isSitesModalOpen.set(false);
  }

  async translate() {
    let originalUrl = this.url().trim();
    if (!originalUrl) return;

    if (!/^https?:\/\//i.test(originalUrl)) {
      originalUrl = 'https://' + originalUrl;
    }

    // --- FRONTEND URL VALIDATION ---
    // 1. Valid URL format
    let urlObj: URL;
    try {
      urlObj = new URL(originalUrl);
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        throw new Error();
      }
    } catch {
      this.toastService.showToast('URL không hợp lệ. Vui lòng nhập một đường dẫn hợp lệ (vd: vnexpress.net/...).', 'error');
      return;
    }

    // 2. Reject static files
    const extensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.pdf', '.mp4', '.mp3', '.zip', '.rar', '.exe'];
    const pathnameLower = urlObj.pathname.toLowerCase();
    if (extensions.some(ext => pathnameLower.endsWith(ext))) {
      this.toastService.showToast('silaTranslator không hỗ trợ dịch trực tiếp các file tĩnh (ảnh, video, pdf, css...). Vui lòng nhập link của một bài báo.', 'error');
      return;
    }

    // 3. Reject homepages
    if (urlObj.pathname === '/' || urlObj.pathname === '') {
       this.toastService.showToast('Đây là đường dẫn trang chủ. silaTranslator tập trung vào việc dịch chi tiết nội dung. Vui lòng nhập link của một bài viết cụ thể!', 'error');
       return;
    }
    // --- END VALIDATION ---

    this.isLoading.set(true);
    this.error.set('');
    this.translatedHtml.set(null);
    this.fullHtmlString.set(null);
    this.rawHtmlString.set('');
    this.translatedTitle.set('');

    this.timerService.startTimer();

    try {
      // 0. Fetch prompts
      await this.translationApi.fetchPrompts();

      // 1. Extract content via our server proxy (passing HTML content if user uploaded a file)
      const extraction = await this.translationApi.extractContent(originalUrl, this.uploadedHtmlContent());
      
      this.translatedTitle.set(extraction.title);

      // Markdown is returned from backend directly
      // Prepend the title inside markdown so the AI translates it!
      const markdownContent = `# ${extraction.title}\n\n${extraction.content}`;

      // 3. Translate content via server-side proxy
      const translationResponse = await this.translationApi.translateContent(
        markdownContent, 
        this.selectedModel(), 
        this.useSearchGrounding(), 
        this.storageManager.userApiKey()
      );

      const translatedMarkdown = translationResponse.translatedMarkdown || '';

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
      finalHtml = this.documentUtil.processYoutubeIframes(finalHtml, extraction.youtubeVideos);

      const tokensIn = Math.round(this.documentUtil.countWords(markdownContent) * 1.4);
      const tokensOut = Math.round(this.documentUtil.countWords(translatedMarkdown) * 1.5);
      const now = new Date();
      const dateStr = `${now.toLocaleDateString('vi-VN')} | Giờ: ${now.toLocaleTimeString('vi-VN')}`;

      const finalDoc = this.translationApi.cachedTemplateHtml
        .replace('{{TITLE}}', translatedTitleString)
        .replace('{{CSS_CONTENT}}', this.translationApi.cachedTemplateCss)
        .replace('{{JS_CONTENT}}', this.translationApi.cachedTemplateJs)
        .replace(/{{ORIGINAL_URL}}/g, this.url())
        .replace('{{DATE}}', dateStr)
        .replace('{{MODEL}}', this.selectedModel())
        .replace('{{TEMP}}', 'N/A')
        .replace('{{TOKENS_IN}}', tokensIn.toString())
        .replace('{{TOKENS_OUT}}', tokensOut.toString())
        .replace('{{TRANSLATED_CONTENT}}', finalHtml);

      this.rawHtmlString.set(finalDoc);
      this.fullHtmlString.set(this.sanitizer.bypassSecurityTrustHtml(finalDoc));
      this.translatedHtml.set(this.sanitizer.bypassSecurityTrustHtml(finalHtml));
      
      // Save to history
      this.historyService.addHistory({
        url: this.url().trim() || 'Nội dung upload',
        title: translatedTitleString || 'Bản dịch',
        htmlContent: finalHtml,
        rawHtmlString: finalDoc
      });
      
      this.toastService.showToast('Đã dịch xong, bạn hãy đọc nó ngay nhé!', 'success');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Translation error:', err);
      
      let errorMessage = 'Có lỗi xảy ra trong quá trình dịch. Vui lòng thử lại.';
      const errString = err.toString().toLowerCase();
      
      if (err.error && err.error.error) {
        // Backend returned a specified error logic (Length limit, not readerable)
        errorMessage = err.error.error;
      } else if (err.message) {
        errorMessage = err.message;
      }

      const checkString = errorMessage.toLowerCase() + ' ' + errString;

      if (checkString.includes('api key not valid') || checkString.includes('api_key_invalid') || (checkString.includes('api key') && checkString.includes('not valid'))) {
        errorMessage = 'API Key không hợp lệ. Vui lòng kiểm tra lại khóa API ở phần thiết lập API Key cá nhân, khả năng cao là bạn nhập nhầm.';
      } else if (checkString.includes('parsing') || checkString.includes('http failure during parsing')) {
        errorMessage = 'Hệ thống đang trích xuất dữ liệu chậm do website nguồn phản lâu hoặc máy chủ đang tải nặng. Vui lòng đợi trong giây lát và thử lại nhé!';
      } else if (checkString.includes('429') || checkString.includes('quota') || checkString.includes('exhausted')) {
        if (this.storageManager.userApiKey()) {
          errorMessage = 'API bạn nhập đã hết ngưỡng miễn phí. Hãy quay lại sử dụng sau hoặc nhập API khác còn ngưỡng miễn phí ngày.';
        } else {
          errorMessage = 'Bạn đã vượt quá giới hạn dịch miễn phí của AI chung của hệ thống. Vui lòng thử lại sau. Bạn có thể nhập API Key riêng để có thể dùng thoải mái hơn.';
        }
      } else if (checkString.includes('extract') || checkString.includes('fetch') || checkString.includes('could not extract')) {
        errorMessage = 'Không thể đọc nội dung từ liên kết này. Trang web có thể yêu cầu đăng nhập hoặc chặn truy cập. Bạn nên tải nội dung trang web về và up file tải về lên ứng dụng để dịch.';
      } else if (checkString.includes('network') || checkString.includes('failed to fetch')) {
        errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra lại internet của bạn.';
      } else if (checkString.includes('safety') || checkString.includes('blocked')) {
        errorMessage = 'AI từ chối dịch nội dung này do vi phạm chính sách an toàn.';
      } else if (err.message && errorMessage === err.message) {
        errorMessage = `Lỗi: ${err.message}`;
      }

      this.toastService.showToast(errorMessage, 'error');
      this.error.set(errorMessage);
    } finally {
      this.timerService.stopTimer();
      this.isLoading.set(false);
    }
  }

  closeTranslation() {
    this.fullHtmlString.set(null);
    this.translatedHtml.set(null);
    this.rawHtmlString.set('');
    this.translatedTitle.set('');
  }

  downloadHtml() {
    if (!this.rawHtmlString()) return;
    const blob = new Blob([this.rawHtmlString()], { type: 'text/html;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.documentUtil.generateFilename(this.rawHtmlString(), this.url().trim());
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    this.toastService.showToast('Đã tải bản dịch (.html) về máy. Bạn có thể đọc được bài dịch bằng tất cả các trình duyệt phổ thông.', 'success');
  }

  loadHistoryItem(item: TranslationHistoryItem) {
    this.url.set(item.url);
    this.translatedTitle.set(item.title);
    this.rawHtmlString.set(item.rawHtmlString);
    this.fullHtmlString.set(this.sanitizer.bypassSecurityTrustHtml(item.rawHtmlString));
    this.translatedHtml.set(this.sanitizer.bypassSecurityTrustHtml(item.htmlContent));
    this.isHistoryModalOpen.set(false);
    this.toastService.showToast('Đã tải lại bản dịch từ lịch sử', 'success');
  }
}
