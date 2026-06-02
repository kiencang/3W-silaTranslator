import { Component, input, output, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-api-key-modal',
  standalone: true,
  imports: [MatIconModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-labelledby="api-modal-title">
      <div class="bg-white w-full max-w-[552px] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 id="api-modal-title" class="text-lg font-bold text-[#1A1A1B] flex items-center gap-2">
            <mat-icon class="text-indigo-600">vpn_key</mat-icon>
            Cấu hình Gemini API Key
          </h3>
          <button (click)="closeModal.emit()" aria-label="Đóng cửa sổ" class="text-gray-400 hover:text-gray-700 bg-transparent border-none cursor-pointer transition-colors w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100">
            <mat-icon class="flex items-center justify-center" style="font-size: 20px; line-height: 20px; width: 20px; height: 20px;">close</mat-icon>
          </button>
        </div>

        <!-- Body -->
        <div class="px-6 py-5 flex flex-col gap-4">
          <div class="text-sm text-gray-600 leading-relaxed space-y-2">
            <div class="flex flex-col gap-2">
              <p>
                Để sử dụng công cụ dịch web này bạn cần khóa API Key của Gemini. Bạn hãy vào link "Nơi lấy API Key Gemini" để thao tác. Bạn chỉ cần tạo Key miễn phí là đủ dùng.
              </p>
              <p>
                Ngoài ra bạn cần remix công cụ này về AI Studio cá nhân để tránh bị quá tải do nhiều người dùng cùng lúc. Tại app này bạn nhìn phía trên bên phải, có nút remix, hãy click vào đó để sao chép ứng dụng về AI Studio của bạn:
              </p>
              <div class="flex justify-center my-2">
                <img src="/remix-3w.png" alt="Hướng dẫn remix" class="max-w-full h-auto rounded border border-gray-200" referrerpolicy="no-referrer" />
              </div>
            </div>
            <p class="flex items-center gap-2 flex-wrap">
              @if (userApiKey()) {
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
                  <span class="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                  Đang dùng API Key của bạn
                </span>
                <span class="text-gray-300">|</span>
              } @else {
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold border border-gray-200">
                  Bạn chưa nhập API Key cho ứng dụng
                </span>
                <span class="text-gray-300">|</span>
              }
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-800 transition-colors font-medium hover:underline text-xs flex items-center gap-0.5">
                <mat-icon style="font-size: 14px; width: 14px; height: 14px; line-height: 14px;">help_outline</mat-icon> Nơi lấy API Key Gemini
              </a>
            </p>
          </div>
          
          <div class="flex flex-col gap-1.5">
            <label for="api-key-input" class="text-xs font-bold text-gray-500 uppercase tracking-wider">Gemini API Key cá nhân</label>
            <div class="relative flex items-center">
              <input [type]="isKeyVisible() ? 'text' : 'password'"
                     id="api-key-input"
                     [(ngModel)]="tempApiKey"
                     placeholder="AIzaSy..."
                     class="w-full bg-gray-50 border border-gray-200 rounded-lg pl-3 pr-10 py-2.5 text-sm text-[#1A1A1B] outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF] transition-all font-mono">
              <button (click)="isKeyVisible.set(!isKeyVisible())" type="button" class="absolute right-2.5 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer flex items-center justify-center p-1">
                <mat-icon style="font-size: 18px; width: 18px; height: 18px; line-height: 18px;">{{ isKeyVisible() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </div>
            <p class="text-[11px] text-gray-400 leading-relaxed italic">
              Khóa API của bạn được lưu <strong>cục bộ tuyệt đối</strong> trong trình duyệt của bạn (\`LocalStorage\`), không lưu trữ trên bất kỳ máy chủ nào khác.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
          <button (click)="saveApiKey.emit('')" [disabled]="!userApiKey()" class="text-xs px-3 py-2 rounded-lg bg-white text-red-600 hover:bg-red-50 transition-colors border border-red-200 cursor-pointer font-medium disabled:opacity-40 disabled:cursor-not-allowed">
            Xóa Key cá nhân
          </button>
          <button (click)="saveApiKey.emit(tempApiKey)" class="bg-[#0066FF] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 hover:shadow-md transition-all cursor-pointer border-none active:scale-95">
            Lưu cấu hình
          </button>
        </div>
      </div>
    </div>
  `
})
export class ApiKeyModalComponent implements OnInit {
  userApiKey = input.required<string>();
  
  closeModal = output<void>();
  saveApiKey = output<string>();

  tempApiKey = '';
  isKeyVisible = signal(false);

  ngOnInit() {
    this.tempApiKey = this.userApiKey();
  }
}
