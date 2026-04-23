import { AsyncPipe } from '@angular/common';
import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  ConversationListItem,
  ConversationListService,
} from '../../services/conversationListService';
import {UserSelectionStateService} from '../../services/userSelectionStateService';
import { of, switchMap } from 'rxjs';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-chat-page',
  imports: [AsyncPipe, FormsModule],
  templateUrl: './chat-page.html',
  styleUrl: './chat-page.css',
})
export class ChatPage {
  private readonly conversationListService = inject(ConversationListService);
  private readonly userSelectionStateService = inject(UserSelectionStateService);
  readonly conversations$ = toObservable(this.userSelectionStateService.selectedUser).pipe(
    switchMap((selectedUser) => {
      if (selectedUser === null) {
        return of([]);
      }

      return this.conversationListService.getList(selectedUser.id);
    }),
  );
  isConversationSelected = false;
  protected messageText: string = '';
  protected sentMessages: string[] = [];
  @ViewChild('messageInput') messageInput!: ElementRef<HTMLInputElement>;

  protected selectConversation(conversation: ConversationListItem) {
    this.isConversationSelected = true;
  }

  protected isUserSelected(): boolean {
    return this.userSelectionStateService.isUserSelected();
  }

  protected sendMessage() {
    const text = this.messageText || this.messageInput?.nativeElement?.value || '';
    if (text.length == 0) return;
    this.sentMessages.push(text);
    this.messageText = '';
    if (this.messageInput?.nativeElement) {
      this.messageInput.nativeElement.value = '';
    }
  }
}
