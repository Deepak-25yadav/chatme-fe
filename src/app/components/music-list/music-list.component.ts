import { Component, OnInit, OnDestroy, Output, EventEmitter, Input } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MusicService, MusicItem } from '../../services/music.service';

@Component({
  selector: 'app-music-list',
  templateUrl: './music-list.component.html',
  styleUrls: ['./music-list.component.css']
})
export class MusicListComponent implements OnInit, OnDestroy {
  /** 'home' shows all, 'mp4'|'mp3'|'reels' filters by category */
  @Input() mode: 'home' | 'mp4' | 'mp3' | 'reels' = 'home';
  @Output() trackSelected  = new EventEmitter<MusicItem>();
  /** Emitted when user taps Edit on a track card — shell opens modal */
  @Output() editRequested  = new EventEmitter<MusicItem>();

  // Context menu (three-dot ⋮) state
  activeMenuId: string | null = null;

  items: MusicItem[] = [];
  pinnedItems: MusicItem[] = [];
  isLoading = false;
  isLoadingMore = false;
  error = '';
  searchQuery = '';
  sortOrder: 'latest' | 'oldest' = 'latest';

  // Pagination
  currentPage = 1;
  totalPages = 1;
  hasNextPage = false;

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  pageTitle = 'Home';
  pageEmoji = '🏠';
  pageDescription = 'All your music in one place';

  constructor(private musicService: MusicService) {}

  ngOnInit(): void {
    this.setupPageMeta();
    this.loadMusic(1, true);

    // Debounce search input
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => this.loadMusic(1, true));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupPageMeta(): void {
    switch (this.mode) {
      case 'mp4':
        this.pageTitle = 'Videos';
        this.pageEmoji = '🎬';
        this.pageDescription = 'MP4 Video collection';
        break;
      case 'mp3':
        this.pageTitle = 'Music';
        this.pageEmoji = '🎵';
        this.pageDescription = 'Audio tracks & songs';
        break;
      case 'reels':
        this.pageTitle = 'Reels';
        this.pageEmoji = '📱';
        this.pageDescription = 'Short videos & reels';
        break;
      default:
        this.pageTitle = 'Home';
        this.pageEmoji = '🏠';
        this.pageDescription = 'All music & videos';
    }
  }

  loadMusic(page: number, fresh = false): void {
    if (fresh) {
      this.isLoading = true;
      this.error = '';
    } else {
      this.isLoadingMore = true;
    }

    const params: any = {
      page,
      limit: 10,
      sort: this.sortOrder,
    };

    if (this.mode !== 'home') params.category = this.mode;
    if (this.searchQuery.trim()) params.search = this.searchQuery.trim();

    this.musicService.getAll(params).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (fresh) {
          this.pinnedItems = res.data.filter(i => i.pinned);
          this.items = res.data.filter(i => !i.pinned);
        } else {
          const newNonPinned = res.data.filter(i => !i.pinned);
          this.items = [...this.items, ...newNonPinned];
        }
        this.currentPage = res.pagination.page;
        this.totalPages = res.pagination.totalPages;
        this.hasNextPage = res.pagination.hasNextPage;
        this.isLoading = false;
        this.isLoadingMore = false;
      },
      error: () => {
        this.error = 'Failed to load music. Please try again.';
        this.isLoading = false;
        this.isLoadingMore = false;
      }
    });
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchQuery);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.loadMusic(1, true);
  }

  onSortChange(): void {
    this.loadMusic(1, true);
  }

  loadMore(): void {
    if (this.hasNextPage && !this.isLoadingMore) {
      this.loadMusic(this.currentPage + 1, false);
    }
  }

  onTrackClick(track: MusicItem): void {
    console.log('[MusicList] Track clicked → calling playTrack:', track.title);
    // Increment view count
    this.musicService.incrementView(track._id).subscribe({
      next: (res) => console.log('[MusicList] View incremented ✅', res?.data),
      error: (err) => console.error('[MusicList] View increment failed ❌', err)
    });
    // Update local count
    const found = [...this.pinnedItems, ...this.items].find(i => i._id === track._id);
    if (found) found.views++;
    // ✅ Push directly into the shared service BehaviorSubject
    // Shell subscribes to this in ngOnInit — NO EventEmitter chain needed
    this.musicService.playTrack(track);
  }

  onLike(event: Event, track: MusicItem): void {
    event.stopPropagation();
    this.musicService.incrementLike(track._id).subscribe(res => {
      track.likes = res.data.likes;
    });
  }

  onMoreClick(event: Event, track: MusicItem): void {
    event.stopPropagation();
    this.activeMenuId = this.activeMenuId === track._id ? null : track._id;
  }

  onEditClick(event: Event, track: MusicItem): void {
    event.stopPropagation();
    this.activeMenuId = null;
    // ✅ Push edit request directly into service — Shell subscribes to this
    this.musicService.requestEdit(track);
  }


  closeMenu(): void {
    this.activeMenuId = null;
  }

  getCategoryLabel(category: string): string {
    switch (category) {
      case 'mp4': return '🎬 MP4';
      case 'mp3': return '🎵 MP3';
      case 'reels': return '📱 Reel';
      default: return category.toUpperCase();
    }
  }

  getCategoryColor(category: string): string {
    switch (category) {
      case 'mp4': return 'badge-mp4';
      case 'mp3': return 'badge-mp3';
      case 'reels': return 'badge-reels';
      default: return '';
    }
  }

  formatViews(views: number): string {
    if (views >= 1_000_000) return (views / 1_000_000).toFixed(1) + 'M';
    if (views >= 1_000) return (views / 1_000).toFixed(1) + 'K';
    return views.toString();
  }

  getInitials(title: string): string {
    return title.charAt(0).toUpperCase();
  }

  trackByFn(_: number, item: MusicItem): string {
    return item._id;
  }

  get allDisplayItems(): MusicItem[] {
    return [...this.pinnedItems, ...this.items];
  }
}
