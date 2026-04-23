import {inject, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';

export interface UserListItem {
  id: string;
  name: string;
  surname: string;
}

@Injectable({ providedIn: 'root' })
export class UserListService {
  private readonly httpClient = inject(HttpClient);

  getList(): Observable<UserListItem[]> {
    return this.httpClient.get<UserListItem[]>('/api/users');
  }
}
