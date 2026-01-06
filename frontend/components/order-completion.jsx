import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  Circle,
  Package,
  CreditCard,
  Truck,
  Star,
} from "lucide-react";
import { orderService } from "../app/services/orderService.js";
import Toast from "./Toast";

/**
 * OrderCompletion Component
 * 4-step post-auction checkout process (section 7)
 */
export default function OrderCompletion({
  order,
  userRole, // 'buyer' or 'seller'
  ratings,
  onUpdateOrder,
  setToast,
}) {
  // const [toast, setToast] = useState(null); // Removed local state using prop instead
  const [currentStep, setCurrentStep] = useState(() => {
    // Calculate step based on status if not explicitly provided
    if (order.status === "awaiting_payment") {
      // If proof exists, move to step 2 (waiting for seller confirmation)
      if (order.buyerPaymentProof?.url || order.paymentProof) return 2;
      return 1;
    }
    if (order.status === "seller_confirmed_payment") return 2;
    if (order.status === "shipped") return 2;
    if (order.status === "completed") return 4;
    if (order.status === "cancelled") return 0;
    return 1;
  });

  // Sync step when order updates
  useEffect(() => {
    if (order.status === "awaiting_payment") {
      if (order.buyerPaymentProof?.url || order.paymentProof) {
        setCurrentStep(2);
      } else {
        setCurrentStep(1);
      }
    } else if (
      order.status === "seller_confirmed_payment" ||
      order.status === "shipped"
    ) {
      if (order.status === "shipped") {
        setCurrentStep(3);
      } else {
        setCurrentStep(2);
      }
    } else if (order.status === "completed") {
      setCurrentStep(4);
    }
  }, [
    order.status,
    order.buyerPaymentProof,
    order.paymentProof,
    order.shippingInfo,
  ]);

  const [formData, setFormData] = useState({
    // Step 1 - Buyer
    paymentProof: order.buyerPaymentProof?.url || "",
    shippingAddress: order.metadata?.shippingAddress || order.shippingAddress || "",
    // Step 2 - Seller
    shippingTrackingNumber: order.shippingInfo?.trackingNumber || "",
    shippingCarrier: order.shippingInfo?.carrier || "",
  });

  const [hasRated, setHasRated] = useState(false);

  useEffect(() => {
    if (!ratings) {
      setHasRated(false);
      return;
    }
    if (userRole === "buyer" && ratings.buyerRating) {
      setHasRated(true);
    } else if (userRole === "seller" && ratings.sellerRating) {
      setHasRated(true);
    } else {
      setHasRated(false);
    }
  }, [ratings, userRole]);

  const steps = [
    {
      id: 1,
      title: "Thanh toán & Địa chỉ",
      description: "Người mua cung cấp thông tin thanh toán và giao hàng",
      icon: CreditCard,
      actor: "buyer",
    },
    {
      id: 2,
      title: "Xác nhận & Gửi hàng",
      description: "Người bán xác nhận thanh toán và gửi hàng",
      icon: Truck,
      actor: "seller",
    },
    {
      id: 3,
      title: "Xác nhận nhận hàng",
      description: "Người mua xác nhận đã nhận được hàng",
      icon: Package,
      actor: "buyer",
    },
    {
      id: 4,
      title: "Đánh giá giao dịch",
      description: "Hai bên đánh giá lẫn nhau",
      icon: Star,
      actor: "both",
    },
  ];

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    if (!formData.paymentProof || !formData.shippingAddress) {
      setToast({
        message: "Vui lòng cung cấp bằng chứng thanh toán và địa chỉ giao hàng",
        type: "error",
      });
      return;
    }

    try {
      await orderService.submitPayment(order._id, {
        paymentProofUrl: formData.paymentProof,
        paymentNote: "Đã chuyển khoản",
        shippingAddress: formData.shippingAddress,
      });
      const updatedOrder = { ...order, ...formData, currentStep: 2 };
      onUpdateOrder && onUpdateOrder(updatedOrder);
      setCurrentStep(2);
      setToast({
        message: "Gửi thông tin thanh toán thành công.",
        type: "success",
      });
    } catch (error) {
      const errorMsg = error.message || "Gửi thông tin thanh toán thất bại";
      const details = error.errors
        ? `\nChi tiết: ${error.errors.join(", ")}`
        : "";
      setToast({ message: `Lỗi: ${errorMsg}${details}`, type: "error" });
    }
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();

    if (!formData.shippingCarrier || !formData.shippingTrackingNumber) {
      setToast({
        message: "Vui lòng cung cấp thông tin vận chuyển",
        type: "error",
      });
      return;
    }

    try {
      await orderService.confirmPayment(order._id);

      await orderService.markAsShipped(order._id, {
        shippingCarrier: formData.shippingCarrier,
        trackingNumber: formData.shippingTrackingNumber,
        shippingNote: "Đóng gói cẩn thận",
      });

      const updatedOrder = { ...order, ...formData, currentStep: 3 };
      onUpdateOrder && onUpdateOrder(updatedOrder);
      setCurrentStep(3);
      setToast({
        message: "Đã xác nhận thanh toán và đánh dấu đã gửi hàng.",
        type: "success",
      });
    } catch (error) {
      setToast({
        message:
          "Lỗi: " +
          (error.message || "Không thể xác nhận thanh toán và gửi hàng"),
        type: "error",
      });
    }
  };

  const handleStep3Submit = async (e) => {
    e.preventDefault();
    try {
      await orderService.confirmDelivery(order._id, {
        receivedNote: "Đã nhận hàng",
      });

      const updatedOrder = { ...order, ...formData, currentStep: 4 };
      onUpdateOrder && onUpdateOrder(updatedOrder);
      setCurrentStep(4);
      setToast({
        message: "Đã xác nhận nhận hàng thành công.",
        type: "success",
      });
    } catch (error) {
      setToast({
        message: "Lỗi: " + (error.message || "Không thể xác nhận nhận hàng"),
        type: "error",
      });
    }
  };

  const handleCancelTransaction = async () => {
    const reason = prompt("Vui lòng nhập lý do hủy đơn hàng:");

    if (!reason) return;

    if (window.confirm("Bạn có chắc chắn muốn hủy giao dịch này không?")) {
      try {
        await orderService.cancelOrder(order._id, reason);
        onUpdateOrder &&
          onUpdateOrder({
            ...order,
            status: "cancelled",
            cancelledBy: userRole,
          });
        setToast({ message: "Đã hủy đơn hàng", type: "success" });
      } catch (error) {
        setToast({
          message: "Lỗi: " + (error.message || "Không thể hủy đơn hàng"),
          type: "error",
        });
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Order Header */}
      <div className="bg-transparent mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2 text-white">Hoàn tất đơn hàng</h2>
            <p className="text-gray-400">Đơn hàng #{order._id}</p>
          </div>
          {userRole === "seller" && currentStep < 4 && (
            <button
              onClick={handleCancelTransaction}
              className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition text-sm font-medium"
            >
              Hủy giao dịch
            </button>
          )}
        </div>

        {/* Product Info */}
        <div className="flex gap-4 p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
          <img
            src={
              order.productId?.primaryImageUrl || order.product?.primaryImageUrl
            }
            alt={order.productId?.title || order.product?.title}
            className="w-20 h-20 object-cover rounded-lg border border-white/10"
          />
          <div className="flex-1">
            <h3 className="font-bold text-white text-lg">
              {order.productId?.title || order.product?.title}
            </h3>
            <p className="text-sm text-gray-400">
              Giá cuối cùng:{" "}
              <span className="text-blue-400 font-bold text-lg">
                {(order.finalPrice || 0).toLocaleString("vi-VN")}{" "}
                {order.currency || "VND"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center flex-1 relative z-10">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-all duration-300 font-bold ${isCompleted
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-4 ring-blue-600/20"
                        : isCurrent
                          ? "bg-white text-blue-600 ring-4 ring-white/20 scale-110"
                          : "bg-white/5 text-gray-500 border border-white/10"
                      }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <StepIcon className="w-6 h-6" />
                    )}
                  </div>
                  <p
                    className={`text-xs font-bold text-center uppercase tracking-wider ${isCurrent ? "text-blue-400" : "text-gray-500"
                      }`}
                  >
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 h-[2px] mx-2 relative -top-4">
                    <div className="absolute inset-0 bg-white/10 rounded-full"></div>
                    <div
                      className={`absolute inset-0 bg-blue-600 rounded-full transition-all duration-500 ${isCompleted ? "w-full" : "w-0"
                        }`}
                    ></div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
        {/* Step 1: Buyer Payment & Address */}
        {currentStep === 1 && userRole === "buyer" && (
          <form onSubmit={handleStep1Submit} className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">
                Bước 1: Thông tin thanh toán & Giao hàng
              </h3>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    paymentProof: "https://placehold.co/600x400/png",
                    shippingAddress:
                      "123 Đường Test, Quận 1, TP.HCM - 0909123456",
                  }))
                }
                className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-gray-300 transition"
              >
                Điền mẫu
              </button>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Bằng chứng thanh toán (URL hóa đơn/biên lai hoặc Ảnh)
              </label>
              <input
                type="text"
                value={formData.paymentProof}
                onChange={(e) =>
                  setFormData({ ...formData, paymentProof: e.target.value })
                }
                placeholder="Nhập URL bằng chứng thanh toán hoặc tải lên biên lai"
                className="w-full px-4 py-3 border border-white/10 rounded-xl bg-black/20 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Địa chỉ giao hàng
              </label>
              <textarea
                value={formData.shippingAddress}
                onChange={(e) =>
                  setFormData({ ...formData, shippingAddress: e.target.value })
                }
                placeholder="Nhập địa chỉ giao hàng đầy đủ của bạn"
                rows="4"
                className="w-full px-4 py-3 border border-white/10 rounded-xl bg-black/20 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500 resize-none transition"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full px-4 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/20 transition font-bold text-lg"
            >
              Gửi thông tin thanh toán
            </button>
          </form>
        )}

        {currentStep === 1 && userRole === "seller" && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-gray-500" />
            </div>
            <p className="text-gray-400 text-lg">
              Đang chờ người mua cung cấp thông tin thanh toán và giao hàng...
            </p>
          </div>
        )}

        {/* Step 2: Seller Confirm Payment & Ship */}
        {currentStep === 2 && userRole === "seller" && (
          <form onSubmit={handleStep2Submit} className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">
                Bước 2: Xác nhận thanh toán & Gửi hàng
              </h3>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    shippingCarrier: "Vietnam Post",
                    shippingTrackingNumber:
                      "VNP" + Math.floor(Math.random() * 1000000000),
                  }))
                }
                className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-gray-300 transition"
              >
                Điền mẫu
              </button>
            </div>

            <div className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-6">
              <h4 className="font-bold text-blue-300 mb-3">Thông tin người mua:</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-400 block mb-1">
                    Bằng chứng thanh toán:
                  </span>
                  <p className="font-medium text-white bg-black/20 p-2 rounded border border-white/5 break-all">{formData.paymentProof}</p>
                </div>
                <div>
                  <span className="text-gray-400 block mb-1">
                    Địa chỉ giao hàng:
                  </span>
                  <p className="font-medium text-white whitespace-pre-line bg-black/20 p-2 rounded border border-white/5">
                    {formData.shippingAddress}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Đơn vị vận chuyển
              </label>
              <select
                value={formData.shippingCarrier}
                onChange={(e) =>
                  setFormData({ ...formData, shippingCarrier: e.target.value })
                }
                className="w-full px-4 py-3 border border-white/10 rounded-xl bg-black/20 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white transition"
                required
              >
                <option value="" className="bg-gray-900">Chọn đơn vị vận chuyển...</option>
                <option value="USPS" className="bg-gray-900">USPS</option>
                <option value="FedEx" className="bg-gray-900">FedEx</option>
                <option value="UPS" className="bg-gray-900">UPS</option>
                <option value="DHL" className="bg-gray-900">DHL</option>
                <option value="Vietnam Post" className="bg-gray-900">Vietnam Post</option>
                <option value="Viettel Post" className="bg-gray-900">Viettel Post</option>
                <option value="Giao Hang Nhanh" className="bg-gray-900">Giao Hàng Nhanh</option>
                <option value="Giao Hang Tiet Kiem" className="bg-gray-900">Giao Hàng Tiết Kiệm</option>
                <option value="Other" className="bg-gray-900">Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Mã vận đơn
              </label>
              <input
                type="text"
                value={formData.shippingTrackingNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    shippingTrackingNumber: e.target.value,
                  })
                }
                placeholder="Nhập mã vận đơn"
                className="w-full px-4 py-3 border border-white/10 rounded-xl bg-black/20 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500 transition"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full px-4 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/20 transition font-bold text-lg"
            >
              Xác nhận thanh toán & Gửi hàng
            </button>
          </form>
        )}

        {currentStep === 2 && userRole === "buyer" && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Truck className="w-12 h-12 text-gray-500" />
            </div>
            <p className="text-gray-400 text-lg">
              Đang chờ người bán xác nhận thanh toán và gửi hàng...
            </p>
          </div>
        )}

        {/* Step 3: Buyer Confirm Receipt */}
        {currentStep === 3 && userRole === "buyer" && (
          <form onSubmit={handleStep3Submit} className="space-y-6">
            <h3 className="text-xl font-bold text-white mb-4">
              Bước 3: Xác nhận nhận hàng
            </h3>

            <div className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-6">
              <h4 className="font-bold text-blue-300 mb-3">Thông tin vận chuyển:</h4>
              <div className="space-y-3 text-sm">
                <p className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-gray-400">Đơn vị:</span>
                  <span className="font-bold text-white">
                    {formData.shippingCarrier}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span className="text-gray-400">Mã vận đơn:</span>
                  <span className="font-bold text-white">
                    {formData.shippingTrackingNumber}
                  </span>
                </p>
              </div>
            </div>

            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <p className="text-sm text-yellow-200">
                ⚠️ Vui lòng chỉ xác nhận sau khi bạn đã nhận và kiểm tra hàng. Sau
                khi xác nhận, bạn không thể hoàn tác hành động này.
              </p>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 hover:shadow-lg hover:shadow-green-600/20 transition font-bold text-lg"
            >
              Tôi xác nhận đã nhận được hàng
            </button>
          </form>
        )}

        {currentStep === 3 && userRole === "seller" && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-green-500" />
            </div>
            <p className="text-white font-bold text-xl mb-2">Hàng đã được gửi!</p>
            <div className="bg-white/5 inline-block px-4 py-2 rounded-lg border border-white/10 mb-4">
              <p className="text-sm text-gray-300">
                Mã vận đơn: <span className="text-white font-mono font-bold">{formData.shippingTrackingNumber}</span>
              </p>
            </div>
            <p className="text-gray-400 mt-4">
              Đang chờ người mua xác nhận nhận hàng...
            </p>
          </div>
        )}

        {/* Step 4: Ratings */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white mb-4">
              Bước 4: Đánh giá giao dịch
            </h3>

            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl mb-6 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <span className="font-bold text-green-400">
                Giao dịch hoàn tất thành công!
              </span>
            </div>

            {hasRated ? (
              <div className="text-center py-8 bg-white/5 rounded-xl border border-white/10">
                <Star
                  className="w-16 h-16 mx-auto text-yellow-400 mb-4"
                  fill="currentColor"
                />
                <h4 className="text-xl font-bold text-white mb-2">
                  Cảm ơn bạn đã đánh giá!
                </h4>
                <p className="text-gray-400">
                  Phản hồi của bạn giúp xây dựng niềm tin trong cộng đồng.
                </p>
              </div>
            ) : (
              <>
                <p className="text-gray-300">
                  Vui lòng đánh giá trải nghiệm của bạn với{" "}
                  <span className="font-bold text-white">{userRole === "buyer" ? "người bán" : "người mua"}</span>.
                </p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-3">
                      Điểm đánh giá
                    </label>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, ratingScore: 1 }))
                        }
                        className={`flex-1 py-4 px-6 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${formData.ratingScore === 1
                            ? "border-green-500 bg-green-500/20 text-green-400 shadow-lg shadow-green-500/10"
                            : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10"
                          }`}
                      >
                        <Star className="w-6 h-6 fill-current" />
                        <span className="font-bold">Tích cực (+1)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, ratingScore: -1 }))
                        }
                        className={`flex-1 py-4 px-6 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${formData.ratingScore === -1
                            ? "border-red-500 bg-red-500/20 text-red-400 shadow-lg shadow-red-500/10"
                            : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10"
                          }`}
                      >
                        <Star className="w-6 h-6" />
                        <span className="font-bold">Tiêu cực (-1)</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">
                      Nhận xét
                    </label>
                    <textarea
                      value={formData.ratingComment || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          ratingComment: e.target.value,
                        }))
                      }
                      placeholder="Chia sẻ trải nghiệm của bạn..."
                      rows="3"
                      className="w-full px-4 py-3 border border-white/10 rounded-xl bg-black/20 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500 resize-none transition"
                    />
                  </div>

                  <button
                    onClick={async () => {
                      if (!formData.ratingScore) {
                        setToast({
                          message: "Vui lòng chọn điểm đánh giá",
                          type: "error",
                        });
                        return;
                      }
                      try {
                        await orderService.rateTransaction(order._id, {
                          score: formData.ratingScore,
                          comment: formData.ratingComment || "",
                        });
                        setHasRated(true);
                      } catch (err) {
                        setToast({
                          message: "Lỗi khi gửi đánh giá: " + err.message,
                          type: "error",
                        });
                      }
                    }}
                    className="w-full px-4 py-4 bg-primary text-white rounded-xl hover:bg-primary/90 transition font-bold text-lg"
                  >
                    Gửi đánh giá
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
