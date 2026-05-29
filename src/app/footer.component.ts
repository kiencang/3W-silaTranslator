import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <footer class="flex-none text-center py-2 md:py-3 text-xs text-gray-500 transition-all duration-500 ease-in-out font-medium"
            [class.border-t]="!isZenMode()" [class.border-[#E5E7EB]]="!isZenMode()"
            [class.max-h-0]="isZenMode()" [class.opacity-0]="isZenMode()" [class.py-0]="isZenMode()" [class.md:py-0]="isZenMode()" [class.overflow-hidden]="isZenMode()" [class.border-none]="isZenMode()"
            [class.max-h-[100px]]="!isZenMode()" [class.opacity-100]="!isZenMode()">
      <div class="max-w-[1240px] mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <button (click)="openHistory.emit()" aria-label="Lịch sử dịch" [disabled]="isLoading() || isSearchLoading()" class="inline-flex items-center justify-center gap-1.5 text-gray-600 bg-white border border-gray-200 transition-all font-medium cursor-pointer px-3 py-1 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100" [class.hover:text-[#0066FF]]="!isLoading() && !isSearchLoading()" [class.hover:border-[#0066FF]]="!isLoading() && !isSearchLoading()" [class.hover:bg-blue-50]="!isLoading() && !isSearchLoading()">
            <mat-icon style="font-size: 16px; width: 16px; height: 16px; line-height: 16px;">history</mat-icon>
            <span>History</span>
          </button>
          <button (click)="openShare.emit()" aria-label="Chia sẻ công cụ" class="inline-flex items-center justify-center gap-1.5 text-gray-600 hover:text-[#0066FF] bg-white border border-gray-200 hover:border-[#0066FF] hover:bg-blue-50 transition-all font-medium cursor-pointer px-3 py-1 rounded-lg shadow-sm">
            <mat-icon style="font-size: 16px; width: 16px; height: 16px; line-height: 16px;">share</mat-icon>
            <span>Share</span>
          </button>
        </div>
        <div class="leading-relaxed text-gray-400 text-[11px] truncate mx-auto md:mx-0">
          v1.0.44 &bull; <a href="https://github.com/kiencang/3W-silaTranslator" target="_blank" rel="noopener noreferrer" class="text-gray-600 hover:text-[#0066FF] transition-colors underline underline-offset-2">GitHub</a> &bull; Chỉ dùng cho mục đích cá nhân &bull; Nguyễn Đức Anh &bull; contact@wpsila.com &bull; 
          <a href="https://web-translator.wpsila.com/" target="_blank" rel="noopener noreferrer" class="text-gray-600 hover:text-[#0066FF] transition-colors underline underline-offset-2">Hướng dẫn sử dụng</a>
        </div>

        <!-- +Search Grounding at the far right -->
        <div class="flex items-center justify-end shrink-0">
          <div class="relative group flex items-center justify-center">
            <button (click)="toggleSearchGrounding.emit(!useSearchGrounding())"
                    aria-label="Tính năng tra cứu Google Search"
                    [disabled]="isLoading() || isSearchLoading()"
                    class="flex items-center gap-1.5 p-1 transition-all border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-transparent">
              
              <div class="relative inline-flex h-3.5 w-7 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none"
                   [class.bg-blue-600]="useSearchGrounding()"
                   [class.bg-gray-300]="!useSearchGrounding()">
                <span class="pointer-events-none inline-block h-2.5 w-2.5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out absolute left-[2px]"
                      [style.transform]="useSearchGrounding() ? 'translateX(14px)' : 'translateX(0)'"></span>
              </div>
              
              <span class="text-[11px] font-bold transition-colors tracking-wide"
                    [class.text-blue-600]="useSearchGrounding()"
                    [class.text-gray-500]="!useSearchGrounding()">SEARCH Grounding</span>
            </button>
            
            <!-- Tooltip above button for footer -->
            <div class="absolute bottom-full mb-2 w-72 px-3 py-2 bg-gray-900 text-white text-xs leading-relaxed rounded-lg font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg text-center right-0">
              <strong [class.text-blue-400]="useSearchGrounding()" [class.text-gray-400]="!useSearchGrounding()">[{{ useSearchGrounding() ? 'Đang Bật' : 'Đang Tắt' }}]</strong> Bổ sung công cụ tìm kiếm cho AI trong quá trình dịch, sẽ tốn token/thời gian hơn. Chỉ nên bật với bài có tính học thuật cao hoặc thời sự cần cập nhật thời gian thực. Tính năng này có thể bị hạn chế với tài khoản miễn phí.
              <div class="absolute top-full right-4 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  `
})
export class FooterComponent {
  isZenMode = input.required<boolean>();
  isLoading = input.required<boolean>();
  isSearchLoading = input.required<boolean>();
  useSearchGrounding = input.required<boolean>();

  openHistory = output<void>();
  openShare = output<void>();
  toggleSearchGrounding = output<boolean>();
}
