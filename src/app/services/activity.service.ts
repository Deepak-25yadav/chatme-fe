import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

// ── Action types the frontend can track ────────────────────────────────────
export type ActivityAction = 'home_visit' | 'play' | 'add' | 'edit' | 'delete';

@Injectable({ providedIn: 'root' })
export class ActivityService {

  private readonly endpoint = `${environment.apiUrl}/api/activity/track`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // ── Core tracker — always fire-and-forget, never crash the app ─────────────
  track(action: ActivityAction, data: Record<string, any> = {}): void {
    const user = this.authService.currentUserValue;

    const payload = {
      action,
      data,
      // Only send user info if logged in
      user: user
        ? { name: user.name, email: user.email, role: user.role }
        : null
    };

    this.http.post(this.endpoint, payload).subscribe({
      next: () => {},   // silent success
      error: (err) => console.warn('[Activity] Track failed (non-critical):', err.status)
    });
  }

  // ── Convenience methods ────────────────────────────────────────────────────

  /** Call when user lands on /music home page */
  trackHomeVisit(): void {
    this.track('home_visit', {
      userAgent: navigator.userAgent
    });
  }

  /** Call when user clicks a track to play it */
  trackPlay(song: {
    title: string;
    artist?: string;
    category?: string;
    views?: number;
    url?: string;
    _id?: string;
  }): void {
    this.track('play', {
      id:       song._id    || '',
      title:    song.title  || '',
      artist:   song.artist || '',
      category: song.category || '',
      views:    song.views  ?? 0,
      url:      song.url    || ''
    });
  }

  /** Call when a new track is added */
  trackAdd(song: {
    title: string;
    artist?: string;
    category?: string;
    url?: string;
  }): void {
    this.track('add', {
      title:    song.title    || '',
      artist:   song.artist   || '',
      category: song.category || '',
      url:      song.url      || ''
    });
  }

  /** Call when a track is edited */
  trackEdit(song: {
    _id?: string;
    title: string;
    artist?: string;
    category?: string;
  }): void {
    this.track('edit', {
      id:       song._id     || '',
      title:    song.title   || '',
      artist:   song.artist  || '',
      category: song.category || ''
    });
  }

  /** Call when a track is deleted */
  trackDelete(song: {
    _id?: string;
    title: string;
    artist?: string;
  }): void {
    this.track('delete', {
      id:     song._id    || '',
      title:  song.title  || '',
      artist: song.artist || ''
    });
  }
}
