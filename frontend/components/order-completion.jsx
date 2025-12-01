import React, { useState } from 'react';
import { CheckCircle, Circle, Package, CreditCard, Truck, Star, MessageCircle } from 'lucide-react';

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
  onUpdateOrder 
}) {
  const [currentStep, setCurrentStep] = useState(order.currentStep || 1);
  const [formData, setFormData] = useState({
    // Step 1 - Buyer
    paymentProof: order.paymentProof || '',
    shippingAddress: order.shippingAddress || '',
    // Step 2 - Seller
    shippingTrackingNumber: order.shippingTrackingNumber || '',
    shippingCarrier: order.shippingCarrier || '',
    // Step 3 - Buyer
    receivedConfirmed: order.receivedConfirmed || false,
    // Step 4 - Ratings
    buyerRated: order.buyerRated || false,
    sellerRated: order.sellerRated || false
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

  const handleStep1Submit = (e) => {
    e.preventDefault();
    const updatedOrder = { ...order, ...formData, currentStep: 2 };
    onUpdateOrder && onUpdateOrder(updatedOrder);
    setCurrentStep(2);
  };

  const handleStep2Submit = (e) => {
    e.preventDefault();
    const updatedOrder = { ...order, ...formData, currentStep: 3 };
    onUpdateOrder && onUpdateOrder(updatedOrder);
    setCurrentStep(3);
  };

  const handleStep3Submit = (e) => {
    e.preventDefault();
    const updatedOrder = { ...order, ...formData, receivedConfirmed: true, currentStep: 4 };
    onUpdateOrder && onUpdateOrder(updatedOrder);
    setCurrentStep(4);
  };

  const handleCancelTransaction = () => {
    if (window.confirm('Are you sure you want to cancel this transaction? This will give a -1 rating to the winner.')) {
      onUpdateOrder && onUpdateOrder({ ...order, status: 'cancelled', cancelledBy: userRole });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Order Header */}
      <div className="bg-background border border-border rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Complete Your Order</h2>
            <p className="text-muted-foreground">Order #{order.id}</p>
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
            src={order.product.image} 
            alt={order.product.name}
            className="w-20 h-20 object-cover rounded"
          />
          <div className="flex-1">
            <h3 className="font-semibold">{order.product.name}</h3>
            <p className="text-sm text-muted-foreground">Final Price: <span className="text-primary font-bold text-lg">${order.finalPrice.toLocaleString()}</span></p>
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
            <h3 className="text-xl font-bold mb-4">Step 1: Payment & Shipping Information</h3>
            
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
            <h3 className="text-xl font-bold mb-4">Step 2: Confirm Payment & Ship Item</h3>
            
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

            <p className="text-muted-foreground">
              Please rate your experience with {userRole === 'buyer' ? 'the seller' : 'the buyer'}.
            </p>

            <div className="flex gap-2">
              <button className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-semibold">
                Rate Now
              </button>
              <button className="px-4 py-3 border border-border rounded-lg hover:bg-muted transition">
                Rate Later
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Chat Link */}
      <div className="mt-6 p-4 bg-muted rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium">Need to discuss with {userRole === 'buyer' ? 'seller' : 'buyer'}?</span>
        </div>
        <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-sm font-medium">
          Open Chat
        </button>
      </div>
    </div>
  );
}
