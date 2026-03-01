import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter, distinctUntilChanged } from 'rxjs/operators';
import { MusicItem, MusicService } from '../../services/music.service';

@Component({
  selector: 'app-music-shell',
  templateUrl: './music-shell.component.html',
  styleUrls: ['./music-shell.component.css']
})
export class MusicShellComponent implements OnInit, OnDestroy {
  activeTab = 'home';
  currentTrack: MusicItem | null = null;
  isPlayerVisible  = false;
  isPlaying        = false;
  isPlayerExpanded = false;

  // ── Modal state ──────────────────────────────────────────────────────────────
  isModalOpen    = false;
  modalEditItem: MusicItem | null = null;
  lastSavedTrack: MusicItem | null = null;

  // ── Avatar auth dropdown ─────────────────────────────────────────────────
  isAvatarMenuOpen = false;

  tabs = [
    { id: 'home',    label: 'Home',    icon: 'home',    route: '/music' },
    { id: 'mp4',     label: 'Videos',  icon: 'video',   route: '/music/mp4' },
    { id: 'mp3',     label: 'Music',   icon: 'music',   route: '/music/mp3' },
    { id: 'reels',   label: 'Reels',   icon: 'reels',   route: '/music/reels' },
    { id: 'upgrade', label: 'Upgrade', icon: 'upgrade', route: '/music/upgrade' },
  ];

  private subs: Subscription[] = [];

  constructor(
    private router: Router,
    private musicService: MusicService   // ← injected here, NOT via child events
  ) {}

  ngOnInit(): void {
    // ── Route sync ─────────────────────────────────────────────────────────────
    this.syncTabFromRoute(this.router.url);
    this.subs.push(
      this.router.events
        .pipe(filter(e => e instanceof NavigationEnd))
        .subscribe((e: any) => this.syncTabFromRoute(e.urlAfterRedirects))
    );

    // ── 🔑 THE FIX: subscribe directly to the service BehaviorSubject ──────────
    // This runs inside Angular's zone automatically (HTTP/zone patching),
    // so change detection fires and the template updates instantly.
    this.subs.push(
      this.musicService.currentTrack$
        .pipe(distinctUntilChanged())
        .subscribe((track) => {
          console.log('[Shell] currentTrack$ received:', track?.title ?? 'null');
          this.currentTrack    = track;
          this.isPlayerVisible = !!track;
          this.isPlaying       = !!track;
          if (track) {
            this.isPlayerExpanded = false; // always start as mini player
          }
          console.log('[Shell] isPlayerVisible:', this.isPlayerVisible);
        })
    );

    // ── Edit request stream ────────────────────────────────────────────────────
    this.subs.push(
      this.musicService.editRequest$
        .pipe(filter((t): t is MusicItem => t !== null))
        .subscribe((track) => {
          console.log('[Shell] editRequest$ received:', track.title);
          this.openEditModal(track);
        })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  private syncTabFromRoute(url: string): void {
    if (url === '/music' || url === '/music/home' || url === '/music/') {
      this.activeTab = 'home';
    } else if (url.includes('/music/mp4')) {
      this.activeTab = 'mp4';
    } else if (url.includes('/music/mp3')) {
      this.activeTab = 'mp3';
    } else if (url.includes('/music/reels')) {
      this.activeTab = 'reels';
    } else if (url.includes('/music/upgrade')) {
      this.activeTab = 'upgrade';
    }
  }

  navigateTo(tab: { id: string; route: string }): void {
    this.activeTab = tab.id;
    this.router.navigate([tab.route]);
  }

  togglePlayPause(): void {
    this.isPlaying = !this.isPlaying;
  }

  expandPlayer(): void {
    this.isPlayerExpanded = true;
  }

  collapsePlayer(): void {
    this.isPlayerExpanded = false;
  }

  closePlayer(): void {
    // Clear the shared service state — all subscribers (including this) update
    this.musicService.clearPlayer();
    this.isPlayerExpanded = false;
  }

  // ── onOutletActivated: kept for future extensibility, no longer critical ────
  onOutletActivated(component: any): void {
    console.log('[Shell] outlet activated:', component?.constructor?.name);
  }

  // ── Avatar auth dropdown ───────────────────────────────────────────────────
  toggleAvatarMenu(event: Event): void {
    event.stopPropagation();
    this.isAvatarMenuOpen = !this.isAvatarMenuOpen;
  }

  closeAvatarMenu(): void {
    this.isAvatarMenuOpen = false;
  }

  // ── Modal helpers ─────────────────────────────────────────────────────────

  openAddModal(): void {
    this.modalEditItem = null;
    this.isModalOpen   = true;
  }

  openEditModal(track: MusicItem): void {
    this.modalEditItem = track;
    this.isModalOpen   = true;
  }

  closeModal(): void {
    this.isModalOpen   = false;
    this.modalEditItem = null;
  }

  onModalSaved(track: MusicItem): void {
    this.lastSavedTrack = track;
    this.closeModal();
  }

  // ── YouTube helpers ────────────────────────────────────────────────────────
  isYouTubeUrl(url: string): boolean {
    return url.includes('youtube.com') || url.includes('youtu.be');
  }

  getYouTubeEmbedUrl(url: string): string {
    let videoId = '';
    if (url.includes('youtube.com/watch')) {
      const params = new URLSearchParams(url.split('?')[1]);
      videoId = params.get('v') || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('youtube.com/shorts/')) {
      videoId = url.split('/shorts/')[1]?.split('?')[0];
    }
    return videoId
      ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`
      : url;
  }

  getPlatformIcon(track: MusicItem): string {
    const platform = track.pickVideoUrlFrom?.toLowerCase() || '';
    if (platform.includes('youtube')) return '▶';
    if (platform.includes('spotify')) return '🎵';
    if (platform.includes('jiosaavn') || platform.includes('jio')) return '🎶';
    return '🎵';
  }
}
