import { Clock } from 'lucide-react';
import { useCountdown } from './hooks';
import { URGENT_HOURS_THRESHOLD } from './constants';

export default function CountdownTimer({ endAt }) {
  const time = useCountdown(endAt);
  
  if (time.isEnded) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-center">
        <p className="text-red-400 font-bold text-lg">Phiên đấu giá đã kết thúc</p>
      </div>
    );
  }

  const isUrgent = time.days === 0 && time.hours < URGENT_HOURS_THRESHOLD;

  return (
    <div className={`rounded-xl p-6 ${isUrgent ? 'bg-red-900/10 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-blue-900/10 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]'}`}>
      <div className="flex items-center justify-center gap-2 mb-4">
        <Clock className={`w-5 h-5 ${isUrgent ? 'text-red-500 animate-pulse' : 'text-blue-400'}`} />
        <span className={`font-bold uppercase tracking-wider text-sm ${isUrgent ? 'text-red-400' : 'text-blue-300'}`}>
          {isUrgent ? '⏰ Sắp kết thúc!' : 'Thời gian còn lại'}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-3 text-center">
        {[
          { value: time.days, label: 'Ngày' },
          { value: time.hours, label: 'Giờ' },
          { value: time.minutes, label: 'Phút' },
          { value: time.seconds, label: 'Giây' }
        ].map((item, idx) => (
          <div key={idx} className={`rounded-xl p-3 border backdrop-blur-sm ${isUrgent ? 'bg-red-950/40 border-red-500/30 text-red-400' : 'bg-black/40 border-white/10 text-white'}`}>
            <p className={`text-2xl md:text-3xl font-bold mb-1 ${isUrgent ? 'text-red-400' : 'text-white'}`}>
              {String(item.value).padStart(2, '0')}
            </p>
            <p className={`text-[10px] uppercase font-bold ${isUrgent ? 'text-red-500/70' : 'text-gray-500'}`}>{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
