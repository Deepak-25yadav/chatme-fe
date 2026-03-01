import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MusicItem {
  _id: string;
  title: string;
  description?: string;
  url: string;
  category: 'mp3' | 'mp4' | 'reels';
  type: 'audio' | 'video';
  pinned: boolean;
  pinnedAt?: string | null;
  thumbnail?: string;
  duration?: string;
  artist?: string;
  tags?: string[];
  pickVideoUrlFrom?: string;
  views: number;
  likes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MusicListResponse {
  success: boolean;
  data: MusicItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface MusicSingleResponse {
  success: boolean;
  data: MusicItem;
  message?: string;
}

export interface MusicQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  type?: string;
  sort?: 'latest' | 'oldest';
  pinned?: boolean;
}

/** Shape sent to POST /api/music and PATCH /api/music/:id */
export interface MusicFormData {
  title: string;
  description?: string;
  url: string;
  category: 'mp3' | 'mp4' | 'reels';
  type: 'audio' | 'video';
  pinned?: boolean;
  thumbnail?: string;
  duration?: string;
  artist?: string;
  tags?: string[];
  pickVideoUrlFrom?: string;
}

@Injectable({ providedIn: 'root' })
export class MusicService {
  private baseUrl = `${environment.apiUrl}/api/music`;

  constructor(private http: HttpClient) {}

  /** GET /api/music — list with optional filters */
  getAll(params: MusicQueryParams = {}): Observable<MusicListResponse> {
    let httpParams = new HttpParams();
    if (params.page)     httpParams = httpParams.set('page',     params.page.toString());
    if (params.limit)    httpParams = httpParams.set('limit',    params.limit.toString());
    if (params.search)   httpParams = httpParams.set('search',   params.search);
    if (params.category) httpParams = httpParams.set('category', params.category);
    if (params.type)     httpParams = httpParams.set('type',     params.type);
    if (params.sort)     httpParams = httpParams.set('sort',     params.sort);
    if (params.pinned)   httpParams = httpParams.set('pinned',   'true');
    return this.http.get<MusicListResponse>(this.baseUrl, { params: httpParams });
  }

  /** GET /api/music/:id */
  getById(id: string): Observable<MusicSingleResponse> {
    return this.http.get<MusicSingleResponse>(`${this.baseUrl}/${id}`);
  }

  /** PATCH /api/music/:id/view */
  incrementView(id: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${id}/view`, {});
  }

  /** PATCH /api/music/:id/like */
  incrementLike(id: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${id}/like`, {});
  }

  /** PATCH /api/music/:id/pin */
  togglePin(id: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${id}/pin`, {});
  }

  /** POST /api/music — create new item */
  create(data: MusicFormData): Observable<MusicSingleResponse> {
    return this.http.post<MusicSingleResponse>(this.baseUrl, data);
  }

  /** PATCH /api/music/:id — partial edit */
  update(id: string, data: Partial<MusicFormData>): Observable<MusicSingleResponse> {
    return this.http.patch<MusicSingleResponse>(`${this.baseUrl}/${id}`, data);
  }

  /** DELETE /api/music/:id — hard delete */
  hardDelete(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
