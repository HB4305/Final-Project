import { AlertTriangle, X, Check } from "lucide-react";
import { formatPrice } from "./utils";

import { createPortal } from "react-dom";

export default function BidConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    bidAmount,
    productName
}) {
    if (!isOpen) return null;

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in ring-1 ring-white/10">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6 text-yellow-500" />
                        Xác nhận đặt giá
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <p className="text-gray-300">
                        Bạn đang chuẩn bị đặt giá cho sản phẩm:
                        <br />
                        <span className="font-bold text-white block mt-1 text-lg">{productName || "Sản phẩm này"}</span>
                    </p>

                    <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
                        <p className="text-sm text-primary uppercase font-bold mb-1">Mức giá của bạn</p>
                        <p className="text-3xl font-bold text-primary">{formatPrice(bidAmount)}</p>
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-sm text-yellow-200">
                        <p className="font-bold mb-1 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> Lưu ý quan trọng:
                        </p>
                        <ul className="list-disc list-inside space-y-1 opacity-90">
                            <li>Đặt giá là một cam kết ràng buộc.</li>
                            <li>Nếu thắng, bạn có trách nhiệm thanh toán cho sản phẩm này.</li>
                            <li>Hệ thống sẽ tự động đấu giá giúp bạn lên đến mức giá này.</li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 flex gap-3 bg-black/20">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-3 px-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                    >
                        <Check className="w-5 h-5" />
                        Xác nhận đặt giá
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
