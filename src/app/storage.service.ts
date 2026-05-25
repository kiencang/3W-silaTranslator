import {Injectable, signal, inject} from '@angular/core';
import {ToastService} from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private toastService = inject(ToastService);

  favoriteSites = signal<string[]>([]);
  userApiKey = signal('');

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedSites = localStorage.getItem('wpsila_fav_sites');
      if (savedSites) {
        try {
          const parsed = JSON.parse(savedSites);
          if (Array.isArray(parsed)) {
            this.favoriteSites.set(parsed);
          }
        } catch {
          // Ignore parse errors
        }
      }
      const savedKey = localStorage.getItem('user_gemini_api_key');
      if (savedKey) {
        this.userApiKey.set(savedKey);
      }
    }
  }

  saveSites(validSites: string[]) {
    this.favoriteSites.set(validSites);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('wpsila_fav_sites', JSON.stringify(validSites));
    }
    
    if (validSites.length === 0) {
      this.toastService.showToast('Bạn chưa nhập bất cứ website nào.', 'info');
    } else {
      this.toastService.showToast('Đã lưu danh sách website!', 'success');
    }
  }

  saveApiKey(key: string) {
    const trimmedKey = key.trim();
    this.userApiKey.set(trimmedKey);
    if (typeof window !== 'undefined' && window.localStorage) {
      if (trimmedKey) {
        localStorage.setItem('user_gemini_api_key', trimmedKey);
        this.toastService.showToast('Đã lưu API Key riêng của bạn thành công!', 'success');
      } else {
        localStorage.removeItem('user_gemini_api_key');
        this.toastService.showToast('Đã xóa API Key.', 'info');
      }
    }
  }
}
