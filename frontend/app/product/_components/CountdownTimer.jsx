import { Clock } from 'lucide-react';
import { useCountdown } from './hooks';
import { URGENT_HOURS_THRESHOLD } from './constants';

export default function CountdownTimer({ endAt }) {
  const time = useCountdown(endAt);
  
  if (time.isEnded) {
    return (
      <div className="bg-red-100 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-600 font-bold text-lg">Phiên đấu giá đã kết thúc</p>
      </div>
    );
  }

  const isUrgent = time.days === 0 && time.hours < URGENT_HOURS_THRESHOLD;

  return (
    <div className={`rounded-lg p-4 ${isUrgent ? 'bg-red-50 border border-red-200' : 'bg-orange-50 border border-orange-200'}`}>
      <div className="flex items-center gap-2 mb-3">
        <Clock className={`w-5 h-5 ${isUrgent ? 'text-red-500' : 'text-orange-500'}`} />
        <span className={`font-semibold ${isUrgent ? 'text-red-600' : 'text-orange-600'}`}>
          {isUrgent ? '⏰ Sắp kết thúc!' : 'Thời gian còn lại'}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          { value: time.days, label: 'Ngày' },
          { value: time.hours, label: 'Giờ' },
          { value: time.minutes, label: 'Phút' },
          { value: time.seconds, label: 'Giây' }
        ].map((item, idx) => (
          <div key={idx} className="bg-white rounded-lg p-2 shadow-sm">
            <p className={`text-2xl font-bold ${isUrgent ? 'text-red-600' : 'text-orange-600'}`}>
              {String(item.value).padStart(2, '0')}
            </p>
            <p className="text-xs text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
