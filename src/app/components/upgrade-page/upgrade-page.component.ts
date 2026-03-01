import { Component } from '@angular/core';

@Component({
  selector: 'app-upgrade-page',
  templateUrl: './upgrade-page.component.html',
  styleUrls: ['./upgrade-page.component.css']
})
export class UpgradePageComponent {
  plans = [
    {
      name: 'Free',
      price: '₹0',
      period: 'forever',
      icon: '🎵',
      color: 'plan-free',
      features: ['10 plays/day', 'Ads supported', 'SD quality', 'Browse all content'],
      current: true,
    },
    {
      name: 'Premium',
      price: '₹99',
      period: '/month',
      icon: '⚡',
      color: 'plan-premium',
      features: ['Unlimited plays', 'Ad-free experience', 'HD quality', 'Offline mode', 'Priority support'],
      current: false,
      popular: true,
    },
    {
      name: 'Pro',
      price: '₹199',
      period: '/month',
      icon: '👑',
      color: 'plan-pro',
      features: ['Everything in Premium', '4K Ultra HD', 'Family sharing (6 users)', 'Early access features', 'Download unlimited'],
      current: false,
    }
  ];
}
