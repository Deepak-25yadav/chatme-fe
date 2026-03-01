import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'StreamPlay';

  private keepAliveTimer: any;

  // ── Render free tier cold-start fix ─────────────────────────────────────────
  // Pings the /health endpoint every 10 minutes so the server never sleeps.
  // Render sleeps after 15 min of inactivity — 10 min interval keeps it warm.
  private readonly PING_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.startKeepAlive();
  }

  ngOnDestroy(): void {
    this.stopKeepAlive();
  }

  private startKeepAlive(): void {
    // Ping immediately on app load (wakes server if it was sleeping)
    this.pingServer();

    // Then ping every 10 minutes while any tab is open
    this.keepAliveTimer = setInterval(() => {
      this.pingServer();
    }, this.PING_INTERVAL_MS);

    console.log('[KeepAlive] Started — pinging server every 10 minutes');
  }

  private stopKeepAlive(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
    }
  }

  private pingServer(): void {
    const url = `${environment.apiUrl}/health`;
    this.http.get(url).subscribe({
      next: (res: any) => {
        console.log('[KeepAlive] Server is warm ✅', res?.timestamp);
      },
      error: (err) => {
        console.warn('[KeepAlive] Ping failed (server might be waking up...)', err?.status);
      }
    });
  }
}
