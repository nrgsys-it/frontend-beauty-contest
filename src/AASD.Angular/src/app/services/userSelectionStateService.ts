import { isPlatformBrowser } from '@angular/common';
import { computed, Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { UserListItem } from './userListService';
@Injectable({providedIn: 'root',})
export class UserSelectionStateService {
  private readonly storageKey = 'selectedUser';
  private readonly isBrowser: boolean;

  readonly selectedUser = signal<UserListItem | null>(null);
  readonly isUserSelected = computed(() => this.selectedUser() !== null);

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.restoreFromSessionStorage();
  }

  select(user: UserListItem): void {
    this.selectedUser.set(user);
    this.persistToSessionStorage(user);
  }

  clear(): void {
    this.selectedUser.set(null);
    this.persistToSessionStorage(null);
  }

  private restoreFromSessionStorage(): void {
    if (!this.isBrowser) {
      return;
    }

    const storedValue = sessionStorage.getItem(this.storageKey);
    if (!storedValue) {
      return;
    }

    try {
      this.selectedUser.set(JSON.parse(storedValue) as UserListItem);
    } catch {
      sessionStorage.removeItem(this.storageKey);
    }
  }

  private persistToSessionStorage(user: UserListItem | null): void {
    if (!this.isBrowser) {
      return;
    }

    if (user === null) {
      sessionStorage.removeItem(this.storageKey);
      return;
    }

    sessionStorage.setItem(this.storageKey, JSON.stringify(user));
  }
}
