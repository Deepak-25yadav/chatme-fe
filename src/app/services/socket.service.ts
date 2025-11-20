import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket!: Socket;
  private readonly apiUrl = environment.apiUrl;
  
  // Use BehaviorSubjects for real-time message updates - ensures subscribers get latest value
  private receiveMessageSubject = new Subject<any>();
  private messageSentSubject = new Subject<any>();
  private messageStatusUpdateSubject = new Subject<any>();
  private messagesSeenSubject = new Subject<any>();
  private typingSubject = new Subject<any>();
  private messageEditedSubject = new Subject<any>();
  private messageDeletedSubject = new Subject<any>();
  private userOnlineSubject = new Subject<any>();
  private userOfflineSubject = new Subject<any>();
  private onlineStatusSubject = new Subject<any>();
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private chatHistorySubject = new Subject<any>();

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket(): void {
    console.log('🔌 Initializing socket connection to:', this.apiUrl);
    this.socket = io(this.apiUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
      forceNew: false
    });

    // Log connection events for debugging
    this.socket.on('connect', () => {
      console.log('✅✅✅ SOCKET CONNECTED ✅✅✅ Socket ID:', this.socket.id);
      this.connectionStatusSubject.next(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      this.connectionStatusSubject.next(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      this.connectionStatusSubject.next(false);
    });

    // Set up all socket event listeners ONCE
    this.setupSocketListeners();
  }

  private setupSocketListeners(): void {
    // Listen for received messages - INCOMING MESSAGES FROM OTHER USERS
    this.socket.on('receive-message', (data: any) => {
      console.log('📨📨📨 RECEIVE-MESSAGE EVENT RECEIVED 📨📨📨', data);
      // Convert timestamp string to Date object
      if (data.timestamp && typeof data.timestamp === 'string') {
        data.timestamp = new Date(data.timestamp);
      }
      // Emit to all subscribers immediately
      this.receiveMessageSubject.next(data);
    });

    // Listen for message sent confirmation - CONFIRMATION FOR SENDER
    this.socket.on('message-sent', (data: any) => {
      console.log('✅✅✅ MESSAGE-SENT EVENT RECEIVED ✅✅✅', data);
      // Convert timestamp string to Date object
      if (data.timestamp && typeof data.timestamp === 'string') {
        data.timestamp = new Date(data.timestamp);
      }
      // Emit to all subscribers immediately
      this.messageSentSubject.next(data);
    });

    // Listen for chat history loaded
    this.socket.on('chat-history-loaded', (data: any) => {
      console.log('📥 Chat history loaded via socket:', data);
      // Convert timestamps for all messages
      if (data.messages && Array.isArray(data.messages)) {
        data.messages = data.messages.map((msg: any) => ({
          ...msg,
          timestamp: typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : msg.timestamp
        }));
      }
      this.chatHistorySubject.next(data);
    });

    // Listen for chat history error
    this.socket.on('chat-history-error', (data: any) => {
      console.error('❌ Chat history error:', data);
      this.chatHistorySubject.error(data);
    });

    // Listen for message status updates
    this.socket.on('message-status-update', (data: any) => {
      this.messageStatusUpdateSubject.next(data);
    });

    // Listen for messages seen
    this.socket.on('messages-seen', (data: any) => {
      this.messagesSeenSubject.next(data);
    });

    // Listen for typing
    this.socket.on('typing', (data: any) => {
      this.typingSubject.next(data);
    });

    // Listen for message edited
    this.socket.on('message-edited', (data: any) => {
      this.messageEditedSubject.next(data);
    });

    // Listen for message deleted
    this.socket.on('message-deleted', (data: any) => {
      this.messageDeletedSubject.next(data);
    });

    // Listen for user online
    this.socket.on('user-online', (data: any) => {
      this.userOnlineSubject.next(data);
    });

    // Listen for user offline
    this.socket.on('user-offline', (data: any) => {
      this.userOfflineSubject.next(data);
    });

    // Listen for online status
    this.socket.on('online-status', (data: any) => {
      this.onlineStatusSubject.next(data);
    });
  }

  // Connection status
  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatusSubject.asObservable();
  }

  // Listen for socket connection
  onConnect(): Observable<void> {
    return new Observable(observer => {
      if (this.socket.connected) {
        observer.next();
        observer.complete();
      }
      
      const handler = () => {
        observer.next();
        observer.complete();
      };
      
      this.socket.once('connect', handler);
      
      return () => {
        this.socket.off('connect', handler);
      };
    });
  }

  // Join with user info
  join(userId: string, name: string): void {
    if (this.socket.connected) {
      console.log('🔵 Joining socket room with userId:', userId, 'name:', name);
      this.socket.emit('join', { userId, name });
    } else {
      console.warn('⚠️ Socket not connected, waiting for connection...');
      this.socket.once('connect', () => {
        console.log('🔵 Socket connected, now joining room with userId:', userId);
        this.socket.emit('join', { userId, name });
      });
    }
  }

  // Check if socket is connected
  isConnected(): boolean {
    return this.socket && this.socket.connected;
  }

  // Get socket ID
  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  // Send message
  sendMessage(data: { senderId: string; receiverId: string; message: string; replyTo?: string }): void {
    if (this.socket.connected) {
      console.log('📤📤📤 SENDING MESSAGE VIA SOCKET 📤📤📤', data);
      this.socket.emit('send-message', data);
    } else {
      console.error('❌ Cannot send message: Socket not connected');
      alert('Connection lost. Please refresh the page.');
    }
  }

  // Listen for received messages - using Subject for real-time updates
  onReceiveMessage(): Observable<any> {
    return this.receiveMessageSubject.asObservable();
  }

  // Listen for message sent confirmation - using Subject for real-time updates
  onMessageSent(): Observable<any> {
    return this.messageSentSubject.asObservable();
  }

  // Listen for message status updates
  onMessageStatusUpdate(): Observable<any> {
    return this.messageStatusUpdateSubject.asObservable();
  }

  // Mark messages as seen
  markMessagesAsSeen(messageIds: string[], userId: string): void {
    this.socket.emit('message-seen', { messageIds, userId });
  }

  // Listen for messages seen notification
  onMessagesSeen(): Observable<any> {
    return this.messagesSeenSubject.asObservable();
  }

  // Typing indicator
  typing(senderId: string, receiverId: string, isTyping: boolean): void {
    this.socket.emit('typing', { senderId, receiverId, isTyping });
  }

  // Listen for typing
  onTyping(): Observable<any> {
    return this.typingSubject.asObservable();
  }

  // Edit message
  editMessage(messageId: string, newMessage: string, userId: string): void {
    this.socket.emit('edit-message', { messageId, newMessage, userId });
  }

  // Listen for message edited
  onMessageEdited(): Observable<any> {
    return this.messageEditedSubject.asObservable();
  }

  // Delete message
  deleteMessage(messageId: string, userId: string, deleteFor: 'me' | 'both'): void {
    this.socket.emit('delete-message', { messageId, userId, deleteFor });
  }

  // Listen for message deleted
  onMessageDeleted(): Observable<any> {
    return this.messageDeletedSubject.asObservable();
  }

  // Get online status
  getOnlineStatus(userId: string): void {
    this.socket.emit('get-online-status', { userId });
  }

  // Listen for online status
  onOnlineStatus(): Observable<any> {
    return this.onlineStatusSubject.asObservable();
  }

  // Listen for user online
  onUserOnline(): Observable<any> {
    return this.userOnlineSubject.asObservable();
  }

  // Listen for user offline
  onUserOffline(): Observable<any> {
    return this.userOfflineSubject.asObservable();
  }

  // Load chat history via socket
  loadChatHistory(userId1: string, userId2: string): void {
    if (this.socket.connected) {
      console.log('📥 Requesting chat history via socket:', userId1, userId2);
      this.socket.emit('load-chat-history', { userId1, userId2 });
    } else {
      console.error('Cannot load chat history: Socket not connected');
    }
  }

  // Listen for chat history loaded
  onChatHistoryLoaded(): Observable<any> {
    return this.chatHistorySubject.asObservable();
  }

  // Disconnect
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
