import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SearchTranslationComponent } from './search-translation.component';
import { FavoriteSitesComponent } from './favorite-sites.component';

@Component({
  selector: 'app-initial-view',
  standalone: true,
  imports: [MatIconModule, SearchTranslationComponent, FavoriteSitesComponent],
  host: {
    class: 'w-full flex-1 flex flex-col'
  },
  template: `
    <div class="w-full flex-1 flex flex-col items-center justify-center gap-6 px-4 relative overflow-hidden">
      <!-- Giant Watermark: Search Icon -->
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
        <mat-icon class="text-slate-900 opacity-[0.02] -mt-10" style="font-size: 450px; line-height: 450px; width: 450px; height: 450px;">search</mat-icon>
      </div>

      <app-search-translation
        [searchQuery]="searchQuery()"
        [translatedSearchQuery]="translatedSearchQuery()"
        [isSearchLoading]="isSearchLoading()"
        (searchQueryChange)="onSearchQueryChange($event)"
        (translatedSearchQueryChange)="translatedSearchQueryChange.emit($event)"
        (translateSearch)="translateSearch.emit()"
        (searchLinkClick)="searchLinkClick.emit()">
      </app-search-translation>

      <app-favorite-sites
        [favoriteSites]="favoriteSites()"
        (openSitesModal)="openSitesModal.emit()">
      </app-favorite-sites>
    </div>
  `
})
export class InitialViewComponent {
  searchQuery = input.required<string>();
  translatedSearchQuery = input.required<string>();
  isSearchLoading = input.required<boolean>();
  favoriteSites = input.required<string[]>();

  searchQueryChange = output<string>();
  translatedSearchQueryChange = output<string>();
  translateSearch = output<void>();
  searchLinkClick = output<void>();
  openSitesModal = output<void>();

  onSearchQueryChange(newQuery: string) {
    this.searchQueryChange.emit(newQuery);
    this.translatedSearchQueryChange.emit('');
  }
}
