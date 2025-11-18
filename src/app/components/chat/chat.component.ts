import { Component, OnInit, OnDestroy } from '@angular/core';
import { ChatService, Message, User } from '../../services/chat.service';
import { SocketService } from '../../services/socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  selectedUser: User | null = null;
  users: User[] = [];
  messages: Message[] = [];
  typingUsers: Set<string> = new Set();
  onlineUsers: Set<string> = new Set();
  userLastSeen: Map<string, Date> = new Map();

  private subscriptions: Subscription[] = [];

  constructor(
    private chatService: ChatService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.initializeUser();
    this.setupSocketListeners();
    this.loadUsers();
  }

  initializeUser(): void {
    // Get or create current user (you can modify this to get from login)
    const userId = localStorage.getItem('userId') || `user_${Date.now()}`;
    const userName = localStorage.getItem('userName') || `User ${userId.slice(-4)}`;
    
    localStorage.setItem('userId', userId);
    localStorage.setItem('userName', userName);

    this.currentUser = {
      userId,
      name: userName,
      isOnline: true,
      lastSeen: new Date()
    };

    this.chatService.createOrUpdateUser(this.currentUser).subscribe(user => {
      this.currentUser = user;
      this.socketService.join(user.userId, user.name);
    });
  }

  setupSocketListeners(): void {
    // Listen for received messages
    this.subscriptions.push(
      this.socketService.onReceiveMessage().subscribe((message: Message) => {
        if (this.selectedUser && 
            (message.senderId === this.selectedUser.userId || message.receiverId === this.selectedUser.userId)) {
          this.messages.push(message);
          this.sortMessages();
          
          // Mark as delivered if current user is receiver
          if (message.receiverId === this.currentUser?.userId) {
            setTimeout(() => {
              this.markMessageAsSeen(message._id!);
            }, 1000);
          }
        }
      })
    );

    // Listen for message sent confirmation
    this.subscriptions.push(
      this.socketService.onMessageSent().subscribe((message: Message) => {
        const index = this.messages.findIndex(m => !m._id);
        if (index !== -1) {
          this.messages[index] = message;
        } else {
          this.messages.push(message);
        }
        this.sortMessages();
      })
    );

    // Listen for message status updates
    this.subscriptions.push(
      this.socketService.onMessageStatusUpdate().subscribe((data: { messageId: string; status: string }) => {
        const message = this.messages.find(m => m._id === data.messageId);
        if (message) {
          message.status = data.status as any;
        }
      })
    );

    // Listen for messages seen
    this.subscriptions.push(
      this.socketService.onMessagesSeen().subscribe((data: { messageIds: string[]; seenBy: string }) => {
        data.messageIds.forEach(messageId => {
          const message = this.messages.find(m => m._id === messageId);
          if (message) {
            message.status = 'seen';
          }
        });
      })
    );

    // Listen for typing
    this.subscriptions.push(
      this.socketService.onTyping().subscribe((data: { userId: string; isTyping: boolean }) => {
        if (data.isTyping) {
          this.typingUsers.add(data.userId);
        } else {
          this.typingUsers.delete(data.userId);
        }
      })
    );

    // Listen for message edited
    this.subscriptions.push(
      this.socketService.onMessageEdited().subscribe((data: { messageId: string; newMessage: string; isEdited: boolean }) => {
        const message = this.messages.find(m => m._id === data.messageId);
        if (message) {
          message.message = data.newMessage;
          message.isEdited = true;
        }
      })
    );

    // Listen for message deleted
    this.subscriptions.push(
      this.socketService.onMessageDeleted().subscribe((data: { messageId: string }) => {
        this.messages = this.messages.filter(m => m._id !== data.messageId);
      })
    );

    // Listen for user online
    this.subscriptions.push(
      this.socketService.onUserOnline().subscribe((data: { userId: string }) => {
        this.onlineUsers.add(data.userId);
        const user = this.users.find(u => u.userId === data.userId);
        if (user) {
          user.isOnline = true;
        }
      })
    );

    // Listen for user offline
    this.subscriptions.push(
      this.socketService.onUserOffline().subscribe((data: { userId: string }) => {
        this.onlineUsers.delete(data.userId);
        const user = this.users.find(u => u.userId === data.userId);
        if (user) {
          user.isOnline = false;
          user.lastSeen = new Date();
          this.userLastSeen.set(data.userId, user.lastSeen);
        }
      })
    );
  }

  loadUsers(): void {
    this.chatService.getAllUsers().subscribe(users => {
      this.users = users.filter(u => u.userId !== this.currentUser?.userId);
      users.forEach(user => {
        if (user.isOnline) {
          this.onlineUsers.add(user.userId);
        }
        this.userLastSeen.set(user.userId, user.lastSeen);
      });
    });
  }

  selectUser(user: User): void {
    this.selectedUser = user;
    this.loadChatHistory();
    this.socketService.getOnlineStatus(user.userId);
  }

  loadChatHistory(): void {
    if (!this.currentUser || !this.selectedUser) return;

    this.chatService.getChatHistory(this.currentUser.userId, this.selectedUser.userId)
      .subscribe(messages => {
        this.messages = messages;
        this.sortMessages();
        
        // Mark unread messages as seen
        const unreadMessages = messages.filter(
          m => m.receiverId === this.currentUser?.userId && m.status !== 'seen'
        );
        if (unreadMessages.length > 0) {
          const messageIds = unreadMessages.map(m => m._id!).filter(id => id);
          if (messageIds.length > 0) {
            setTimeout(() => {
              this.markMessagesAsSeen(messageIds);
            }, 1000);
          }
        }
      });
  }

  markMessageAsSeen(messageId: string): void {
    if (this.currentUser) {
      this.markMessagesAsSeen([messageId]);
    }
  }

  markMessagesAsSeen(messageIds: string[]): void {
    if (this.currentUser && messageIds.length > 0) {
      this.socketService.markMessagesAsSeen(messageIds, this.currentUser.userId);
    }
  }

  sendMessage(data: { message: string; replyTo?: Message }): void {
    const { message: messageText, replyTo } = data;
    if (!this.currentUser || !this.selectedUser || !messageText.trim()) return;

    const tempMessage: Message = {
      chatRoomId: '',
      senderId: this.currentUser.userId,
      receiverId: this.selectedUser.userId,
      message: messageText,
      status: 'sent',
      timestamp: new Date(),
      replyTo,
      isEdited: false,
      deletedFor: [],
      deleteType: 'none'
    };

    this.messages.push(tempMessage);
    this.sortMessages();

    this.socketService.sendMessage({
      senderId: this.currentUser.userId,
      receiverId: this.selectedUser.userId,
      message: messageText,
      replyTo: replyTo?._id
    });
  }

  onSendMessage(data: { message: string; replyTo?: Message }): void {
    this.sendMessage(data);
    this.replyToMessage = null; // Clear reply after sending
  }

  editMessage(message: Message, newText: string): void {
    if (this.currentUser && message.senderId === this.currentUser.userId) {
      this.socketService.editMessage(message._id!, newText, this.currentUser.userId);
    }
  }

  deleteMessage(message: Message, deleteFor: 'me' | 'both'): void {
    if (this.currentUser) {
      this.socketService.deleteMessage(message._id!, this.currentUser.userId, deleteFor);
    }
  }

  onTyping(isTyping: boolean): void {
    if (this.currentUser && this.selectedUser) {
      this.socketService.typing(this.currentUser.userId, this.selectedUser.userId, isTyping);
    }
  }

  replyToMessage: Message | null = null;

  handleReply(event: { message: Message; replyText: string }): void {
    this.replyToMessage = event.message;
    // Focus on input to allow user to type reply
  }

  sortMessages(): void {
    this.messages.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeA - timeB;
    });
  }

  isUserTyping(): boolean {
    if (!this.selectedUser) return false;
    return this.typingUsers.has(this.selectedUser.userId);
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  getLastSeen(userId: string): Date | null {
    return this.userLastSeen.get(userId) || null;
  }

  formatLastSeen(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.socketService.disconnect();
  }
}

