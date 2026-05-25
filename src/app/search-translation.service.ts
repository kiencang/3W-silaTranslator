import {Injectable, signal, inject} from '@angular/core';
import {TranslationApiService} from './translation-api.service';
import {ToastService} from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class SearchTranslationService {
  private translationApi = inject(TranslationApiService);
  private toastService = inject(ToastService);

  searchQuery = signal('');
  translatedSearchQuery = signal('');
  isSearchLoading = signal(false);

  setSearchQuery(query: string) {
    this.searchQuery.set(query);
    this.translatedSearchQuery.set('');
  }

  onSearchLinkClick() {
    setTimeout(() => {
      this.translatedSearchQuery.set('');
      this.searchQuery.set('');
    }, 100);
  }

  async translateSearchQuery(userApiKey: string) {
    const query = this.searchQuery().trim();
    
    // Validate input
    if (!query) {
      this.toastService.showToast('Vui lòng nhập từ khóa bạn muốn tìm kiếm.', 'error');
      return;
    }
    
    if (query.length > 300) {
      this.toastService.showToast('Từ khóa quá dài. Vui lòng nhập ngắn gọn để Google tìm kiếm chính xác nhất.', 'error');
      return;
    }

    const urlPattern = /^(https?:\/\/|www\.)|(\.[a-z]{2,}(\/|$))/i;
    if (urlPattern.test(query)) {
      this.toastService.showToast('Đây là khu vực dịch từ khóa để tìm kiếm, nếu bạn muốn dịch web thì sử dụng tính năng ở phần đầu trang [chỗ có nút "Dịch Web"].', 'info');
      return;
    }

    this.isSearchLoading.set(true);

    try {
      const response = await this.translationApi.translateSearchQuery(query, userApiKey);
      const translatedQuery = response.translatedQuery || '';
      
      if (!translatedQuery) {
        this.toastService.showToast('Có chút trục trặc khi trích xuất kết quả. Vui lòng thử lại từ khóa khác.', 'error');
        return;
      }

      this.translatedSearchQuery.set(translatedQuery);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      let errorMessage = 'Có lỗi xảy ra trong quá trình dịch. Vui lòng thử lại.';
      
      if (err.error && err.error.error) {
        errorMessage = err.error.error;
      } else if (err.message) {
        errorMessage = err.message;
      }

      if (!errorMessage.includes('Chưa cấu hình API Key')) {
        console.error('Search Translation error:', err);
      }
      
      const errString = err.toString().toLowerCase();

      const checkString = errorMessage.toLowerCase() + ' ' + errString;

      if (checkString.includes('api key not valid') || checkString.includes('api_key_invalid') || (checkString.includes('api key') && checkString.includes('not valid'))) {
        errorMessage = 'API Key không hợp lệ. Vui lòng kiểm tra lại khóa API ở phần thiết lập API Key cá nhân, khả năng cao là bạn nhập nhầm.';
      } else if (checkString.includes('parsing') || checkString.includes('http failure during parsing')) {
        errorMessage = 'Yêu cầu bị gián đoạn do máy chủ phản hồi chậm hoặc đang khởi động lại (Cold Start). Vui lòng nhấn "Dịch Từ Khóa" một lần nữa nhé!';
      } else if (checkString.includes('429') || checkString.includes('quota') || checkString.includes('exhausted')) {
        if (userApiKey) {
          errorMessage = 'API bạn nhập đã hết ngưỡng miễn phí. Hãy quay lại sử dụng sau hoặc nhập API khác còn ngưỡng miễn phí ngày.';
        } else {
          errorMessage = 'Bạn đã vượt quá giới hạn dịch miễn phí của AI chung của hệ thống. Vui lòng thử lại sau. Bạn có thể nhập API Key riêng để có thể dùng thoải mái hơn.';
        }
      } else if (checkString.includes('network') || checkString.includes('failed to fetch')) {
        errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra lại internet của bạn.';
      } else if (checkString.includes('safety') || checkString.includes('blocked')) {
        errorMessage = 'Từ khóa bị AI từ chối dịch do vi phạm chính sách an toàn.';
      } else if (err.message && errorMessage === err.message) {
        errorMessage = `Lỗi: ${err.message}`;
      }

      this.toastService.showToast(errorMessage, 'error');
    } finally {
      this.isSearchLoading.set(false);
    }
  }
}
