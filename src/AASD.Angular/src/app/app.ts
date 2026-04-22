import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './components/header/header';
import { HomePage } from "./components/home-page/home-page";
import { MainLayout } from "./layouts/main-layout/main-layout";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, HomePage, MainLayout],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('AASD.Angular');
}
