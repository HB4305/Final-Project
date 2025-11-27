import React, { useState } from 'react';
import { Lock, Bell, Binary as Privacy } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    bidNotifications: true,
    marketingEmails: false,
    twoFactorAuth: false,
    privateProfile: false
  });

  const handleToggle = (key) => {
    setSettings({...settings, [key]: !settings[key]});
  };

  return (
    <div className="min-h-screen bg-background pt-24">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

        {/* Password Section */}
        <div className="bg-background border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold">Security</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Current Password</label>
              <input 
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">New Password</label>
              <input 
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Confirm Password</label>
              <input 
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium">
              Update Password
            </button>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-background border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold">Notifications</h2>
          </div>
          <div className="space-y-4">
            {[
              { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive updates about your auctions' },
              { key: 'bidNotifications', label: 'Bid Notifications', desc: 'Get notified when you\'re outbid' },
              { key: 'marketingEmails', label: 'Marketing Emails', desc: 'Receive special offers and promotions' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                <button 
                  onClick={() => handleToggle(item.key)}
                  className={`relative w-12 h-6 rounded-full transition ${settings[item.key] ? 'bg-primary' : 'bg-muted'}`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition transform ${settings[item.key] ? 'translate-x-6' : ''}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Section */}
        <div className="bg-background border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Privacy className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold">Privacy</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div>
                <p className="font-medium">Private Profile</p>
                <p className="text-sm text-muted-foreground">Hide your profile from public view</p>
              </div>
              <button 
                onClick={() => handleToggle('privateProfile')}
                className={`relative w-12 h-6 rounded-full transition ${settings.privateProfile ? 'bg-primary' : 'bg-muted'}`}
              >
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition transform ${settings.privateProfile ? 'translate-x-6' : ''}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Add extra security to your account</p>
              </div>
              <button 
                onClick={() => handleToggle('twoFactorAuth')}
                className={`relative w-12 h-6 rounded-full transition ${settings.twoFactorAuth ? 'bg-primary' : 'bg-muted'}`}
              >
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition transform ${settings.twoFactorAuth ? 'translate-x-6' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
