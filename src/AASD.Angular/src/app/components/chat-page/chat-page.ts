import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  ConversationListService,
} from '../../services/conversationListService';

@Component({
  selector: 'app-chat-page',
  imports: [AsyncPipe],
  templateUrl: './chat-page.html',
  styleUrl: './chat-page.css',
})
export class ChatPage {
  private readonly conversationListService = inject(ConversationListService);
  readonly conversations$ = this.conversationListService.getList();
}
