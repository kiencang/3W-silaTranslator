import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatIconModule, FormsModule],
  template: `
    <header class="flex-none bg-white/90 backdrop-blur-md sticky top-0 z-50 px-4 md:px-10 transition-all duration-500 ease-in-out origin-top border-[#E5E7EB]"
            [class.py-2]="!isZenMode()" [class.border-b]="!isZenMode()"
            [class.max-h-[200px]]="!isZenMode()" [class.opacity-100]="!isZenMode()" [class.overflow-visible]="!isZenMode()"
            [class.max-h-0]="isZenMode()" [class.opacity-0]="isZenMode()" [class.py-0]="isZenMode()" [class.border-none]="isZenMode()" [class.overflow-hidden]="isZenMode()">
      <div class="max-w-[1240px] mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 md:gap-8">
        
        <!-- Logo & Temperature Block -->
        <div class="flex flex-col items-center md:items-start justify-center gap-1.5 md:gap-2">
          <!-- Logo -->
          <div class="font-sans font-black text-lg md:text-xl tracking-tight whitespace-nowrap cursor-default select-none">
            <span class="text-slate-900">3W</span>&nbsp;<span class="text-indigo-600">sila</span><span class="text-rose-600">Translator</span>
          </div>
          
          <!-- Controls: API Key -->
          <div class="flex flex-row gap-4 items-center">
            <!-- +API Key Config -->
            <div class="relative group flex items-center justify-center">
              <button (click)="openApiKeyModal.emit()"
                      aria-label="Cài đặt khóa API cá nhân"
                      [disabled]="isLoading() || isSearchLoading()"
                      class="flex items-center gap-1.5 p-0 transition-all border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-transparent">
                <mat-icon style="font-size: 16px; width: 16px; height: 16px; line-height: 16px; color: #B87333;">vpn_key</mat-icon>
                <span class="text-[11px] font-bold transition-colors tracking-wide"
                      [class.text-indigo-600]="userApiKey()"
                      [class.text-gray-400]="!userApiKey()">
                      {{ userApiKey() ? 'Đang dùng API Key của bạn' : 'Key hệ thống' }}
                </span>
              </button>
              
              <!-- Tooltip -->
              <div class="absolute top-full mt-2 w-64 px-3 py-2 bg-gray-900 text-white text-xs leading-relaxed rounded-lg font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg text-center left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0">
                <strong [class.text-indigo-400]="userApiKey()">{{ userApiKey() ? 'Khóa cá nhân đang kích hoạt' : 'Khóa hệ thống mặc định' }}</strong>. Bấm để tự nhập khóa Gemini API Key miễn phí của bạn giúp quá trình dịch ổn định hơn.
                <div class="absolute bottom-full left-1/2 -translate-x-1/2 md:left-4 md:translate-x-0 border-4 border-transparent border-b-gray-900"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Model Selection -->
        <div class="flex items-center justify-center">
          <div class="flex items-center bg-gray-100/80 p-0.5 rounded-full shadow-inner border border-gray-200">
            <!-- Pro Model Button -->
            <button 
              (click)="selectedModelChange.emit('gemini-pro-latest')"
              [disabled]="isLoading() || isSearchLoading()"
              class="group relative flex items-center justify-center px-4 py-1 rounded-full transition-all duration-300 border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              [class.bg-white]="selectedModel() === 'gemini-pro-latest'"
              [class.shadow-sm]="selectedModel() === 'gemini-pro-latest'"
              [class.text-indigo-600]="selectedModel() === 'gemini-pro-latest'"
              [class.bg-transparent]="selectedModel() !== 'gemini-pro-latest'"
              [class.text-gray-400]="selectedModel() !== 'gemini-pro-latest'"
              [class.hover:text-gray-600]="selectedModel() !== 'gemini-pro-latest' && !isLoading() && !isSearchLoading()"
              aria-label="Chọn model Gemini Pro (Dịch chất lượng cao)">
              <mat-icon style="font-size: 20px; width: 20px; height: 20px; line-height: 20px;">psychology</mat-icon>
              
              <!-- Tooltip -->
              <div class="absolute top-full mt-2 w-48 px-3 py-2 bg-gray-900 text-white text-xs leading-relaxed rounded-lg font-medium opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-lg text-center z-10">
                <strong class="text-indigo-400">Gemini Pro</strong><br/>
                Khuyên dùng. Nhấn mạnh vào chất lượng bản dịch.
                <div class="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900"></div>
              </div>
            </button>

            <!-- Flash Model Button -->
            <button 
              (click)="selectedModelChange.emit('gemini-flash-latest')"
              [disabled]="isLoading() || isSearchLoading()"
              class="group relative flex items-center justify-center px-4 py-1 rounded-full transition-all duration-300 border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              [class.bg-white]="selectedModel() === 'gemini-flash-latest'"
              [class.shadow-sm]="selectedModel() === 'gemini-flash-latest'"
              [class.text-amber-500]="selectedModel() === 'gemini-flash-latest'"
              [class.bg-transparent]="selectedModel() !== 'gemini-flash-latest'"
              [class.text-gray-400]="selectedModel() !== 'gemini-flash-latest'"
              [class.hover:text-gray-600]="selectedModel() !== 'gemini-flash-latest' && !isLoading() && !isSearchLoading()"
              aria-label="Chọn model Gemini Flash (Dịch cực nhanh)">
              <mat-icon style="font-size: 20px; width: 20px; height: 20px; line-height: 20px;">bolt</mat-icon>
              
               <!-- Tooltip -->
               <div class="absolute top-full mt-2 w-48 px-3 py-2 bg-gray-900 text-white text-xs leading-relaxed rounded-lg font-medium opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-lg text-center z-10">
                <strong class="text-amber-400">Gemini Flash</strong><br/>
                Tốc độ dịch cực nhanh. Phù hợp báo chí cơ bản.
                <div class="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900"></div>
              </div>
            </button>
          </div>
        </div>

        <!-- Search Bar Block -->
        <div class="flex-1 w-full max-w-full md:max-w-[480px] lg:max-w-[600px] xl:max-w-[840px] bg-[#F3F4F6] p-1.5 md:rounded-full rounded-2xl border border-transparent focus-within:border-[#E5E7EB] focus-within:bg-white focus-within:shadow-sm flex flex-col md:flex-row items-stretch md:items-center transition-all gap-1.5 md:gap-0 mx-auto md:mx-0">
          <div class="flex-1 flex items-center min-w-0 px-2 md:px-3">
            @if (uploadedHtmlFile()) {
              <div class="hidden md:flex items-center bg-gray-200/60 border border-gray-200 rounded-md px-2 py-1 gap-1.5 mr-2 shrink-0 shadow-sm animate-in fade-in zoom-in duration-200">
                <span class="text-[13px] text-gray-700 font-medium truncate max-w-[80px] md:max-w-[130px]" [title]="uploadedHtmlFile()?.name">📄 {{ uploadedHtmlFile()?.name }}</span>
                <button (click)="removeUploadedFile.emit()" aria-label="Xóa file đã tải lên" [disabled]="isLoading()" class="bg-transparent border-none flex items-center justify-center p-0.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed" [class.text-gray-400]="!isLoading()" [class.hover:text-red-500]="!isLoading()" [class.cursor-pointer]="!isLoading()" title="Xóa file">
                  <mat-icon class="h-3.5 w-3.5 flex items-center justify-center" style="font-size: 14px; line-height: 14px; width: 14px; height: 14px;">close</mat-icon>
                </button>
              </div>
            }
            <!-- ngModel implementation note: we can't easily 2-way bind an input signal back to parent without changing how inputs work, 
                 so we use local get/set or just bind to url value and output change -->
            <input 
              type="text" 
              [ngModel]="url()"
              (ngModelChange)="urlChange.emit($event)"
              aria-label="Nhập đường dẫn website cần dịch"
              (keyup.enter)="translate.emit()"
              [readonly]="isLoading()"
              class="flex-1 border-none py-2 md:py-2.5 text-sm md:text-base outline-none bg-transparent w-full placeholder:text-gray-500 min-w-[50px] truncate" 
              [placeholder]="uploadedHtmlFile() ? 'Dán URL gốc của website vào đây...' : 'Dán link website tại đây...'">

            @if (url()) {
              <button (click)="urlChange.emit('')" 
                      [disabled]="isLoading()"
                      aria-label="Xóa đường dẫn" 
                      class="text-gray-400 bg-transparent border-none flex items-center justify-center p-1.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed mx-1 shrink-0"
                      [class.hover:bg-gray-200]="!isLoading()"
                      [class.hover:text-gray-600]="!isLoading()"
                      [class.cursor-pointer]="!isLoading()">
                <mat-icon class="h-4 w-4 flex items-center justify-center" style="font-size: 18px; line-height: 18px; width: 18px; height: 18px;">close</mat-icon>
              </button>
            }

            <label class="flex shrink-0 relative group p-2 items-center justify-center transition-all"
                   [class.active:scale-95]="!isLoading()"
                   [class.cursor-pointer]="!isLoading()"
                   [class.text-gray-400]="!isLoading()"
                   [class.hover:text-gray-600]="!isLoading()"
                   [class.opacity-40]="isLoading()"
                   [class.cursor-not-allowed]="isLoading()">
              <input type="file" aria-label="Tải lên file tài liệu định dạng HTML" accept=".html,.htm" class="hidden" (change)="fileSelected.emit($event)" [disabled]="isLoading()">
              <mat-icon class="w-5 h-5 flex items-center justify-center -rotate-45 block" style="font-size: 20px; line-height: 20px; width: 20px; height: 20px; display: block;">attach_file</mat-icon>
              <!-- Custom Tooltip -->
              <div class="absolute top-full right-0 md:left-1/2 md:-translate-x-1/2 mt-2 w-[280px] md:w-[320px] bg-[#1A1A1B] text-white text-[11px] md:text-xs leading-relaxed p-2.5 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 delay-500 z-50 pointer-events-none text-center font-medium">
                Tải lên file bài viết (.html) nếu ứng dụng bị chặn không thể lấy được nội dung hoặc yêu cầu đăng nhập. (Nhấn Ctrl+S/Cmd+S tại trang gốc để lưu, chọn 'HTML only/chỉ HTML')
                <div class="absolute bottom-full right-2 md:right-auto md:left-1/2 md:-translate-x-1/2 -mb-[1px] border-4 border-transparent border-b-[#1A1A1B]"></div>
              </div>
            </label>
          </div>
          
          <div class="flex items-center justify-end px-2 md:px-0">
            <button 
              (click)="translate.emit()"
              [disabled]="isLoading() || !isValidUrlInput()"
              [class.bg-[#0066FF]]="!uploadedHtmlFile()"
              [class.hover:bg-blue-700]="!uploadedHtmlFile()"
              [class.bg-[#8B5CF6]]="uploadedHtmlFile()"
              [class.hover:bg-[#7C3AED]]="uploadedHtmlFile()"
              [class.shadow-[0_0_15px_rgba(0,102,255,0.6)]]="isValidUrlInput() && !isLoading() && !uploadedHtmlFile() && !fullHtmlString()"
              [class.shadow-[0_0_15px_rgba(139,92,246,0.6)]]="isValidUrlInput() && !isLoading() && uploadedHtmlFile() && !fullHtmlString()"
              class="w-full md:w-auto text-white border-none py-2 md:py-2.5 px-6 md:px-8 md:rounded-full rounded-xl font-semibold text-sm md:text-base cursor-pointer transition-all duration-300 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ml-1"
              [class.active:scale-95]="!isLoading() && isValidUrlInput()"
              [attr.aria-label]="uploadedHtmlFile() ? 'Dịch từ file HTML đã chọn' : 'Bắt đầu dịch đường dẫn website'">
              @if (isLoading()) {
                <div class="flex items-center justify-center gap-2">
                  <mat-icon class="animate-spin text-white flex items-center justify-center h-4 w-4" style="font-size: 16px; line-height: 16px; width: 16px; height: 16px;">autorenew</mat-icon>
                  <span>Đang dịch...</span>
                </div>
              } @else {
                <div class="flex items-center justify-center gap-2">
                  @if (uploadedHtmlFile()) {
                    <mat-icon style="font-size: 20px; width: 20px; height: 20px; line-height: 20px;">description</mat-icon>
                    <span>Dịch File</span>
                  } @else {
                    <mat-icon style="font-size: 20px; width: 20px; height: 20px; line-height: 20px;">public</mat-icon>
                    <span>Dịch Web</span>
                  }
                </div>
              }
            </button>
          </div>
        </div>
      </div>
    </header>
  `
})
export class HeaderComponent {
  isZenMode = input.required<boolean>();
  userApiKey = input.required<string>();
  isLoading = input.required<boolean>();
  isSearchLoading = input.required<boolean>();
  selectedModel = input.required<'gemini-pro-latest' | 'gemini-flash-latest'>();
  uploadedHtmlFile = input.required<File | null>();
  url = input.required<string>();
  isValidUrlInput = input.required<boolean>();
  fullHtmlString = input.required<unknown>();

  openApiKeyModal = output<void>();
  selectedModelChange = output<'gemini-pro-latest' | 'gemini-flash-latest'>();
  urlChange = output<string>();
  removeUploadedFile = output<void>();
  fileSelected = output<Event>();
  translate = output<void>();
}
