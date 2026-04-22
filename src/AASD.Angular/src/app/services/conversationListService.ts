import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface ConversationListItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class ConversationListService {
  private readonly httpClient = inject(HttpClient);

  getList(): Observable<ConversationListItem[]> {
    return this.httpClient.get<ConversationListItem[]>('/api/conversations');
  }
}
