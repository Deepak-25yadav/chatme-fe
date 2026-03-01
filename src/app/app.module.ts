import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// ── Existing chat components ───────────────────────────────────────────────
import { ChatComponent } from './components/chat/chat.component';
import { UserListComponent } from './components/user-list/user-list.component';
import { MessageListComponent } from './components/message-list/message-list.component';
import { MessageInputComponent } from './components/message-input/message-input.component';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';

// ── Music feature components ───────────────────────────────────────────────
import { MusicShellComponent } from './components/music-shell/music-shell.component';
import { MusicListComponent } from './components/music-list/music-list.component';
import { MusicModalComponent } from './components/music-modal/music-modal.component';
import { HomePageComponent } from './components/home-page/home-page.component';
import { Mp4PageComponent } from './components/mp4-page/mp4-page.component';
import { Mp3PageComponent } from './components/mp3-page/mp3-page.component';
import { ReelsPageComponent } from './components/reels-page/reels-page.component';
import { UpgradePageComponent } from './components/upgrade-page/upgrade-page.component';

// ── Pipes ──────────────────────────────────────────────────────────────────
import { SafePipe } from './pipes/safe.pipe';

// ── Interceptors ───────────────────────────────────────────────────────────
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { ErrorInterceptor } from './interceptors/error.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    // Chat
    ChatComponent,
    UserListComponent,
    MessageListComponent,
    MessageInputComponent,
    LoginComponent,
    SignupComponent,
    // Music
    MusicShellComponent,
    MusicListComponent,
    MusicModalComponent,
    HomePageComponent,
    Mp4PageComponent,
    Mp3PageComponent,
    ReelsPageComponent,
    UpgradePageComponent,
    // Pipes
    SafePipe,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor,  multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
