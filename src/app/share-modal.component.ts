import { Component, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-share-modal',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-labelledby="share-modal-title">
      <div class="bg-white w-full max-w-[480px] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 id="share-modal-title" class="text-lg font-bold text-[#1A1A1B] flex items-center gap-1">Chia sẻ <span class="font-black text-lg tracking-tight"><span class="text-slate-900">3W</span>&nbsp;<span class="text-indigo-600">sila</span><span class="text-rose-600">Translator</span></span></h3>
          <button (click)="closeModal.emit()" aria-label="Đóng cửa sổ chia sẻ" class="text-gray-400 hover:text-gray-700 bg-transparent border-none cursor-pointer transition-colors w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100">
            <mat-icon class="flex items-center justify-center" style="font-size: 20px; line-height: 20px; width: 20px; height: 20px;">close</mat-icon>
          </button>
        </div>

        <!-- Body -->
        <div class="px-6 py-5 flex flex-col gap-4">
          <p class="text-sm text-gray-600 leading-relaxed">
            3W silaTranslator là công cụ miễn phí, dựa trên gói miễn phí mà AI Studio cung cấp, đủ dịch khoảng 20 bài viết / ngày bằng model AI Gemini mới nhất.
          </p>
          
          <div class="flex items-center gap-2 mt-2">
            <input type="text"
                   readonly
                   [value]="'https://aistudio.google.com/apps/4cc7e19e-46dd-4d38-8617-ba38ef1c80c3'"
                   class="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-500 font-mono outline-none cursor-default select-all">
            <button (click)="copyShareLink()" aria-label="Sao chép đường dẫn" class="shrink-0 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-white border-none cursor-pointer"
                    [class.bg-[#0066FF]]="!isCopied()" [class.hover:bg-blue-700]="!isCopied()"
                    [class.bg-[#10B981]]="isCopied()">
              @if (isCopied()) {
                <mat-icon style="font-size: 18px; width: 18px; height: 18px; line-height: 18px;">check</mat-icon>
                <span>Đã copy!</span>
              } @else {
                <mat-icon style="font-size: 18px; width: 18px; height: 18px; line-height: 18px;">content_copy</mat-icon>
                <span>Copy link</span>
              }
            </button>
          </div>
          
          <p class="text-xs text-left text-gray-400 mt-1 italic">
            Bạn có thể copy đường dẫn chia sẻ cho người khác cùng dùng.
          </p>
        </div>
      </div>
    </div>
  `
})
export class ShareModalComponent {
  closeModal = output<void>();
  isCopied = signal(false);

  copyShareLink() {
    navigator.clipboard.writeText('https://aistudio.google.com/apps/4cc7e19e-46dd-4d38-8617-ba38ef1c80c3?showAssistant=true&showPreview=true&fullscreenApplet=true').then(() => {
      this.isCopied.set(true);
      setTimeout(() => this.isCopied.set(false), 2000);
    });
  }
}
