import { Component, inject, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { HistoryService, TranslationHistoryItem } from './history.service';

@Component({
  selector: 'app-history-modal',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-labelledby="history-modal-title">
      <div class="bg-white w-full max-w-[600px] max-h-[85vh] rounded-2xl shadow-2xl flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div class="flex items-center gap-3">
            <h3 id="history-modal-title" class="text-lg font-bold text-[#1A1A1B]">Lịch sử dịch</h3>
            @if (historyItems().length > 0) {
              <button (click)="deleteAllHistory()" class="text-xs px-2 py-1.5 rounded-lg bg-white text-red-600 hover:bg-red-50 transition-colors border border-red-200 cursor-pointer flex items-center gap-1 font-medium shadow-sm">
                @if (confirmDeleteAll()) {
                  <span>Xác nhận xóa hết?</span>
                } @else {
                  <mat-icon style="font-size: 14px; width: 14px; height: 14px; line-height: 14px;">delete_sweep</mat-icon>
                  <span>Xóa tất cả</span>
                }
              </button>
            }
          </div>
          <button (click)="closeModal.emit()" aria-label="Đóng cửa sổ lịch sử" class="text-gray-400 hover:text-gray-700 bg-transparent border-none cursor-pointer transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <mat-icon class="flex items-center justify-center" style="font-size: 20px; line-height: 20px; width: 20px; height: 20px;">close</mat-icon>
          </button>
        </div>

        <!-- Warning block -->
        <div class="px-6 py-3 bg-amber-50 shrink-0 border-b border-amber-100">
          <p class="text-[13px] text-amber-800 leading-relaxed m-0 flex gap-2">
            <mat-icon style="font-size: 18px; width: 18px; height: 18px; line-height: 18px; margin-top: 2px" class="shrink-0 text-amber-600">warning_amber</mat-icon>
            <span>Danh sách 10 bài viết gần nhất bạn dịch, được <strong>lưu cục bộ</strong> trên <strong>trình duyệt đang dùng</strong> để tiện xem lại. Hãy chủ động "Tải bản dịch" để lưu trữ lâu dài, danh sách này có thể bị mất nếu bạn xóa dữ liệu web.</span>
          </p>
        </div>

        <!-- Body -->
        <div class="px-2 py-2 overflow-y-auto flex-1">
          @if (historyItems().length === 0) {
            <div class="text-center py-12 text-gray-500">
              <mat-icon style="font-size: 48px; width: 48px; height: 48px; line-height: 48px; margin-bottom: 8px" class="opacity-20 text-gray-400">history</mat-icon>
              <p class="mt-2 text-sm text-gray-500 font-medium">Chưa có lịch sử dịch nào.</p>
            </div>
          } @else {
            <div class="flex flex-col gap-1">
              @for (item of historyItems(); track item.id) {
                <div tabindex="0" (keyup.enter)="loadHistoryItem(item)" class="group flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-gray-200" (click)="loadHistoryItem(item)">
                  <div class="flex-1 min-w-0 pr-4">
                    <h4 class="text-[15px] font-semibold text-gray-900 truncate mb-1" [title]="item.title">{{ item.title }}</h4>
                    <div class="flex items-center gap-2 text-xs text-gray-500 font-medium">
                      <span class="truncate max-w-[200px]" [title]="item.url">{{ item.url }}</span>
                      <span class="shrink-0 opacity-40">&bull;</span>
                      <span class="shrink-0 flex items-center gap-1"><mat-icon style="font-size: 11px; width: 11px; height: 11px; line-height: 11px;">schedule</mat-icon>{{ formatTimestamp(item.timestamp) }}</span>
                    </div>
                  </div>
                  <div class="shrink-0">
                    <button (click)="deleteHistoryItem(item.id!, $event)" class="px-2 py-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100 bg-transparent cursor-pointer flex items-center justify-center relative overflow-hidden" [class.bg-red-50]="confirmDeleteId() === item.id!" [class.text-red-600]="confirmDeleteId() === item.id!" [class.border-red-200]="confirmDeleteId() === item.id!">
                      @if (confirmDeleteId() === item.id!) {
                        <span class="text-[11px] font-bold px-1 uppercase tracking-wide">Xóa?</span>
                      } @else {
                        <mat-icon style="font-size: 20px; width: 20px; height: 20px; line-height: 20px;">delete_outline</mat-icon>
                      }
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class HistoryModalComponent {
  private historyService = inject(HistoryService);

  closeModal = output<void>();
  loadHistory = output<TranslationHistoryItem>();

  historyItems = this.historyService.historyItems;
  confirmDeleteId = signal<number | null>(null);
  confirmDeleteAll = signal(false);

  loadHistoryItem(item: TranslationHistoryItem) {
    this.closeModal.emit();
    this.loadHistory.emit(item);
  }

  deleteHistoryItem(id: number, event: Event) {
    event.stopPropagation();
    
    if (this.confirmDeleteId() === id) {
      this.historyService.deleteHistory(id);
      this.confirmDeleteId.set(null);
    } else {
      this.confirmDeleteId.set(id);
      setTimeout(() => {
        if (this.confirmDeleteId() === id) {
          this.confirmDeleteId.set(null);
        }
      }, 3000);
    }
  }

  deleteAllHistory() {
    if (this.confirmDeleteAll()) {
      this.historyService.clearAllHistory();
      this.confirmDeleteAll.set(false);
    } else {
      this.confirmDeleteAll.set(true);
      setTimeout(() => {
        this.confirmDeleteAll.set(false);
      }, 3000);
    }
  }

  formatTimestamp(ts: number): string {
    const d = new Date(ts);
    const now = new Date();
    
    // Nếu hôm nay
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }
    
    // Nếu hôm qua
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
      return 'Hôm qua ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }
    
    // Cũ hơn
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) + ' ' + 
           d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }
}
