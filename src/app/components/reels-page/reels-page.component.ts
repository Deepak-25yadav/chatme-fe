import { Component, Output, EventEmitter } from '@angular/core';
import { MusicItem } from '../../services/music.service';

@Component({
  selector: 'app-reels-page',
  template: `
    <app-music-list mode="reels"
      (trackSelected)="trackSelected.emit($event)"
      (editRequested)="editRequested.emit($event)">
    </app-music-list>`
})
export class ReelsPageComponent {
  @Output() trackSelected = new EventEmitter<MusicItem>();
  @Output() editRequested = new EventEmitter<MusicItem>();
}
