import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface TranslationHistoryItem {
  id?: number;
  url: string;
  title: string;
  htmlContent: string;
  rawHtmlString: string;
  timestamp: number;
}

interface TranslationDB extends DBSchema {
  history: {
    key: number;
    value: TranslationHistoryItem;
    indexes: { 'by-timestamp': number };
  };
}

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private dbPromise: Promise<IDBPDatabase<TranslationDB>> | null = null;
  readonly historyItems = signal<TranslationHistoryItem[]>([]);
  private platformId = inject(PLATFORM_ID);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.dbPromise = openDB<TranslationDB>('translation-db', 1, {
        upgrade(db) {
          const store = db.createObjectStore('history', {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('by-timestamp', 'timestamp');
        },
      });
      this.loadHistory();
    }
  }

  async loadHistory() {
    if (!this.dbPromise) return;
    try {
      const db = await this.dbPromise;
      const items = await db.getAllFromIndex('history', 'by-timestamp');
      this.historyItems.set(items.reverse()); // latest first
    } catch (error) {
      console.error('Failed to load history', error);
    }
  }

  async addHistory(item: Omit<TranslationHistoryItem, 'id' | 'timestamp'>) {
    if (!this.dbPromise) return;
    try {
      const db = await this.dbPromise;
      const newItem: TranslationHistoryItem = {
        ...item,
        timestamp: Date.now()
      };
      await db.add('history', newItem);
      
      // Prune to max 10
      const items = await db.getAllFromIndex('history', 'by-timestamp');
      if (items.length > 10) {
        const itemsToDelete = items.slice(0, items.length - 10);
        const tx = db.transaction('history', 'readwrite');
        for (const itemToDelete of itemsToDelete) {
          if (itemToDelete.id) {
            await tx.store.delete(itemToDelete.id);
          }
        }
        await tx.done;
      }
      await this.loadHistory();
    } catch (error) {
      console.error('Failed to add history', error);
    }
  }

  async deleteHistory(id: number) {
    if (!this.dbPromise) return;
    try {
      const db = await this.dbPromise;
      await db.delete('history', id);
      await this.loadHistory();
    } catch (error) {
      console.error('Failed to delete history', error);
    }
  }

  async clearAllHistory() {
    if (!this.dbPromise) return;
    try {
      const db = await this.dbPromise;
      await db.clear('history');
      await this.loadHistory();
    } catch (error) {
      console.error('Failed to clear history', error);
    }
  }
}
