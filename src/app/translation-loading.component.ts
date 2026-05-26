import { Component, input } from '@angular/core';

@Component({
  selector: 'app-translation-loading',
  standalone: true,
  host: {
    class: 'w-full max-w-[1000px] flex-none my-auto'
  },
  template: `
    <div class="w-full relative bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden p-6 md:p-10 min-h-[300px]">
      <!-- Skeleton Article (Background) -->
      <div class="animate-pulse opacity-50 select-none">
        <!-- Title -->
        <div class="h-10 bg-[#E5E7EB] rounded-xl w-3/4 mb-4"></div>
        <!-- Meta / Date -->
        <div class="h-4 bg-[#E5E7EB] rounded-md w-1/4 mb-5"></div>
        
        <!-- Paragraphs -->
        <div class="space-y-4 mb-4">
          <div class="h-4 bg-[#E5E7EB] rounded-md w-full"></div>
          <div class="h-4 bg-[#E5E7EB] rounded-md w-[95%]"></div>
          <div class="h-4 bg-[#E5E7EB] rounded-md w-[85%]"></div>
        </div>
        
        <div class="space-y-4">
          <div class="h-4 bg-[#E5E7EB] rounded-md w-[90%]"></div>
          <div class="h-4 bg-[#E5E7EB] rounded-md w-full"></div>
          <div class="h-4 bg-[#E5E7EB] rounded-md w-[80%]"></div>
        </div>
      </div>

      <!-- Timer Overlay (Foreground) -->
      <div class="absolute inset-0 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[2px]">
        <div class="text-4xl md:text-5xl font-mono font-bold text-[#0066FF] tracking-widest mb-4 drop-shadow-sm">
          {{ formattedTime() }}
        </div>
        <p class="text-[#1A1A1B] font-medium text-sm md:text-base px-6 py-3 bg-white/90 rounded-full shadow-lg border border-gray-100/50">
          AI đang phân tích và dịch nội dung. Vui lòng đợi 2 - 5 phút...
        </p>
      </div>
    </div>
  `
})
export class TranslationLoadingComponent {
  formattedTime = input.required<string>();
}
