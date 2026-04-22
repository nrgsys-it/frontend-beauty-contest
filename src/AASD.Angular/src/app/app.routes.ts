import { Routes } from '@angular/router';
import { HomePage } from './components/home-page/home-page';
import { ChatPage } from './components/chat-page/chat-page';
import { SettingsPage } from './components/settings-page/settings-page';

export const routes: Routes = [
  {path: '', component: HomePage},
  {path: 'chat', component: ChatPage},
  {path: 'settings', component: SettingsPage}
];
