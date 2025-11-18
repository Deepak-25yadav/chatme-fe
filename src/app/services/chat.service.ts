import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Message {
  _id?: string;
  chatRoomId: string;
  senderId: string;
  receiverId: string;
  message: string;
  status: 'sent' | 'delivered' | 'seen';
  timestamp: Date;
  replyTo?: Message;
  isEdited: boolean;
  deletedFor: string[];
  deleteType: 'none' | 'for_me' | 'for_both';
}

export interface User {
  _id?: string;
  userId: string;
  name: string;
  email?: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Get chat history
  getChatHistory(userId1: string, userId2: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/api/history/${userId1}/${userId2}`);
  }

  // Get user info
  getUser(userId: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/api/user/${userId}`);
  }

  // Create or update user
  createOrUpdateUser(user: Partial<User>): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/api/user`, user);
  }

  // Get all users
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/api/users`);
  }
}

