import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, OnChanges, SimpleChanges } from '@angular/core';
import { User, Message } from '../../services/chat.service';

@Component({
  selector: 'app-message-input',
  templateUrl: './message-input.component.html',
  styleUrls: ['./message-input.component.css']
})
export class MessageInputComponent implements OnChanges {
  @Input() selectedUser: User | null = null;
  @Input() replyTo: Message | null = null;
  @Output() sendMessage = new EventEmitter<{ message: string; replyTo?: Message }>();
  @Output() typing = new EventEmitter<boolean>();

  messageText: string = '';
  showEmojiPicker: boolean = false;
  replyToMessage: Message | null = null;
  typingTimeout: any;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['replyTo'] && this.replyTo) {
      this.replyToMessage = this.replyTo;
    }
  }

  commonEmojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '👋', '🤚', '🖐', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💣', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤', '👋', '🤚', '🖐', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄'];

  @ViewChild('messageInput', { static: false }) messageInput!: ElementRef;

  onInput(): void {
    if (this.messageText.trim()) {
      this.typing.emit(true);
      clearTimeout(this.typingTimeout);
      this.typingTimeout = setTimeout(() => {
        this.typing.emit(false);
      }, 1000);
    } else {
      this.typing.emit(false);
    }
  }

  send(): void {
    if (this.messageText.trim() && this.selectedUser) {
      const replyTo = this.replyToMessage || this.replyTo;
      this.sendMessage.emit({
        message: this.messageText.trim(),
        replyTo: replyTo || undefined
      });
      this.messageText = '';
      this.replyToMessage = null;
      this.typing.emit(false);
      this.showEmojiPicker = false;
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  addEmoji(emoji: string): void {
    this.messageText += emoji;
    this.showEmojiPicker = false;
    if (this.messageInput) {
      this.messageInput.nativeElement.focus();
    }
  }

  cancelReply(): void {
    this.replyToMessage = null;
  }

  setReplyTo(message: Message): void {
    this.replyToMessage = message;
    if (this.messageInput) {
      this.messageInput.nativeElement.focus();
    }
  }
}

