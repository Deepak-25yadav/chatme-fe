import {
  Component, EventEmitter, Input, OnChanges,
  OnInit, Output, SimpleChanges
} from '@angular/core';
import { MusicFormData, MusicItem, MusicService } from '../../services/music.service';
import { ActivityService } from '../../services/activity.service';

/** Blank form factory */
const emptyForm = (): MusicFormData => ({
  title: '',
  description: '',
  url: '',
  category: 'mp4',
  type: 'video',
  pinned: false,
  thumbnail: '',
  duration: '',
  artist: '',
  tags: [],
  pickVideoUrlFrom: '',
});

@Component({
  selector: 'app-music-modal',
  templateUrl: './music-modal.component.html',
  styleUrls: ['./music-modal.component.css']
})
export class MusicModalComponent implements OnInit, OnChanges {
  /** When provided → Edit mode; when null → Add mode */
  @Input() editItem: MusicItem | null = null;
  /** Emitted after a successful save so parent can refresh list */
  @Output() saved  = new EventEmitter<MusicItem>();
  /** Emitted when user clicks Cancel / backdrop */
  @Output() closed = new EventEmitter<void>();

  // ── Form state ──────────────────────────────────────────────────────────────
  form: MusicFormData = emptyForm();
  tagsInput = '';          // raw comma-separated tag string in the input
  isSaving = false;
  saveError = '';
  saveSuccess = '';

  // ── Derived ─────────────────────────────────────────────────────────────────
  get isEditMode(): boolean { return !!this.editItem; }
  get modalTitle(): string  { return this.isEditMode ? 'Edit Track' : 'Add New Track'; }

  // ── Platform options ─────────────────────────────────────────────────────────
  platformOptions = [
    'YouTube', 'YouTube Shorts', 'Spotify', 'JioSaavn',
    'Apple Music', 'SoundCloud', 'Gaana', 'Wynk', 'Amazon Music', 'Other'
  ];

  // ── Category / type auto-link ─────────────────────────────────────────────--
  readonly categoryTypeMap: Record<string, 'audio' | 'video'> = {
    mp3: 'audio',
    mp4: 'video',
    reels: 'video',
  };

  constructor(
    private musicService: MusicService,
    private activityService: ActivityService
  ) {}

  ngOnInit(): void { this.syncFormFromInput(); }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editItem']) { this.syncFormFromInput(); }
  }

  /** Populate form when editItem changes */
  private syncFormFromInput(): void {
    this.saveError   = '';
    this.saveSuccess = '';
    if (this.editItem) {
      this.form = {
        title:            this.editItem.title,
        description:      this.editItem.description   || '',
        url:              this.editItem.url,
        category:         this.editItem.category,
        type:             this.editItem.type,
        pinned:           this.editItem.pinned,
        thumbnail:        this.editItem.thumbnail      || '',
        duration:         this.editItem.duration       || '',
        artist:           this.editItem.artist         || '',
        tags:             [...(this.editItem.tags      || [])],
        pickVideoUrlFrom: this.editItem.pickVideoUrlFrom || '',
      };
      this.tagsInput = (this.editItem.tags || []).join(', ');
    } else {
      this.form      = emptyForm();
      this.tagsInput = '';
    }
  }

  /** Auto-set type when category changes */
  onCategoryChange(): void {
    this.form.type = this.categoryTypeMap[this.form.category] || 'video';
  }

  /** Auto-detect platform from URL */
  onUrlChange(): void {
    if (this.form.pickVideoUrlFrom) return; // don't override if already set
    const url = this.form.url.toLowerCase();
    if (url.includes('youtube.com/shorts') || url.includes('youtu.be')) {
      this.form.pickVideoUrlFrom = 'YouTube Shorts';
    } else if (url.includes('youtube.com')) {
      this.form.pickVideoUrlFrom = 'YouTube';
    } else if (url.includes('spotify.com'))   { this.form.pickVideoUrlFrom = 'Spotify'; }
    else if (url.includes('jiosaavn.com'))     { this.form.pickVideoUrlFrom = 'JioSaavn'; }
    else if (url.includes('soundcloud.com'))   { this.form.pickVideoUrlFrom = 'SoundCloud'; }
    else if (url.includes('gaana.com'))        { this.form.pickVideoUrlFrom = 'Gaana'; }
    else if (url.includes('music.amazon'))     { this.form.pickVideoUrlFrom = 'Amazon Music'; }
  }

  /** Auto-generate YouTube thumbnail from URL */
  onUrlBlur(): void {
    const url = this.form.url;
    if (!this.form.thumbnail && url.includes('youtube.com/watch')) {
      const params = new URLSearchParams(url.split('?')[1]);
      const vid = params.get('v');
      if (vid) this.form.thumbnail = `https://img.youtube.com/vi/${vid}/hqdefault.jpg`;
    } else if (!this.form.thumbnail && url.includes('youtu.be/')) {
      const vid = url.split('youtu.be/')[1]?.split('?')[0];
      if (vid) this.form.thumbnail = `https://img.youtube.com/vi/${vid}/hqdefault.jpg`;
    }
  }

  /** Parse tags from comma-separated string */
  onTagsInput(): void {
    this.form.tags = this.tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
  }

  /** Remove single tag chip */
  removeTag(tag: string): void {
    this.form.tags = (this.form.tags || []).filter(t => t !== tag);
    this.tagsInput = (this.form.tags || []).join(', ');
  }

  /** Client-side validation */
  private validate(): string {
    if (!this.form.title?.trim())    return 'Title is required.';
    if (!this.form.url?.trim())      return 'URL is required.';
    if (!this.form.category)         return 'Category is required.';
    if (!this.form.type)             return 'Type is required.';
    return '';
  }

  onSubmit(): void {
    this.saveError   = '';
    this.saveSuccess = '';

    const err = this.validate();
    if (err) { this.saveError = err; return; }

    // Clean up empty optional strings
    const payload: MusicFormData = {
      ...this.form,
      title:            this.form.title.trim(),
      description:      this.form.description?.trim()      || undefined,
      thumbnail:        this.form.thumbnail?.trim()         || undefined,
      duration:         this.form.duration?.trim()          || undefined,
      artist:           this.form.artist?.trim()            || undefined,
      pickVideoUrlFrom: this.form.pickVideoUrlFrom?.trim()  || undefined,
      tags:             (this.form.tags || []).filter(Boolean),
    };

    this.isSaving = true;

    if (this.isEditMode) {
      this.musicService.update(this.editItem!._id, payload).subscribe({
        next: (res) => {
          this.isSaving    = false;
          this.saveSuccess = '✅ Track updated successfully!';
          // ✅ Fire activity email to admin
          this.activityService.trackEdit(res.data);
          this.saved.emit(res.data);
          setTimeout(() => this.close(), 1200);
        },
        error: (err) => {
          this.isSaving  = false;
          this.saveError = err?.error?.error || 'Failed to update. Please try again.';
        }
      });
    } else {
      this.musicService.create(payload).subscribe({
        next: (res) => {
          this.isSaving    = false;
          this.saveSuccess = '✅ Track added successfully!';
          // ✅ Fire activity email to admin
          this.activityService.trackAdd(res.data);
          this.saved.emit(res.data);
          setTimeout(() => { this.form = emptyForm(); this.tagsInput = ''; this.saveSuccess = ''; }, 1500);
        },
        error: (err) => {
          this.isSaving  = false;
          this.saveError = err?.error?.error || 'Failed to add track. Please try again.';
        }
      });
    }
  }

  close(): void {
    this.saveError   = '';
    this.saveSuccess = '';
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close();
    }
  }
}
