import {Component, inject} from '@angular/core';
import {UserListItem, UserListService} from '../../services/userListService';
import {AsyncPipe} from '@angular/common';
import {UserSelectionStateService} from '../../services/userSelectionStateService';

@Component({
  selector: 'app-home-page',
  imports: [
    AsyncPipe
  ],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})

export class HomePage {
  private readonly userListService = inject(UserListService);
  private readonly userSelectionStateService = inject(UserSelectionStateService);
  readonly users$ = this.userListService.getList();
  readonly selectedUser = this.userSelectionStateService.selectedUser;

  protected selectUser(user: UserListItem): void {
    this.userSelectionStateService.select(user);
  }

  protected unselectUser(): void {
    this.userSelectionStateService.clear();
  }

  protected isSelected(): boolean {
    return this.selectedUser() !== null;
  }
}
