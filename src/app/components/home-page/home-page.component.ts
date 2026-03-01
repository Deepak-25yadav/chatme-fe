import { Component, Output, EventEmitter } from '@angular/core';
import { MusicItem } from '../../services/music.service';

@Component({
  selector: 'app-home-page',
  template: `<app-music-list mode="home" (trackSelected)="trackSelected.emit($event)"></app-music-list>`
})
export class HomePageComponent {
  @Output() trackSelected = new EventEmitter<MusicItem>();
}
