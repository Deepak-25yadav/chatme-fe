import { Component, Output, EventEmitter } from '@angular/core';
import { MusicItem } from '../../services/music.service';

@Component({
  selector: 'app-mp3-page',
  template: `
    <app-music-list mode="mp3"
      (trackSelected)="trackSelected.emit($event)"
      (editRequested)="editRequested.emit($event)">
    </app-music-list>`
})
export class Mp3PageComponent {
  @Output() trackSelected = new EventEmitter<MusicItem>();
  @Output() editRequested = new EventEmitter<MusicItem>();
}
