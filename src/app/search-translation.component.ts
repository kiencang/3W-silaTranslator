import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-search-translation',
  standalone: true,
  imports: [MatIconModule, FormsModule],
  host: {
    class: 'w-full block'
  },
  template: `
    <div class="w-full flex-col flex gap-0 px-4 relative">
      <div class="text-center space-y-2 mb-2 relative z-10 mt-8">
        <h1 class="text-3xl md:text-4xl font-extrabold text-[#1A1A1B] tracking-tight">Dịch Từ Khóa Google</h1>
        <p class="text-gray-500 text-sm md:text-base font-medium max-w-md mx-auto">Nhập từ khóa tiếng Việt, chúng tôi sẽ giúp bạn tìm kiếm các bài viết tiếng Anh!</p>
      </div>

      <div class="w-full max-w-3xl mx-auto bg-white p-2 border border-gray-200 shadow-sm sm:rounded-full rounded-2xl flex flex-col sm:flex-row items-stretch focus-within:ring-4 focus-within:ring-gray-100 focus-within:border-gray-300 transition-all relative z-30">
        <div class="flex-1 flex items-center px-4 py-3 sm:py-0">
          <mat-icon class="text-gray-400 shrink-0 flex items-center justify-center h-5 w-5" style="font-size: 20px; line-height: 20px; width: 20px; height: 20px;">search</mat-icon>
          <input 
            type="text" 
            [ngModel]="searchQuery()"
            (ngModelChange)="onSearchQueryChange($event)"
            aria-label="Nhập từ khóa tiếng Việt để tìm kiếm bài viết nước ngoài"
            (keyup.enter)="translateSearch.emit()"
            class="flex-1 w-full ml-3 border-none outline-none text-lg bg-transparent text-[#1A1A1B] placeholder:text-gray-400" 
            placeholder="VD: văn hóa làm việc tại Nhật Bản có gì thú vị..." />
        </div>
        <button 
          (click)="translateSearch.emit()"
          aria-label="Dịch từ khóa và tìm kiếm"
          [disabled]="isSearchLoading() || !searchQuery()"
          class="mt-2 sm:mt-0 w-full sm:w-auto bg-[#1A1A1B] text-white border-none py-2.5 px-6 sm:rounded-full rounded-xl font-semibold text-sm md:text-base cursor-pointer hover:bg-black hover:shadow-md transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          [class.active:scale-95]="!isSearchLoading() && searchQuery()">
          @if (isSearchLoading()) {
            <div class="flex items-center justify-center gap-2">
              <mat-icon class="animate-spin text-white flex items-center justify-center h-4 w-4" style="font-size: 16px; line-height: 16px; width: 16px; height: 16px;">autorenew</mat-icon>
              <span>Đang dịch...</span>
            </div>
          } @else {
            <div class="flex items-center justify-center gap-2">
              <mat-icon style="font-size: 20px; width: 20px; height: 20px; line-height: 20px;">translate</mat-icon>
              <span>Dịch Từ Khóa</span>
            </div>
          }
        </button>
        
        @if (translatedSearchQuery()) {
          <div class="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-gray-200 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.15)] rounded-xl p-1 z-50 animate-in slide-in-from-top-2 fade-in duration-200">
            <a 
              [href]="'https://www.google.com/search?q=' + translatedSearchQuery()" 
              target="_blank"
              rel="noopener noreferrer"
              (click)="searchLinkClick.emit()"
              class="flex items-center justify-between w-full p-3 hover:bg-indigo-50/80 rounded-lg group transition-colors no-underline">
              <div class="flex items-center gap-3 overflow-hidden">
                <div class="w-9 h-9 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-full shrink-0">
                  <mat-icon class="flex items-center justify-center font-bold h-5 w-5" style="font-size: 20px; line-height: 20px; width: 20px; height: 20px;">search</mat-icon>
                </div>
                <div class="flex flex-col overflow-hidden text-left">
                  <span class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Kết quả dịch tiếng Anh</span>
                  <span class="font-medium text-lg text-[#1A1A1B] truncate">{{ translatedSearchQuery() }}</span>
                </div>
              </div>
              <div class="text-indigo-600 shrink-0 flex items-center gap-1.5 text-sm font-semibold bg-white shadow-sm border border-indigo-100 px-3 py-1.5 rounded-md transition-shadow group-hover:shadow-md">
                Click để mở tab mới
                <mat-icon class="flex items-center justify-center h-4 w-4" style="font-size: 16px; line-height: 16px; width: 16px; height: 16px;">open_in_new</mat-icon>
              </div>
            </a>
          </div>
        }
      </div>
    </div>
  `
})
export class SearchTranslationComponent {
  searchQuery = input.required<string>();
  translatedSearchQuery = input.required<string>();
  isSearchLoading = input.required<boolean>();

  searchQueryChange = output<string>();
  translatedSearchQueryChange = output<string>();
  translateSearch = output<void>();
  searchLinkClick = output<void>();

  onSearchQueryChange(newQuery: string) {
    this.searchQueryChange.emit(newQuery);
    this.translatedSearchQueryChange.emit('');
  }
}
