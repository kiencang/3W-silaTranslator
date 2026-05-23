import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-favorite-sites',
  standalone: true,
  imports: [MatIconModule],
  host: {
    class: 'w-full block'
  },
  template: `
    <div class="mt-8 w-full max-w-3xl mx-auto flex flex-col items-center gap-4 relative z-10">
      @if (favoriteSites().length === 0) {
        <button (click)="openSitesModal.emit()" class="text-[#0066FF] hover:text-blue-700 font-medium text-sm md:text-base border-none bg-transparent cursor-pointer underline underline-offset-4 transition-colors">
          + Thêm danh sách website ưa thích
        </button>
      } @else {
        <div class="w-full flex flex-col items-center gap-4">
          <div class="flex items-center justify-center gap-1">
            <span class="text-sm md:text-base text-gray-600 font-semibold">Danh sách website ưa thích</span>
            <button (click)="openSitesModal.emit()" aria-label="Quản lý danh sách website ưa thích" title="Quản lý danh sách" class="flex items-center justify-center p-1.5 text-gray-400 hover:text-[#0066FF] bg-transparent border-none cursor-pointer transition-colors rounded-full hover:bg-blue-50">
              <mat-icon style="font-size: 20px; width: 20px; height: 20px;">settings</mat-icon>
            </button>
          </div>
          <div class="flex flex-wrap justify-center gap-3">
            @for (site of favoriteSites(); track site) {
              <a [href]="site" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 text-sm font-medium rounded-full transition-colors no-underline shadow-sm hover:shadow">
                <mat-icon class="text-gray-500 flex items-center justify-center h-4 w-4" style="font-size: 16px; line-height: 16px; width: 16px; height: 16px;">language</mat-icon>
                {{ getDomainName(site) }}
              </a>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class FavoriteSitesComponent {
  favoriteSites = input.required<string[]>();
  openSitesModal = output<void>();

  getDomainName(url: string): string {
    try {
      const u = new URL(url);
      let ds = u.hostname;
      if (ds.startsWith('www.')) {
        ds = ds.substring(4);
      }
      return ds;
    } catch {
      return url;
    }
  }
}
