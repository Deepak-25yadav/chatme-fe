import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { ChatComponent } from './components/chat/chat.component';
import { AuthGuard } from './guards/auth.guard';

// Music feature
import { MusicShellComponent } from './components/music-shell/music-shell.component';
import { HomePageComponent } from './components/home-page/home-page.component';
import { Mp4PageComponent } from './components/mp4-page/mp4-page.component';
import { Mp3PageComponent } from './components/mp3-page/mp3-page.component';
import { ReelsPageComponent } from './components/reels-page/reels-page.component';
import { UpgradePageComponent } from './components/upgrade-page/upgrade-page.component';

const routes: Routes = [
  // Auth routes
  { path: 'login',  component: LoginComponent },
  { path: 'signup', component: SignupComponent },

  // Chat (original, guarded)
  { path: 'chat', component: ChatComponent, canActivate: [AuthGuard] },

  // Music app — public, no auth required
  {
    path: 'music',
    component: MusicShellComponent,
    children: [
      { path: '',        component: HomePageComponent },
      { path: 'mp4',    component: Mp4PageComponent },
      { path: 'mp3',    component: Mp3PageComponent },
      { path: 'reels',  component: ReelsPageComponent },
      { path: 'upgrade', component: UpgradePageComponent },
    ]
  },

  // Default → music home
  { path: '',   redirectTo: '/music', pathMatch: 'full' },
  { path: '**', redirectTo: '/music' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
