import { Component, input, output, signal, OnInit, ElementRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

interface SiteInput {
  id: number;
  url: string;
}

@Component({
  selector: 'app-sites-modal',
  standalone: true,
  imports: [MatIconModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 id="modal-title" class="text-lg font-bold text-[#1A1A1B]">Quản lý website ưa thích</h3>
          <button (click)="closeModal.emit()" aria-label="Đóng cửa sổ cài đặt" class="text-gray-400 hover:text-gray-700 bg-transparent border-none cursor-pointer transition-colors w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100">
            <mat-icon class="flex items-center justify-center" style="font-size: 20px; line-height: 20px; width: 20px; height: 20px;">close</mat-icon>
          </button>
        </div>

        <!-- Body -->
        <div class="px-6 py-5 overflow-y-auto flex-1 flex flex-col gap-3">
          @for (item of modalSiteInputs(); track item.id; let idx = $index) {
            <div class="flex items-center gap-2">
              <span class="text-gray-400 font-mono text-sm w-5 text-right">{{idx + 1}}.</span>
              <input type="text"
                     [id]="'modal-input-' + item.id"
                     aria-label="Đường dẫn website"
                     [ngModel]="item.url" 
                     (ngModelChange)="updateModalInput(item.id, $event)"
                     placeholder="https://..."
                     class="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-[#1A1A1B] outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF] transition-all">
              <button (click)="removeModalInput(item.id)" aria-label="Xóa đường dẫn này" class="flex items-center justify-center text-gray-300 hover:text-red-500 bg-transparent border-none cursor-pointer p-1.5 rounded-md hover:bg-red-50 transition-colors" title="Xóa">
                <mat-icon style="font-size: 20px; width: 20px; height: 20px;">delete</mat-icon>
              </button>
            </div>
          }

          @if (modalSiteInputs().length < 10) {
            <button (click)="addModalInput()" aria-label="Thêm ô nhập website mới" class="mt-2 self-start flex items-center gap-1.5 text-sm font-medium text-[#0066FF] hover:text-blue-700 bg-transparent border-none cursor-pointer hover:underline underline-offset-2 transition-all">
              <mat-icon class="flex items-center justify-center h-4 w-4" style="font-size: 16px; line-height: 16px; width: 16px; height: 16px;">add</mat-icon>
              Thêm website khác
            </button>
          }
          
          <p class="text-xs text-left text-gray-400 mt-4 px-4 leading-relaxed">
            Dữ liệu được lưu trữ an toàn ngay trên trình duyệt hiện tại để bảo vệ quyền riêng tư của bạn.
          </p>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button (click)="saveSites()" aria-label="Lưu danh sách website" class="bg-[#0066FF] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 hover:shadow-md transition-all cursor-pointer border-none active:scale-95">
            Lưu danh sách
          </button>
        </div>
      </div>
    </div>
  `
})
export class SitesModalComponent implements OnInit {
  favoriteSites = input.required<string[]>();
  
  closeModal = output<void>();
  saveSitesData = output<string[]>();

  modalSiteInputs = signal<SiteInput[]>([]);
  private modalInputIdCounter = 0;

  private el = inject(ElementRef);

  ngOnInit() {
    const sites = this.favoriteSites();
    const initialInputs = sites.map(url => ({ id: this.modalInputIdCounter++, url }));
    if (initialInputs.length === 0) {
      initialInputs.push({ id: this.modalInputIdCounter++, url: '' });
    }
    this.modalSiteInputs.set(initialInputs);
    
    // Auto focus
    setTimeout(() => {
      const firstInput = this.el.nativeElement.querySelector(`#modal-input-${initialInputs[0]?.id}`);
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  }

  addModalInput() {
    if (this.modalSiteInputs().length < 10) {
      this.modalSiteInputs.update(inputs => [...inputs, { id: this.modalInputIdCounter++, url: '' }]);
    }
  }

  removeModalInput(id: number) {
    this.modalSiteInputs.update(inputs => inputs.filter(item => item.id !== id));
  }

  updateModalInput(id: number, value: string) {
    this.modalSiteInputs.update(inputs => 
      inputs.map(item => item.id === id ? { ...item, url: value } : item)
    );
  }

  saveSites() {
    const validSites = this.modalSiteInputs()
      .map(item => item.url.trim())
      .filter(url => url.length > 0)
      .map(url => {
        if (!/^https?:\/\//i.test(url)) {
          return 'https://' + url;
        }
        return url;
      });
      
    this.saveSitesData.emit(validSites);
  }
}
