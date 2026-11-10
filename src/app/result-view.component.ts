import { Component, input, output, computed } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-result-view',
  standalone: true,
  imports: [MatIconModule],
  host: {
    class: 'w-full flex-1 flex flex-col'
  },
  template: `
    <div class="w-full flex-1 flex flex-col bg-white">
      <div class="px-4 md:px-10 border-[#E5E7EB] flex justify-between items-center bg-[#F8F9FA] shrink-0 sticky top-0 z-40 transition-all duration-500 ease-in-out origin-top"
           [class.py-2]="!isZenMode()" [class.md:py-2.5]="!isZenMode()" [class.border-b]="!isZenMode()"
           [class.max-h-[100px]]="!isZenMode()" [class.opacity-100]="!isZenMode()" [class.overflow-visible]="!isZenMode()"
           [class.py-0]="isZenMode()" [class.border-none]="isZenMode()" [class.max-h-0]="isZenMode()" [class.opacity-0]="isZenMode()" [class.overflow-hidden]="isZenMode()">
        <div class="flex items-center gap-3 md:gap-5 flex-1 min-w-0 mr-4">
          <!-- Logo Button with Instant Tooltip -->
          <div class="relative group flex items-center shrink-0">
            <button (click)="closeTranslation.emit()"
                    aria-label="Về trang chủ"
                    class="font-sans font-black text-lg md:text-xl tracking-tight whitespace-nowrap bg-transparent border-none p-0 cursor-pointer transition-all select-none active:scale-95 text-left">
              <span class="text-slate-900">3W</span>&nbsp;<span class="text-indigo-600 transition-opacity group-hover:opacity-80">sila</span><span class="text-rose-600 transition-opacity group-hover:opacity-80">Translator</span>
            </button>

            <!-- Instant Tooltip (same style as Model buttons) -->
            <div class="absolute top-full left-0 mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs leading-relaxed rounded-lg font-medium opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-lg text-left z-50 whitespace-nowrap pointer-events-none">
              Về trang chủ
              <div class="absolute bottom-full left-6 border-4 border-transparent border-b-gray-900"></div>
            </div>
          </div>

          <span class="text-gray-300 select-none shrink-0">|</span>

          <!-- Clickable Truncated URL -->
          @if (safeUrlHref()) {
            <a [href]="safeUrlHref()"
               target="_blank"
               rel="noopener noreferrer"
               [title]="url()"
               class="text-xs md:text-sm font-medium truncate text-gray-500 hover:text-[#0066FF] hover:underline underline-offset-2 transition-colors min-w-0 flex-1">
              {{ url() }}
            </a>
          } @else {
            <span class="text-xs md:text-sm font-medium truncate text-gray-500 min-w-0 flex-1" [title]="url()">
              {{ url() }}
            </span>
          }
        </div>
        <div class="flex items-center gap-2 md:gap-3 shrink-0">
          <!-- Download Button with Instant Tooltip -->
          <div class="relative group flex items-center">
            <button (click)="downloadHtml.emit()"
                    aria-label="Tải bản dịch định dạng HTML về máy"
                    class="bg-[#10B981] text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-medium hover:bg-[#059669] transition-colors whitespace-nowrap flex items-center gap-1.5 md:gap-2 shadow-sm text-sm border-none cursor-pointer active:scale-95">
              <mat-icon class="h-4 w-4 md:h-5 md:w-5 flex items-center justify-center" style="font-size: 20px; line-height: 20px; width: 20px; height: 20px;">file_download</mat-icon>
              <span class="font-semibold">Download</span>
            </button>

            <div class="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs leading-relaxed rounded-lg font-medium opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-lg text-center z-50 whitespace-nowrap pointer-events-none">
              Tải bản dịch về máy.
              <div class="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900"></div>
            </div>
          </div>

          <!-- Fullscreen Button with Instant Tooltip -->
          <div class="relative group flex items-center">
            <button (click)="enableZenMode.emit()"
                    aria-label="Kích hoạt chế độ đọc tĩnh tâm"
                    class="p-1.5 md:p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 bg-white rounded-full transition-colors border border-gray-300 hover:border-indigo-300 cursor-pointer flex items-center justify-center active:scale-95 shadow-sm">
              <mat-icon class="w-6 h-6 md:w-7 md:h-7 flex items-center justify-center" style="font-size: 24px; line-height: 24px; width: 24px; height: 24px;">fullscreen</mat-icon>
            </button>

            <div class="absolute top-full right-0 mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs leading-relaxed rounded-lg font-medium opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-lg text-right z-50 whitespace-nowrap pointer-events-none">
              Mở rộng toàn màn hình.
              <div class="absolute bottom-full right-3 border-4 border-transparent border-b-gray-900"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="flex-1 w-full bg-white transition-all duration-500 ease-in-out">
        <iframe [srcdoc]="fullHtmlString()" title="Nội dung bản dịch tiếng Việt" class="w-full border-none block transition-all duration-500 ease-in-out" 
                [style.height]="isZenMode() ? '100vh' : 'calc(100vh - 96px)'"></iframe>
      </div>
    </div>
  `
})
export class ResultViewComponent {
  isZenMode = input.required<boolean>();
  url = input.required<string>();
  translatedTitle = input<string>('');
  fullHtmlString = input.required<SafeHtml | null>();

  closeTranslation = output<void>();
  enableZenMode = output<void>();
  downloadHtml = output<void>();

  safeUrlHref = computed(() => {
    const raw = this.url().trim();
    if (!raw || raw === 'Nội dung upload') return '';
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    try {
      const parsed = new URL(withProtocol);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.href;
      }
    } catch {
      // Not a valid URL
    }
    return '';
  });
}
