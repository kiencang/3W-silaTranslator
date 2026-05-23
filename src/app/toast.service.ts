import {Injectable, signal} from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  timeoutId?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastIdCounter = 0;
  toasts = signal<Toast[]>([]);

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
}
