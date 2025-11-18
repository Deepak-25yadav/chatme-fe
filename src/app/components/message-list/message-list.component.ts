import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { Message, User } from '../../services/chat.service';

@Component({
  selector: 'app-message-list',
  templateUrl: './message-list.component.html',
  styleUrls: ['./message-list.component.css']
})
export class MessageListComponent implements OnInit, OnChanges, AfterViewChecked, OnDestroy {
  @Input() messages: Message[] = [];
  @Input() currentUser: User | null = null;
  @Input() selectedUser: User | null = null;
  @Input() isTyping: boolean = false;
  @Output() editMessage = new EventEmitter<{ message: Message; newText: string }>();
  @Output() deleteMessage = new EventEmitter<{ message: Message; deleteFor: 'me' | 'both' }>();
  @Output() replyToMessage = new EventEmitter<{ message: Message; replyText: string }>();

  @ViewChild('messageContainer', { static: false }) messageContainer!: ElementRef;

  editingMessageId: string | null = null;
  editingText: string = '';
  showMenuForMessage: string | null = null;
  groupedMessages: any[] = [];

  ngOnInit(): void {
    this.groupMessages();
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  groupMessages(): void {
    this.groupedMessages = [];
    let currentGroup: any = null;

    this.messages.forEach((message, index) => {
      if (this.isMessageDeleted(message)) {
        return;
      }

      const messageDate = new Date(message.timestamp);
      const prevMessage = index > 0 ? this.messages[index - 1] : null;
      const prevDate = prevMessage ? new Date(prevMessage.timestamp) : null;

      // Check if we need a date separator
      const needsDateSeparator = !prevDate || 
        messageDate.toDateString() !== prevDate.toDateString();

      // Check if this message belongs to the current group
      const isSameSender = prevMessage && 
        prevMessage.senderId === message.senderId &&
        !this.isMessageDeleted(prevMessage);
      const timeDiff = prevDate ? 
        (messageDate.getTime() - prevDate.getTime()) / 1000 / 60 : Infinity;
      const shouldGroup = isSameSender && timeDiff < 5; // Group messages within 5 minutes

      if (needsDateSeparator || !shouldGroup) {
        if (currentGroup) {
          this.groupedMessages.push(currentGroup);
        }
        currentGroup = {
          date: messageDate,
          messages: [message]
        };
      } else {
        currentGroup.messages.push(message);
      }
    });

    if (currentGroup) {
      this.groupedMessages.push(currentGroup);
    }
  }

  isMessageDeleted(message: Message): boolean {
    if (!this.currentUser) return false;
    if (message.deleteType === 'for_both') return true;
    if (message.deleteType === 'for_me' && message.deletedFor.includes(this.currentUser.userId)) {
      return true;
    }
    return false;
  }

  formatDate(date: Date): string {
    const today = new Date();
    const messageDate = new Date(date);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  isMyMessage(message: Message): boolean {
    return this.currentUser?.userId === message.senderId;
  }

  getMessageStatusIcon(message: Message): string {
    if (!this.isMyMessage(message)) return '';
    
    switch (message.status) {
      case 'sent':
        return '✓'; // Single tick
      case 'delivered':
        return '✓✓'; // Double tick
      case 'seen':
        return '✓✓'; // Double tick (blue in WhatsApp)
      default:
        return '';
    }
  }

  getMessageStatusClass(message: Message): string {
    if (!this.isMyMessage(message)) return '';
    
    if (message.status === 'seen') {
      return 'seen';
    }
    return '';
  }

  startEdit(message: Message): void {
    this.editingMessageId = message._id!;
    this.editingText = message.message;
    this.showMenuForMessage = null;
  }

  cancelEdit(): void {
    this.editingMessageId = null;
    this.editingText = '';
  }

  saveEdit(message: Message): void {
    if (this.editingText.trim() && this.editingText !== message.message) {
      this.editMessage.emit({ message, newText: this.editingText });
    }
    this.cancelEdit();
  }

  deleteForMe(message: Message): void {
    this.deleteMessage.emit({ message, deleteFor: 'me' });
    this.showMenuForMessage = null;
  }

  deleteForBoth(message: Message): void {
    this.deleteMessage.emit({ message, deleteFor: 'both' });
    this.showMenuForMessage = null;
  }

  replyTo(message: Message): void {
    // This will be handled by parent component
    this.replyToMessage.emit({ message, replyText: '' });
    this.showMenuForMessage = null;
  }

  toggleMenu(messageId: string): void {
    this.showMenuForMessage = this.showMenuForMessage === messageId ? null : messageId;
  }

  scrollToBottom(): void {
    try {
      if (this.messageContainer) {
        this.messageContainer.nativeElement.scrollTop = 
          this.messageContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      // Ignore
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['messages']) {
      this.groupMessages();
    }
  }
}

