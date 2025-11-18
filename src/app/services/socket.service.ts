import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  private readonly apiUrl = 'http://localhost:3000';

  constructor() {
    this.socket = io(this.apiUrl);
  }

  // Join with user info
  join(userId: string, name: string): void {
    this.socket.emit('join', { userId, name });
  }

  // Send message
  sendMessage(data: { senderId: string; receiverId: string; message: string; replyTo?: string }): void {
    this.socket.emit('send-message', data);
  }

  // Listen for received messages
  onReceiveMessage(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('receive-message', (data) => {
        observer.next(data);
      });
    });
  }

  // Listen for message sent confirmation
  onMessageSent(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('message-sent', (data) => {
        observer.next(data);
      });
    });
  }

  // Listen for message status updates
  onMessageStatusUpdate(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('message-status-update', (data) => {
        observer.next(data);
      });
    });
  }

  // Mark messages as seen
  markMessagesAsSeen(messageIds: string[], userId: string): void {
    this.socket.emit('message-seen', { messageIds, userId });
  }

  // Listen for messages seen notification
  onMessagesSeen(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('messages-seen', (data) => {
        observer.next(data);
      });
    });
  }

  // Typing indicator
  typing(senderId: string, receiverId: string, isTyping: boolean): void {
    this.socket.emit('typing', { senderId, receiverId, isTyping });
  }

  // Listen for typing
  onTyping(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('typing', (data) => {
        observer.next(data);
      });
    });
  }

  // Edit message
  editMessage(messageId: string, newMessage: string, userId: string): void {
    this.socket.emit('edit-message', { messageId, newMessage, userId });
  }

  // Listen for message edited
  onMessageEdited(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('message-edited', (data) => {
        observer.next(data);
      });
    });
  }

  // Delete message
  deleteMessage(messageId: string, userId: string, deleteFor: 'me' | 'both'): void {
    this.socket.emit('delete-message', { messageId, userId, deleteFor });
  }

  // Listen for message deleted
  onMessageDeleted(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('message-deleted', (data) => {
        observer.next(data);
      });
    });
  }

  // Get online status
  getOnlineStatus(userId: string): void {
    this.socket.emit('get-online-status', { userId });
  }

  // Listen for online status
  onOnlineStatus(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('online-status', (data) => {
        observer.next(data);
      });
    });
  }

  // Listen for user online
  onUserOnline(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('user-online', (data) => {
        observer.next(data);
      });
    });
  }

  // Listen for user offline
  onUserOffline(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('user-offline', (data) => {
        observer.next(data);
      });
    });
  }

  // Disconnect
  disconnect(): void {
    this.socket.disconnect();
  }
}

