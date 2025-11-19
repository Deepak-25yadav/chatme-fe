import { Component, Input, Output, EventEmitter } from '@angular/core';
import { User } from '../../services/chat.service';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent {
  @Input() users: User[] = [];
  @Input() currentUser: User | null = null;
  @Input() selectedUser: User | null = null;
  @Input() onlineUsers: Set<string> = new Set();
  @Input() userLastSeen: Map<string, Date> = new Map();
  @Output() userSelected = new EventEmitter<User>();

  selectUser(user: User): void {
    this.userSelected.emit(user);
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  formatLastSeen(date: Date | string | null | undefined): string {
    if (!date) return 'Unknown';
    
    // Convert to Date object if it's a string
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if valid date
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
}

