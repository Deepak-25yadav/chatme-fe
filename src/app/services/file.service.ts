import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FileUploadResponse {
  success: boolean;
  file: {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
  };
}

export interface MultipleFileUploadResponse {
  success: boolean;
  files: {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Upload single file
  uploadFile(file: File): Observable<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<FileUploadResponse>(`${this.apiUrl}/api/upload`, formData);
  }

  // Upload multiple files
  uploadMultipleFiles(files: File[]): Observable<MultipleFileUploadResponse> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    return this.http.post<MultipleFileUploadResponse>(`${this.apiUrl}/api/upload-multiple`, formData);
  }

  // Get file URL
  getFileUrl(filename: string): string {
    return `${this.apiUrl}/api/files/${filename}`;
  }

  // Check if file is image
  isImage(mimetype: string): boolean {
    return mimetype.startsWith('image/');
  }

  // Check if file is video
  isVideo(mimetype: string): boolean {
    return mimetype.startsWith('video/');
  }

  // Check if file is audio
  isAudio(mimetype: string): boolean {
    return mimetype.startsWith('audio/');
  }

  // Format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Get file icon based on mimetype
  getFileIcon(mimetype: string): string {
    if (this.isImage(mimetype)) return '🖼️';
    if (this.isVideo(mimetype)) return '🎥';
    if (this.isAudio(mimetype)) return '🎵';
    if (mimetype.includes('pdf')) return '📄';
    if (mimetype.includes('word') || mimetype.includes('document')) return '📝';
    if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return '📊';
    if (mimetype.includes('powerpoint') || mimetype.includes('presentation')) return '📽️';
    if (mimetype.includes('zip') || mimetype.includes('rar')) return '📦';
    return '📎';
  }
}
