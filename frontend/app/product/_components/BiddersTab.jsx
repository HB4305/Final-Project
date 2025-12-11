/**
 * Bidders Tab Content Component
 * Hiển thị danh sách người đặt giá trong tab
 */

import TopBiddersSection from './TopBiddersSection';

export default function BiddersTab({ bidders }) {
  return (
    <div>
      <TopBiddersSection bidders={bidders} />
    </div>
  );
}
