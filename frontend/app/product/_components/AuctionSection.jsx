import { useState } from 'react';
import { Gavel } from 'lucide-react';
import CountdownTimer from './CountdownTimer';
import { useCountdown } from './hooks';
import { formatPrice } from './utils';

export default function AuctionSection({ auction, onPlaceBid }) {
  const time = useCountdown(auction?.endAt);
  const [bidAmount, setBidAmount] = useState('');
  const [showBidForm, setShowBidForm] = useState(false);

  const minBid = (auction?.currentPrice || 0) + (auction?.priceStep || 50000);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (parseInt(bidAmount) >= minBid) {
      onPlaceBid(parseInt(bidAmount));
      setBidAmount('');
      setShowBidForm(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6 space-y-4">
      {/* Current Price */}
      <div>
        <p className="text-sm text-muted-foreground">Giá hiện tại</p>
        <p className="text-4xl font-bold text-primary">
          {formatPrice(auction?.currentPrice)}
        </p>
      </div>

      {/* Price Details */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Giá khởi điểm</p>
          <p className="font-semibold">{formatPrice(auction?.startPrice)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Bước giá</p>
          <p className="font-semibold">{formatPrice(auction?.priceStep)}</p>
        </div>
      </div>

      {/* Buy Now Price */}
      {auction?.buyNowPrice && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-600">Mua ngay với giá</p>
          <p className="text-2xl font-bold text-green-600">
            {formatPrice(auction.buyNowPrice)}
          </p>
        </div>
      )}

      {/* Bid Stats */}
      <div className="flex items-center gap-4 py-3 border-y border-border">
        <div className="flex items-center gap-2">
          <Gavel className="w-5 h-5 text-primary" />
          <span className="font-semibold">{auction?.bidCount || 0}</span>
          <span className="text-muted-foreground">lượt đấu giá</span>
        </div>
      </div>

      {/* Countdown */}
      <CountdownTimer endAt={auction?.endAt} />

      {/* Bid Buttons */}
      {!time.isEnded && (
        <div className="space-y-3">
          {!showBidForm ? (
            <>
              <button
                onClick={() => setShowBidForm(true)}
                className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-bold text-lg"
              >
                🔨 Đặt giá tự động
              </button>
              {auction?.buyNowPrice && (
                <button className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-bold">
                  ⚡ Mua ngay - {formatPrice(auction.buyNowPrice)}
                </button>
              )}
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-3">
                <p className="text-sm text-blue-800">
                  <strong>Đấu giá tự động:</strong> Nhập mức giá tối đa bạn sẵn sàng trả. Hệ thống sẽ tự động tăng giá giúp bạn (vừa đủ để thắng) cho đến mức này.
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Giá tối đa bạn muốn trả (tối thiểu: {formatPrice(minBid)})
                </label>
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  min={minBid}
                  step={auction?.priceStep || 50000}
                  placeholder={formatPrice(minBid)}
                  className="w-full mt-1 px-4 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary text-lg font-bold"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-bold"
                >
                  Thiết lập giá tối đa
                </button>
                <button
                  type="button"
                  onClick={() => setShowBidForm(false)}
                  className="px-4 py-3 border border-border rounded-lg hover:bg-muted transition"
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
