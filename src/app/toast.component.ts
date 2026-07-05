import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {ToastService} from './toast.service';

@Component({
  selector: 'app-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <!-- Toast Notifications Container -->
    <div class="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium min-w-[280px] max-w-[420px] animate-toast-slide-in relative group"
             [attr.role]="toast.type === 'error' ? 'alert' : 'status'"
             [attr.aria-live]="toast.type === 'error' ? 'assertive' : 'polite'"
             [class.bg-[#10B981]]="toast.type === 'success'"
             [class.bg-[#EF4444]]="toast.type === 'error'"
             [class.bg-[#3B82F6]]="toast.type === 'info'">
          @if (toast.type === 'success') {
            <div class="w-3 h-3 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)] shrink-0 mt-1"></div>
          } @else if (toast.type === 'error') {
            <div class="w-3 h-3 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)] shrink-0 animate-pulse mt-1"></div>
          } @else {
            <div class="w-3 h-3 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)] shrink-0 mt-1"></div>
          }
          <div class="flex-1 leading-relaxed pr-6">{{ toast.message }}</div>
          
          <!-- Close Button -->
          <button (click)="toastService.removeToast(toast.id)" aria-label="Đóng thông báo" class="absolute right-2 top-1/2 -translate-y-1/2 shrink-0 w-6 h-6 rounded-full opacity-60 hover:opacity-100 hover:bg-white/20 transition-all cursor-pointer border-none bg-transparent text-white flex justify-center items-center">
            <mat-icon class="flex items-center justify-center h-4 w-4" style="font-size: 16px; line-height: 16px; width: 16px; height: 16px;">close</mat-icon>
          </button>
        </div>
      }
    </div>
  `
})
export class ToastComponent {
  toastService = inject(ToastService);
}
