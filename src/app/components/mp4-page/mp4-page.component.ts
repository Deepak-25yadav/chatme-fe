import { Component, Output, EventEmitter } from '@angular/core';
import { MusicItem } from '../../services/music.service';

@Component({
  selector: 'app-mp4-page',
  template: `<app-music-list mode="mp4" (trackSelected)="trackSelected.emit($event)"></app-music-list>`
})
export class Mp4PageComponent {
  @Output() trackSelected = new EventEmitter<MusicItem>();
}
