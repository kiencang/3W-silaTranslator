import { Component, input, output } from '@angular/core';
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
      <div class="px-5 border-[#E5E7EB] flex justify-between items-center bg-[#F8F9FA] shrink-0 sticky z-40 transition-all duration-500 ease-in-out origin-top"
           [class.top-[72px]]="!isZenMode()" [class.md:top-[68px]]="!isZenMode()" [class.top-0]="isZenMode()"
           [class.py-2]="!isZenMode()" [class.md:py-2.5]="!isZenMode()" [class.border-b]="!isZenMode()"
           [class.max-h-[100px]]="!isZenMode()" [class.opacity-100]="!isZenMode()" [class.overflow-visible]="!isZenMode()"
           [class.py-0]="isZenMode()" [class.border-none]="isZenMode()" [class.max-h-0]="isZenMode()" [class.opacity-0]="isZenMode()" [class.overflow-hidden]="isZenMode()">
        <div class="flex items-center gap-2 md:gap-3 flex-1 overflow-hidden mr-4">
          <button (click)="closeTranslation.emit()" aria-label="Đóng bản dịch" title="Đóng bản dịch" class="p-1.5 md:p-2 text-gray-500 hover:text-gray-900 bg-gray-200/80 hover:bg-gray-300 rounded-full transition-colors border-none cursor-pointer flex items-center justify-center shrink-0">
            <mat-icon class="h-4 w-4 md:h-5 md:w-5 flex items-center justify-center font-bold" style="font-size: 20px; line-height: 20px; width: 20px; height: 20px;">close</mat-icon>
          </button>
          <h2 class="text-base md:text-lg font-bold truncate text-[#1A1A1B] flex-1 m-0">{{ translatedTitle() }}</h2>
        </div>
        <div class="flex items-center gap-2 md:gap-3 shrink-0">
          <button (click)="enableZenMode.emit()" aria-label="Kích hoạt chế độ đọc tĩnh tâm" title="Mở rộng toàn màn hình" class="p-1.5 md:p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors border-none cursor-pointer flex items-center justify-center active:scale-95 bg-transparent">
            <mat-icon class="w-6 h-6 md:w-7 md:h-7 flex items-center justify-center" style="font-size: 24px; line-height: 24px; width: 24px; height: 24px;">fullscreen</mat-icon>
          </button>
          <button (click)="downloadHtml.emit()" aria-label="Tải bản dịch định dạng HTML về máy" class="bg-[#10B981] text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-medium hover:bg-[#059669] transition-colors whitespace-nowrap flex items-center gap-1.5 md:gap-2 shadow-sm text-sm border-none cursor-pointer active:scale-95">
            <mat-icon class="h-4 w-4 md:h-5 md:w-5 flex items-center justify-center" style="font-size: 20px; line-height: 20px; width: 20px; height: 20px;">file_download</mat-icon>
            <span class="font-semibold">Download</span>
          </button>
        </div>
      </div>
      <div class="flex-1 w-full bg-white transition-all duration-500 ease-in-out">
        <iframe [srcdoc]="fullHtmlString()" title="Nội dung bản dịch tiếng Việt" class="w-full border-none block transition-all duration-500 ease-in-out" 
                [style.height]="isZenMode() ? '100vh' : 'calc(100vh - 140px)'"></iframe>
      </div>
    </div>
  `
})
export class ResultViewComponent {
  isZenMode = input.required<boolean>();
  translatedTitle = input.required<string>();
  fullHtmlString = input.required<SafeHtml | null>();

  closeTranslation = output<void>();
  enableZenMode = output<void>();
  downloadHtml = output<void>();
}
