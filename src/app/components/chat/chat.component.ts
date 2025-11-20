import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { ChatService, Message, User } from '../../services/chat.service';
import { SocketService } from '../../services/socket.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  currentUser: User | null = null;
  selectedUser: User | null = null;
  users: User[] = [];
  messages: Message[] = [];
  typingUsers: Set<string> = new Set();
  onlineUsers: Set<string> = new Set();
  userLastSeen: Map<string, Date> = new Map();

  private subscriptions: Subscription[] = [];
  private shouldScroll = false;
  
  @ViewChild('messageContainer') private messageContainer?: ElementRef;

  constructor(
    private chatService: ChatService,
    private socketService: SocketService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('🚀 Chat component initialized');
    // Initialize user first (this will join socket room)
    this.initializeUser();
    // Setup socket listeners (they will work once user is initialized)
    this.setupSocketListeners();
    // Load users list
    this.loadUsers();
  }

  initializeUser(): void {
    console.log('👤 Initializing user...');
    const userSub = this.authService.currentUser$.subscribe((user: any) => {
      if (user) {
        console.log('✅ User found:', user.userId);
        this.currentUser = {
          userId: user.userId,
          name: user.name,
          email: user.email,
          isOnline: true,
          lastSeen: new Date()
        };
        
        // Join socket room - wait for connection if needed
        this.socketService.onConnect().subscribe(() => {
          console.log('✅ Socket connected, joining room for user:', user.userId);
          this.socketService.join(user.userId, user.name);
        });
        
        // Also try to join immediately if already connected
        if (this.socketService.isConnected()) {
          console.log('Socket already connected, joining immediately');
          this.socketService.join(user.userId, user.name);
        }
        
        // Unsubscribe after first emission
        userSub.unsubscribe();
      } else {
        console.warn('⚠️ No user found in AuthService');
      }
    });
    
    this.subscriptions.push(userSub);
  }

  setupSocketListeners(): void {
    console.log('🔧 Setting up socket listeners...');
    
    // ===== LISTEN FOR RECEIVED MESSAGES (INCOMING FROM OTHER USERS) =====
    this.subscriptions.push(
      this.socketService.onReceiveMessage().subscribe((message: Message) => {
        console.log('📨📨📨 ===== RECEIVED MESSAGE VIA SOCKET =====');
        console.log('Message data:', JSON.stringify(message, null, 2));
        console.log('Current user ID:', this.currentUser?.userId);
        console.log('Selected user ID:', this.selectedUser?.userId);
        console.log('Message sender ID:', message.senderId);
        console.log('Message receiver ID:', message.receiverId);
        
        // Ensure currentUser is set
        if (!this.currentUser) {
          console.warn('⚠️ Current user not set, waiting 500ms...');
          setTimeout(() => this.handleReceivedMessage(message), 500);
          return;
        }
        
        // Handle the received message
        this.handleReceivedMessage(message);
      })
    );

    // ===== LISTEN FOR MESSAGE SENT CONFIRMATION (FOR SENDER) =====
    this.subscriptions.push(
      this.socketService.onMessageSent().subscribe((message: Message) => {
        console.log('✅✅✅ ===== MESSAGE SENT CONFIRMATION =====');
        console.log('Confirmed message:', JSON.stringify(message, null, 2));
        
        // Find and replace the temporary message
        const tempIndex = this.messages.findIndex(m => 
          !m._id && 
          m.senderId === message.senderId && 
          m.receiverId === message.receiverId &&
          m.message === message.message &&
          Math.abs(new Date(m.timestamp).getTime() - new Date(message.timestamp).getTime()) < 10000 // Within 10 seconds
        );
        
        if (tempIndex !== -1) {
          console.log('🔄 Replacing temp message at index:', tempIndex);
          // Replace temp message with confirmed message
          this.messages[tempIndex] = { ...message };
        } else {
          // Check if message already exists (by _id)
          const existsIndex = this.messages.findIndex(m => m._id === message._id);
          if (existsIndex === -1) {
            console.log('➕ Adding new confirmed message (temp not found)');
            this.messages.push({ ...message });
          } else {
            console.log('🔄 Updating existing message at index:', existsIndex);
            this.messages[existsIndex] = { ...message };
          }
        }
        
        // Sort and update UI
        this.sortMessages();
        this.cdr.detectChanges();
        console.log('✅ Message list updated. Total messages:', this.messages.length);
      })
    );

    // Listen for message status updates
    this.subscriptions.push(
      this.socketService.onMessageStatusUpdate().subscribe((data: { messageId: string; status: string }) => {
        const message = this.messages.find(m => m._id === data.messageId);
        if (message) {
          message.status = data.status as any;
          this.cdr.detectChanges();
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
        this.cdr.detectChanges();
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
        this.cdr.detectChanges();
      })
    );

    // Listen for message edited
    this.subscriptions.push(
      this.socketService.onMessageEdited().subscribe((data: { messageId: string; newMessage: string; isEdited: boolean }) => {
        const message = this.messages.find(m => m._id === data.messageId);
        if (message) {
          message.message = data.newMessage;
          message.isEdited = true;
          this.cdr.detectChanges();
        }
      })
    );

    // Listen for message deleted
    this.subscriptions.push(
      this.socketService.onMessageDeleted().subscribe((data: { messageId: string }) => {
        this.messages = this.messages.filter(m => m._id !== data.messageId);
        this.cdr.detectChanges();
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
        this.cdr.detectChanges();
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
        this.cdr.detectChanges();
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
        const lastSeenDate = typeof user.lastSeen === 'string' 
          ? new Date(user.lastSeen) 
          : user.lastSeen;
        this.userLastSeen.set(user.userId, lastSeenDate);
      });
      this.cdr.detectChanges();
    });
  }

  selectUser(user: User): void {
    console.log('👤 Selecting user:', user.userId);
    this.selectedUser = user;
    // Clear current messages
    this.messages = [];
    // Load chat history
    this.loadChatHistory();
    this.socketService.getOnlineStatus(user.userId);
    
    // Verify socket connection
    if (!this.socketService.isConnected()) {
      console.warn('⚠️ Socket not connected when selecting user');
    } else {
      console.log('✅ Socket is connected, socket ID:', this.socketService.getSocketId());
    }
  }

  // ===== HANDLE RECEIVED MESSAGE - CRITICAL FOR REAL-TIME MESSAGING =====
  private handleReceivedMessage(message: Message): void {
    if (!this.currentUser) {
      console.error('❌ Cannot handle message: currentUser is null');
      return;
    }

    // Check if message is for current user (either as sender or receiver)
    const isForCurrentUser = message.senderId === this.currentUser.userId || 
                             message.receiverId === this.currentUser.userId;
    
    if (!isForCurrentUser) {
      console.log('⚠️ Message not for current user, ignoring');
      return;
    }
    
    // Determine the other user in the conversation
    const otherUserId = message.senderId === this.currentUser.userId 
      ? message.receiverId 
      : message.receiverId;
    
    console.log('🔍 Checking if message should be displayed...');
    console.log('  - Other user ID:', otherUserId);
    console.log('  - Selected user ID:', this.selectedUser?.userId);
    
    // Check if message is for current chat (if a chat is selected)
    const isForCurrentChat = this.selectedUser && 
        (message.senderId === this.selectedUser.userId || message.receiverId === this.selectedUser.userId);
    
    if (isForCurrentChat) {
      // Message is for the currently selected chat - ADD IT IMMEDIATELY
      const exists = this.messages.some(m => m._id === message._id);
      if (!exists) {
        console.log('✅✅✅ ADDING MESSAGE TO UI IN REAL-TIME ✅✅✅');
        console.log('  - Message ID:', message._id);
        console.log('  - Message text:', message.message);
        console.log('  - Current messages count:', this.messages.length);
        
        // Create a new array reference to trigger change detection
        this.messages = [...this.messages, { ...message }];
        this.sortMessages();
        
        // Force change detection to update UI immediately
        this.cdr.detectChanges();
        
        console.log('  - New messages count:', this.messages.length);
        console.log('✅ Message successfully added to UI');
        
        // Mark as delivered if current user is receiver
        if (message.receiverId === this.currentUser.userId) {
          setTimeout(() => {
            this.markMessageAsSeen(message._id!);
          }, 1000);
        }
      } else {
        console.log('⚠️ Message already exists in current chat, skipping duplicate');
      }
    } else {
      // Message is for current user but not for currently selected chat
      console.log(`ℹ️ Message received for user ${otherUserId} but not currently viewing that chat.`);
      console.log('   Message will be shown when user selects that chat.');
      // Don't add to messages array - it will be loaded when user selects that chat
    }
  }

  loadChatHistory(): void {
    if (!this.currentUser || !this.selectedUser) {
      console.log('Cannot load chat history: missing currentUser or selectedUser');
      return;
    }

    console.log('📥 ===== LOADING CHAT HISTORY VIA SOCKET =====');
    console.log('Current user:', this.currentUser.userId);
    console.log('Selected user:', this.selectedUser.userId);
    
    // Load via socket
    if (this.socketService.isConnected()) {
      // Request chat history via socket
      this.socketService.loadChatHistory(this.currentUser.userId, this.selectedUser.userId);
      
      // Listen for chat history response (one-time)
      const historySub = this.socketService.onChatHistoryLoaded().subscribe({
        next: (data: { userId1: string; userId2: string; messages: Message[] }) => {
          // Check if this is for the currently selected user
          const isForCurrentChat = 
            (data.userId1 === this.currentUser?.userId && data.userId2 === this.selectedUser?.userId) ||
            (data.userId2 === this.currentUser?.userId && data.userId1 === this.selectedUser?.userId);
          
          if (isForCurrentChat) {
            console.log('✅ Chat history loaded via socket:', data.messages.length, 'messages');
            // Replace messages array with loaded history
            this.messages = [...data.messages];
            this.sortMessages();
            this.cdr.detectChanges();
            
            // Mark unread messages as seen
            const unreadMessages = data.messages.filter(
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
          }
          
          // Unsubscribe after first response
          historySub.unsubscribe();
        },
        error: (error) => {
          console.error('Error loading chat history via socket:', error);
          // Fallback to API if socket fails
          this.loadChatHistoryFromAPI();
          historySub.unsubscribe();
        }
      });
      
      this.subscriptions.push(historySub);
    } else {
      console.warn('Socket not connected, using API fallback');
      this.loadChatHistoryFromAPI();
    }
  }

  // Fallback to API if socket fails
  private loadChatHistoryFromAPI(): void {
    if (!this.currentUser || !this.selectedUser) return;
    
    console.log('📥 Loading chat history from API (fallback)');
    this.chatService.getChatHistory(this.currentUser.userId, this.selectedUser.userId)
      .subscribe({
        next: (messages) => {
          console.log('Loaded messages from API:', messages.length, 'messages');
          this.messages = [...messages];
          this.sortMessages();
          this.cdr.detectChanges();
          
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
        },
        error: (error) => {
          console.error('Error loading chat history from API:', error);
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
    
    // Validation
    if (!this.currentUser || !this.selectedUser || !messageText.trim()) {
      console.warn('❌ Cannot send message: missing user or message text');
      return;
    }

    if (!this.socketService.isConnected()) {
      console.error('❌ Cannot send message: socket not connected');
      alert('Connection lost. Please refresh the page.');
      return;
    }

    console.log('📤📤📤 ===== SENDING MESSAGE =====');
    console.log('Sender:', this.currentUser.userId);
    console.log('Receiver:', this.selectedUser.userId);
    console.log('Message:', messageText);

    // Create temporary message for immediate UI update
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

    // Add temp message to UI immediately (optimistic update)
    console.log('➕ Adding temp message to UI immediately');
    this.messages = [...this.messages, tempMessage];
    this.sortMessages();
    this.cdr.detectChanges();
    console.log('✅ Temp message added. Total messages:', this.messages.length);

    // Send via socket
    this.socketService.sendMessage({
      senderId: this.currentUser.userId,
      receiverId: this.selectedUser.userId,
      message: messageText,
      replyTo: replyTo?._id
    });
    
    console.log('📤 Message sent via socket, waiting for confirmation...');
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
  }

  sortMessages(): void {
    this.messages.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeA - timeB;
    });
    this.shouldScroll = true;
  }

  isUserTyping(): boolean {
    if (!this.selectedUser) return false;
    return this.typingUsers.has(this.selectedUser.userId);
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  getLastSeen(userId: string): Date | string | null {
    return this.userLastSeen.get(userId) || null;
  }

  formatLastSeen(date: Date | string | null | undefined): string {
    if (!date) return 'Unknown';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) return 'Unknown';
    
    const now = new Date();
    const diff = now.getTime() - dateObj.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return dateObj.toLocaleDateString();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.messageContainer) {
        this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Scroll error:', err);
    }
  }

  logout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    console.log('🧹 Cleaning up chat component...');
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.socketService.disconnect();
  }
}
