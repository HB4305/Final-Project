/**
 * Bidders Tab Content Component
 * Hiển thị danh sách người đặt giá trong tab
 */

import TopBiddersSection from './TopBiddersSection';

export default function BiddersTab({ bidders, productId, isSeller, onReject }) {
  return (
    <div>
      <TopBiddersSection 
        bidders={bidders}
        productId={productId}
        isSeller={isSeller}
        onReject={onReject}
      />
    </div>
  );
}
