import React from "react";
import {
  Heart,
  Search,
  User,
  LogOut,
  LogIn,
  Menu,
  X,
  ChevronRight,
  Zap,
} from "lucide-react";
import Navigation from "../components/navigation";
import FeaturedProducts from "../components/featured-products";
import CategoryNav from "../components/category-nav";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="pt-32">
        {/* Category Navigation */}
        <CategoryNav />
        <section className="bg-gradient-to-r from-primary via-red-500 to-orange-500 text-white py-10 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Main Promo */}
              <div className="md:col-span-2 bg-black/20 rounded-lg p-8 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5" />
                  <span className="text-sm font-bold">FLASH DEALS TODAY</span>
                </div>
                <h2 className="text-4xl font-bold mb-2">Grab Hot Items</h2>
                <p className="text-white/90 mb-6 text-lg">
                  Limited time offers on premium auctions
                </p>
                <button className="w-fit px-6 py-2 bg-white text-primary rounded hover:bg-gray-100 transition font-bold">
                  Shop Now →
                </button>
              </div>

              {/* Side Promos */}
              <div className="flex flex-col gap-4">
                <div className="bg-black/20 rounded-lg p-4 text-center">
                  <div className="text-sm text-white/80 mb-1">Up to</div>
                  <div className="text-3xl font-bold mb-1">70%</div>
                  <div className="text-xs text-white/80">
                    Off Selected Items
                  </div>
                </div>
                <div className="bg-black/20 rounded-lg p-4 text-center">
                  <div className="text-sm text-white/80 mb-1">
                    Free Shipping
                  </div>
                  <div className="text-2xl font-bold mb-1">Today</div>
                  <div className="text-xs text-white/80">All Orders</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <FeaturedProducts />

        {/* Stats Section */}
        <section className="bg-white py-12 px-4 border-t border-border">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">5,234</div>
              <p className="text-sm text-muted-foreground">Active Auctions</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">48.2K</div>
              <p className="text-sm text-muted-foreground">Happy Buyers</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">$2.3M</div>
              <p className="text-sm text-muted-foreground">Total Value</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">99.8%</div>
              <p className="text-sm text-muted-foreground">Positive Rating</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-primary to-red-500 text-white py-12 px-4 mt-8">
          <div className="max-w-7xl mx-auto text-center">
            <h3 className="text-3xl font-bold mb-4">Ready to Start Bidding?</h3>
            <p className="text-white/90 mb-6 text-lg">
              Join thousands of smart shoppers finding amazing deals
            </p>
            <button className="px-8 py-3 bg-white text-primary rounded font-bold hover:bg-gray-100 transition">
              Create Account
            </button>
          </div>
        </section>
      </main>

      <footer className="bg-foreground text-white py-12 px-4 mt-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-bold mb-4">About Us</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <a href="#" className="hover:text-white transition">
                  About AuctionHub
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Blog
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Follow Us</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <a href="#" className="hover:text-white transition">
                  Facebook
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Instagram
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Twitter
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-400 border-t border-gray-700 pt-8">
          <p>&copy; 2025 AuctionHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
