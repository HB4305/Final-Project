import React, { useState } from 'react';
import { Heart, Gavel, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navigation from '../../components/navigation';

const dashboardTabs = ['My Bids', 'Watchlist', 'Won Items', 'Selling'];

const mockBids = [
  {
    id: 1,
    name: 'Vintage Rolex Watch',
    currentBid: 2450,
    yourBid: 2450,
    timeLeft: '2h 15m',
    image: '/vintage-rolex.jpg'
  },
  {
    id: 2,
    name: 'Gaming PC',
    currentBid: 1850,
    yourBid: 1700,
    timeLeft: '5h 30m',
    image: '/gaming-pc.jpg'
  }
];

const mockWatchlist = [
  { id: 3, name: 'Designer Handbag', currentBid: 450, timeLeft: '1h 45m' },
  { id: 4, name: 'Antique Lamp', currentBid: 180, timeLeft: '12h 30m' }
];

export default function DashboardPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [currentUser, setCurrentUser] = useState({ name: 'John Doe' });
  const [activeTab, setActiveTab] = useState('My Bids');

  return (
    <div className="min-h-screen bg-background">
      <Navigation isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} currentUser={currentUser} setCurrentUser={setCurrentUser} />
      <div className="pt-24">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Dashboard</h1>
          <p className="text-muted-foreground">Manage your auctions and bids</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-background border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Active Bids</p>
                <p className="text-3xl font-bold">2</p>
              </div>
              <Gavel className="w-8 h-8 text-primary opacity-50" />
            </div>
          </div>
          <div className="bg-background border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Watchlist</p>
                <p className="text-3xl font-bold">5</p>
              </div>
              <Heart className="w-8 h-8 text-primary opacity-50" />
            </div>
          </div>
          <div className="bg-background border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Won</p>
                <p className="text-3xl font-bold">3</p>
              </div>
              <CheckCircle className="w-8 h-8 text-primary opacity-50" />
            </div>
          </div>
          <div className="bg-background border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Seller Rating</p>
                <p className="text-3xl font-bold">4.8</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary opacity-50" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-border mb-8 overflow-x-auto pb-4">
          {dashboardTabs.map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium whitespace-nowrap border-b-2 transition ${
                activeTab === tab 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-background border border-border rounded-lg p-6">
          {activeTab === 'My Bids' && (
            <div className="space-y-4">
              {mockBids.map((item) => (
                <Link 
                  key={item.id}
                  to={`/product/${item.id}`}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted transition"
                >
                  <div className="flex items-center gap-4">
                    <img src={item.image || "/placeholder.svg"} alt={item.name} className="w-20 h-20 rounded-lg object-cover" />
                    <div>
                      <h3 className="font-semibold mb-1">{item.name}</h3>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>Current: ${item.currentBid}</span>
                        <span className="text-primary font-semibold">Your Bid: ${item.yourBid}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-500 font-semibold">{item.timeLeft}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {activeTab === 'Watchlist' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockWatchlist.map((item) => (
                <Link 
                  key={item.id}
                  to={`/product/${item.id}`}
                  className="p-4 border border-border rounded-lg hover:bg-muted transition"
                >
                  <h3 className="font-semibold mb-3">{item.name}</h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current: ${item.currentBid}</span>
                    <span className="text-primary font-semibold">{item.timeLeft}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {activeTab === 'Won Items' && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No won items yet. Keep bidding!</p>
            </div>
          )}

          {activeTab === 'Selling' && (
            <div>
              <button className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium mb-4">
                + List New Item
              </button>
              <p className="text-muted-foreground">You haven't listed any items yet.</p>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
