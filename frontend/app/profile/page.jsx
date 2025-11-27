import React, { useState } from 'react';
import { User, Mail, Calendar, MapPin, Star, Edit2, Save, X } from 'lucide-react';
import Navigation from '../../components/navigation';

export default function ProfilePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [currentUser, setCurrentUser] = useState({ name: 'John Doe' });
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    location: 'San Francisco, CA',
    joinDate: 'January 15, 2023',
    avatar: '/placeholder.svg?key=avatar1',
    bio: 'Passionate collector and seasoned bidder',
    rating: 4.8,
    reviews: 127,
    totalBids: 342,
    totalWon: 23,
    totalSold: 15
  });

  const [editForm, setEditForm] = useState(profile);

  const handleSave = () => {
    setProfile(editForm);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditForm(profile);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} currentUser={currentUser} setCurrentUser={setCurrentUser} />
      <div className="pt-24">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-background border border-border rounded-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-4">
              <img 
                src={profile.avatar || "/placeholder.svg"} 
                alt={profile.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-primary"
              />
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium"
                >
                  <Edit2 className="w-4 h-4" /> Edit Profile
                </button>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input 
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Bio</label>
                    <textarea 
                      value={editForm.bio}
                      onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Location</label>
                    <input 
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleSave}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium"
                    >
                      <Save className="w-4 h-4" /> Save
                    </button>
                    <button 
                      onClick={handleCancel}
                      className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition font-medium"
                    >
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-bold mb-2">{profile.name}</h1>
                  <p className="text-muted-foreground mb-4">{profile.bio}</p>
                  <div className="flex flex-wrap gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>Joined {profile.joinDate}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Rating Card */}
            <div className="bg-muted rounded-lg p-4 text-center min-w-max">
              <div className="flex items-center justify-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-5 h-5 ${i < Math.floor(profile.rating) ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}`} />
                ))}
              </div>
              <p className="text-lg font-bold">{profile.rating}</p>
              <p className="text-xs text-muted-foreground">Based on {profile.reviews} reviews</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-background border border-border rounded-lg p-6 text-center">
            <p className="text-3xl font-bold text-primary mb-1">{profile.totalBids}</p>
            <p className="text-sm text-muted-foreground">Total Bids</p>
          </div>
          <div className="bg-background border border-border rounded-lg p-6 text-center">
            <p className="text-3xl font-bold text-primary mb-1">{profile.totalWon}</p>
            <p className="text-sm text-muted-foreground">Items Won</p>
          </div>
          <div className="bg-background border border-border rounded-lg p-6 text-center">
            <p className="text-3xl font-bold text-primary mb-1">{profile.totalSold}</p>
            <p className="text-sm text-muted-foreground">Items Sold</p>
          </div>
          <div className="bg-background border border-border rounded-lg p-6 text-center">
            <p className="text-3xl font-bold text-primary mb-1">Verified</p>
            <p className="text-sm text-muted-foreground">Member Status</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border mb-6">
          <div className="flex gap-4">
            <button className="px-4 py-2 border-b-2 border-primary text-primary font-medium">
              Recent Feedback
            </button>
            <button className="px-4 py-2 border-b-2 border-transparent text-muted-foreground hover:text-foreground font-medium">
              Account Settings
            </button>
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="space-y-4">
          <div className="bg-background border border-border rounded-lg p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold">Sarah Johnson</p>
                <p className="text-xs text-muted-foreground">Buyer - 2 weeks ago</p>
              </div>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Great seller! Item arrived perfectly packaged and matches description.</p>
          </div>

          <div className="bg-background border border-border rounded-lg p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold">Michael Chen</p>
                <p className="text-xs text-muted-foreground">Buyer - 1 month ago</p>
              </div>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Fast shipping and authentic product. Highly recommended!</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
