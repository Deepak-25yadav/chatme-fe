import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { MusicItem } from '../../services/music.service';
import { ActivityService } from '../../services/activity.service';

@Component({
  selector: 'app-home-page',
  template: `
    <app-music-list mode="home"
      (trackSelected)="trackSelected.emit($event)"
      (editRequested)="editRequested.emit($event)">
    </app-music-list>`
})
export class HomePageComponent implements OnInit {
  @Output() trackSelected = new EventEmitter<MusicItem>();
  @Output() editRequested = new EventEmitter<MusicItem>();

  constructor(private activityService: ActivityService) {}

  ngOnInit(): void {
    // Track every visit to the music home page
    this.activityService.trackHomeVisit();
  }
}
