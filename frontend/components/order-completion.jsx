import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Package, CreditCard, Truck, Star } from 'lucide-react';
import { orderService } from '../app/services/orderService.js';


/**
 * OrderCompletion Component
 * 4-step post-auction checkout process (section 7)
 * 1. Buyer provides payment invoice & shipping address
 * 2. Seller confirms payment received & provides shipping invoice
 * 3. Buyer confirms item received
 * 4. Both parties rate each other
 */
export default function OrderCompletion({ 
  order,
  userRole, // 'buyer' or 'seller'
  ratings, 
  onUpdateOrder 
}) {
  const [currentStep, setCurrentStep] = useState(() => {
    // Calculate step based on status if not explicitly provided
    if (order.status === 'awaiting_payment') {
      // If proof exists, move to step 2 (waiting for seller confirmation)
      if (order.buyerPaymentProof?.url || order.paymentProof) return 2;
      return 1;
    }
    if (order.status === 'seller_confirmed_payment') return 2;
    if (order.status === 'shipped') return 2; 
    if (order.status === 'completed') return 4; 
    if (order.status === 'cancelled') return 0;
    return 1;
  });

  // Sync step when order updates (e.g. after refetch)
  useEffect(() => {
    if (order.status === 'awaiting_payment') {
      if (order.buyerPaymentProof?.url || order.paymentProof) {
        setCurrentStep(2);
      } else {
        setCurrentStep(1);
      }
    } else if (order.status === 'seller_confirmed_payment' || order.status === 'shipped') {
        // If we are just entering step 2 from step 1, don't force it if we want to show specific sub-steps, 
        // but generally mapping status to step is safer.
        // However, Step 2 is shared for "Seller Confirm" and "Seller Ship".
        // If status is 'seller_confirmed_payment', seller needs to Ship. 
        // If status is 'shipped', we go to Step 3.
        if (order.status === 'shipped') {
             setCurrentStep(3);
        } else {
             setCurrentStep(2);
        }
    } else if (order.status === 'completed') {
      setCurrentStep(4);
    }
  }, [order.status, order.buyerPaymentProof, order.paymentProof, order.shippingInfo]);

  const [formData, setFormData] = useState({
    // Step 1 - Buyer
    paymentProof: order.buyerPaymentProof?.url || '',
    shippingAddress: order.metadata?.shippingAddress || '',
    // Step 2 - Seller
    shippingTrackingNumber: order.shippingInfo?.trackingNumber || '',
    shippingCarrier: order.shippingInfo?.carrier || ''
  });

  const [hasRated, setHasRated] = useState(() => {
    if (!ratings) return false;
    if (userRole === 'buyer' && ratings.buyerRating) return true;
    if (userRole === 'seller' && ratings.sellerRating) return true;
    return false;
  });

  const steps = [
    { 
      id: 1, 
      title: 'Payment & Address', 
      description: 'Buyer provides payment and shipping info',
      icon: CreditCard,
      actor: 'buyer'
    },
    { 
      id: 2, 
      title: 'Confirm & Ship', 
      description: 'Seller confirms payment and ships item',
      icon: Truck,
      actor: 'seller'
    },
    { 
      id: 3, 
      title: 'Confirm Receipt', 
      description: 'Buyer confirms item received',
      icon: Package,
      actor: 'buyer'
    },
    { 
      id: 4, 
      title: 'Rate Transaction', 
      description: 'Both parties rate each other',
      icon: Star,
      actor: 'both'
    }
  ];

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    if (!formData.paymentProof || !formData.shippingAddress) {
      alert('Please provide payment proof and shipping address');
      return;
    }

    try {
      await orderService.submitPayment(order._id, {
        paymentProofUrl: formData.paymentProof, // Changed to match backend expectation (paymentProofUrl)
        paymentNote: 'Đã chuyển khoản',
        shippingAddress: formData.shippingAddress
      });
      const updatedOrder = { ...order, ...formData, currentStep: 2 };
      onUpdateOrder && onUpdateOrder(updatedOrder);
      setCurrentStep(2);
      alert('Payment submitted successfully.');
    } catch (error) {
      const errorMsg = error.message || 'Failed to submit payment';
      const details = error.errors ? `\nDetails: ${error.errors.join(', ')}` : '';
      alert(`Error: ${errorMsg}${details}`);
    }
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    
    if (!formData.shippingCarrier || !formData.shippingTrackingNumber) {
      alert('Please provide shipping details');
      return;
    }

    try {
      await orderService.confirmPayment(order._id);

      await orderService.markAsShipped(order._id, {
        shippingCarrier: formData.shippingCarrier,
        trackingNumber: formData.shippingTrackingNumber,
        shippingNote: 'Đóng gói cẩn thận'
      });

      const updatedOrder = { ...order, ...formData, currentStep: 3 };
      onUpdateOrder && onUpdateOrder(updatedOrder);
      setCurrentStep(3);
      alert('Payment confirmed and item marked as shipped.');
    } catch (error) {
      alert('Error: ' + (error.message || 'Failed to confirm payment and mark as shipped'));
    }
  };

  const handleStep3Submit =  async (e) => {
    e.preventDefault();
    try {
      await orderService.confirmDelivery(order._id, {
        receivedNote: 'Đã nhận hàng'
      });

      const updatedOrder = { ...order, ...formData, currentStep: 4 };
      onUpdateOrder && onUpdateOrder(updatedOrder);
      setCurrentStep(4);
      alert('Delivery confirmed successfully.');
    } catch (error) {
      alert('Error: ' + (error.message || 'Failed to confirm delivery'));
    }
  };

  const handleCancelTransaction = async () => {
    const reason = prompt('Please provide cancellation reason:');

    if (!reason) return;

    if (window.confirm('Are you sure you want to cancel this transaction?')) {
      try {
        await orderService.cancelOrder(order._id, reason);
        onUpdateOrder && onUpdateOrder({ ...order, status: 'cancelled', cancelledBy: userRole });
        alert('Order cancelled');
      } catch (error) {
        alert('Error: ' + (error.message || 'Failed to cancel order'));
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Order Header */}
      <div className="bg-background border border-border rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Complete Your Order</h2>
            <p className="text-muted-foreground">Order #{order._id}</p>
          </div>
          {userRole === 'seller' && currentStep < 4 && (
            <button
              onClick={handleCancelTransaction}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-medium"
            >
              Cancel Transaction
            </button>
          )}
        </div>

        {/* Product Info */}
        <div className="flex gap-4 p-4 bg-muted rounded-lg">
          <img 
            src={order.productId?.primaryImageUrl || order.product?.primaryImageUrl} 
            alt={order.productId?.title || order.product?.title}
            className="w-20 h-20 object-cover rounded"
          />
          <div className="flex-1">
            <h3 className="font-semibold">{order.productId?.title || order.product?.title}</h3>
            <p className="text-sm text-muted-foreground">
              Final Price: <span className="text-primary font-bold text-lg">
                {(order.finalPrice || 0).toLocaleString()} {order.currency || 'VND'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            
            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition ${
                    isCompleted ? 'bg-green-500 text-white' :
                    isCurrent ? 'bg-primary text-white' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {isCompleted ? <CheckCircle className="w-6 h-6" /> : <StepIcon className="w-6 h-6" />}
                  </div>
                  <p className={`text-xs font-semibold text-center ${
                    isCurrent ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    isCompleted ? 'bg-green-500' : 'bg-muted'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-background border border-border rounded-lg p-6">
        {/* Step 1: Buyer Payment & Address */}
        {currentStep === 1 && userRole === 'buyer' && (
          <form onSubmit={handleStep1Submit} className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Step 1: Payment & Shipping Information</h3>
              <button
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  paymentProof: 'https://placehold.co/600x400/png',
                  shippingAddress: '123 Đường Test, Quận 1, TP.HCM - 0909123456'
                }))}
                className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-gray-700"
              >
                Mock Fill
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Payment Proof (Invoice/Receipt URL or Image)
              </label>
              <input
                type="text"
                value={formData.paymentProof}
                onChange={(e) => setFormData({...formData, paymentProof: e.target.value})}
                placeholder="Enter payment proof URL or upload receipt"
                className="w-full px-3 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Shipping Address
              </label>
              <textarea
                value={formData.shippingAddress}
                onChange={(e) => setFormData({...formData, shippingAddress: e.target.value})}
                placeholder="Enter your complete shipping address"
                rows="4"
                className="w-full px-3 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-semibold"
            >
              Submit Payment Info
            </button>
          </form>
        )}

        {currentStep === 1 && userRole === 'seller' && (
          <div className="text-center py-8">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Waiting for buyer to provide payment and shipping information...</p>
          </div>
        )}

        {/* Step 2: Seller Confirm Payment & Ship */}
        {currentStep === 2 && userRole === 'seller' && (
          <form onSubmit={handleStep2Submit} className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Step 2: Confirm Payment & Ship Item</h3>
              <button
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  shippingCarrier: 'Vietnam Post',
                  shippingTrackingNumber: 'VNP' + Math.floor(Math.random() * 1000000000)
                }))}
                className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-gray-700"
              >
                Mock Fill
              </button>
            </div>
            
            <div className="p-4 bg-muted rounded-lg mb-4">
              <h4 className="font-semibold mb-2">Buyer's Information:</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Payment Proof:</span>
                  <p className="font-medium">{formData.paymentProof}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Shipping Address:</span>
                  <p className="font-medium whitespace-pre-line">{formData.shippingAddress}</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Shipping Carrier
              </label>
              <select
                value={formData.shippingCarrier}
                onChange={(e) => setFormData({...formData, shippingCarrier: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Select carrier...</option>
                <option value="USPS">USPS</option>
                <option value="FedEx">FedEx</option>
                <option value="UPS">UPS</option>
                <option value="DHL">DHL</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Tracking Number
              </label>
              <input
                type="text"
                value={formData.shippingTrackingNumber}
                onChange={(e) => setFormData({...formData, shippingTrackingNumber: e.target.value})}
                placeholder="Enter tracking number"
                className="w-full px-3 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-semibold"
            >
              Confirm Payment & Mark as Shipped
            </button>
          </form>
        )}

        {currentStep === 2 && userRole === 'buyer' && (
          <div className="text-center py-8">
            <Truck className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Waiting for seller to confirm payment and ship the item...</p>
          </div>
        )}

        {/* Step 3: Buyer Confirm Receipt */}
        {currentStep === 3 && userRole === 'buyer' && (
          <form onSubmit={handleStep3Submit} className="space-y-4">
            <h3 className="text-xl font-bold mb-4">Step 3: Confirm Item Receipt</h3>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <h4 className="font-semibold mb-2">Shipping Information:</h4>
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Carrier:</span> <span className="font-medium">{formData.shippingCarrier}</span></p>
                <p><span className="text-muted-foreground">Tracking:</span> <span className="font-medium">{formData.shippingTrackingNumber}</span></p>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Please confirm only after you have received and inspected the item. 
                Once confirmed, you cannot revert this action.
              </p>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold"
            >
              I Confirm Receipt of Item
            </button>
          </form>
        )}

        {currentStep === 3 && userRole === 'seller' && (
          <div className="text-center py-8">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">Item shipped!</p>
            <p className="text-sm text-muted-foreground">Tracking: {formData.shippingTrackingNumber}</p>
            <p className="text-sm text-muted-foreground mt-4">Waiting for buyer to confirm receipt...</p>
          </div>
        )}

        {/* Step 4: Ratings */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold mb-4">Step 4: Rate the Transaction</h3>
            
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
              <CheckCircle className="w-6 h-6 text-green-600 inline mr-2" />
              <span className="font-semibold text-green-900">Transaction completed successfully!</span>
            </div>

            {hasRated ? (
               <div className="text-center py-8 bg-muted rounded-lg border border-border">
                  <Star className="w-12 h-12 mx-auto text-yellow-400 mb-3" fill="currentColor" />
                  <h4 className="text-lg font-semibold mb-2">Thank you for your rating!</h4>
                  <p className="text-muted-foreground">Your feedback helps build trust in our community.</p>
               </div>
            ) : (
               <>
                  <p className="text-muted-foreground">
                    Please rate your experience with {userRole === 'buyer' ? 'the seller' : 'the buyer'}.
                  </p>

                  <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium mb-2">Rating Score</label>
                        <div className="flex gap-4">
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, ratingScore: 1 }))}
                            className={`flex-1 py-3 px-4 rounded-lg border-2 flex items-center justify-center gap-2 transition ${
                              formData.ratingScore === 1 
                                ? 'border-green-500 bg-green-50 text-green-700' 
                                : 'border-border hover:bg-muted'
                            }`}
                          >
                             <Star className="w-5 h-5 fill-current" />
                             <span>Positive (+1)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, ratingScore: -1 }))}
                            className={`flex-1 py-3 px-4 rounded-lg border-2 flex items-center justify-center gap-2 transition ${
                              formData.ratingScore === -1 
                                ? 'border-red-500 bg-red-50 text-red-700' 
                                : 'border-border hover:bg-muted'
                            }`}
                          >
                             <Star className="w-5 h-5" />
                             <span>Negative (-1)</span>
                          </button>
                        </div>
                     </div>

                     <div>
                      <label className="block text-sm font-medium mb-2">Comment</label>
                      <textarea
                        value={formData.ratingComment || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, ratingComment: e.target.value }))}
                        placeholder="Share your experience..."
                        rows="3"
                        className="w-full px-3 py-2 border border-border rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      />
                     </div>

                     <button 
                        onClick={async () => {
                           if (!formData.ratingScore) {
                              alert("Please select a score");
                              return;
                           }
                           try {
                              await orderService.rateTransaction(order._id, {
                                 score: formData.ratingScore,
                                 comment: formData.ratingComment || ''
                              });
                              setHasRated(true); 
                           } catch (err) {
                              alert("Error submitting rating: " + err.message);
                           }
                        }}
                        className="w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-semibold"
                     >
                       Submit Rating
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
