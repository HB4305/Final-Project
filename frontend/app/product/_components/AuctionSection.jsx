import { useState } from 'react';
import { Gavel, Clock, Zap, ArrowRight, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CountdownTimer from './CountdownTimer';
import { useCountdown } from './hooks';
import { formatPrice } from './utils';

export default function AuctionSection({ auction, onPlaceBid }) {
  const time = useCountdown(auction?.endAt);
  const [bidAmount, setBidAmount] = useState('');
  const [showBidForm, setShowBidForm] = useState(false);
  const { currentUser: user } = useAuth();
  const navigate = useNavigate();

  const minBid = (auction?.currentPrice || 0) + (auction?.priceStep || 50000);

  const handleBidChange = (e) => {
    // Remove non-digits
    const rawValue = e.target.value.replace(/\D/g, '');
    // Format with dots
    const formatted = rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    setBidAmount(formatted);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const rawAmount = parseInt(bidAmount.replace(/\./g, ''));
    if (rawAmount >= minBid) {
      onPlaceBid(rawAmount);
      setBidAmount('');
      setShowBidForm(false);
    }
  };

  return (
    <div className="glass-card border border-white/20 rounded-2xl p-6 space-y-6 shadow-2xl relative overflow-hidden bg-[#1e293b]/80 backdrop-blur-xl">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Gavel size={120} />
      </div>

      {/* Current Price */}
      <div className="relative">
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Giá cao nhất hiện tại
          </span>
        </div>
        <p className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
          {formatPrice(auction?.currentPrice)}
        </p>
      </div>

      {/* Price Details */}
      <div className="grid grid-cols-2 gap-4 text-sm bg-black/20 p-4 rounded-xl border border-white/10 backdrop-blur-sm relative">
        <div>
          <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Giá khởi điểm</p>
          <p className="font-bold text-white text-lg">{formatPrice(auction?.startPrice)}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Bước giá</p>
          <p className="font-bold text-white text-lg">{formatPrice(auction?.priceStep)}</p>
        </div>
      </div>

      {/* Buy Now Price */}
      {auction?.buyNowPrice && (
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-green-700 flex items-center gap-1">
              <Zap className="w-4 h-4 fill-current" /> Mua ngay
            </p>
            <p className="text-2xl font-bold text-green-400">
              {formatPrice(auction.buyNowPrice)}
            </p>
          </div>
          <button 
            onClick={() => {
              if (!user) {
                navigate('/auth/login');
                return;
              }
              // TODO: Implement Buy Now logic
            }}
            className="px-5 py-2.5 bg-green-600 text-white rounded-xl shadow-lg shadow-green-600/20 hover:bg-green-700 hover:scale-105 transition-all font-bold text-sm">
            Mua Ngay
          </button>
        </div>
      )}

      {/* Bid Stats & Timer */}
      <div className="space-y-4">
        <div className="flex items-center justify-between py-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/5 rounded-lg">
              <Gavel className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="font-bold text-white text-lg">{auction?.bidCount || 0}</p>
              <p className="text-xs text-muted-foreground">Lượt đấu giá</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-right">
            <div>
              <p className={`font-bold text-lg ${time.isEnded ? 'text-red-500' : 'text-primary'}`}>
                {time.isEnded ? "Đã Đóng" : "Đang Diễn Ra"}
              </p>
              <p className="text-xs text-muted-foreground">Trạng thái</p>
            </div>
            <div className={`p-2 rounded-lg ${time.isEnded ? 'bg-red-500/10' : 'bg-primary/10'}`}>
              <Clock className={`w-5 h-5 ${time.isEnded ? 'text-red-600' : 'text-primary'}`} />
            </div>
          </div>
        </div>

        {/* Countdown */}
        {!time.isEnded && (
          <div className="mt-4">
            <CountdownTimer endAt={auction?.endAt} />
          </div>
        )}
      </div>

      {/* Bid Buttons */}
      {!time.isEnded && (
        <div className="space-y-3 pt-2">
          {!showBidForm ? (
            <button
              onClick={() => {
                if (!user) {
                  navigate('/auth/login');
                  return;
                }
                setShowBidForm(true);
              }}
              className="w-full py-5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-2xl hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:scale-[1.02] active:scale-95 transition-all font-bold text-xl flex items-center justify-center gap-3 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <Gavel className="w-6 h-6" /> Đặt giá ngay
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 animate-slide-up">
              <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
                <p className="text-sm text-blue-200">
                  <span className="font-bold">💡 Đấu giá tự động:</span> Nhập mức giá tối đa bạn sẵn sàng trả. Hệ thống sẽ tự động tăng giá giúp bạn.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-300 flex justify-between">
                  Giá tối đa
                  <span className="text-primary">Tối thiểu: {formatPrice(minBid)}</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={bidAmount}
                    onChange={handleBidChange}
                    placeholder={formatPrice(minBid).replace(' ₫', '')}
                    className="w-full pl-4 pr-12 py-3.5 border border-white/20 rounded-xl bg-white/5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-lg font-bold shadow-sm transition-all text-white placeholder-gray-500"
                    autoFocus
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">VND</div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition font-bold shadow-lg shadow-primary/20"
                >
                  Xác nhận
                </button>
                <button
                  type="button"
                  onClick={() => setShowBidForm(false)}
                  className="px-6 py-3 bg-white/5 text-gray-300 rounded-xl hover:bg-white/10 transition font-medium"
                >
                  Hủy
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
