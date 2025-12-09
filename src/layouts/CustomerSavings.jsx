import { useQuery } from '@tanstack/react-query';
import Header from "../components/Header";
import Footer from "../components/Footer";
import AuthPrompt from "../components/Auth/AuthPrompt";
import AuthOffcanvas from "../components/Auth/AuthOffcanvas";
import { useAuth } from "../contexts/AuthContext";
import apiService from '../api/apiService';

// Extracted authenticated content component
function CustomerSavingsContent() {
  // Get userId from localStorage
  const auth = JSON.parse(localStorage.getItem('auth')) || {};
  const userId = auth.userId;

  // Replace useState and useEffect with useQuery
  const { 
    data: savingsData,
    isLoading,
    error 
  } = useQuery({
    queryKey: ['savings', userId],
    queryFn: () => apiService.customer.getSavings({ userId }),
    enabled: !!userId,
  });

  if (isLoading) return <div className="page-content bottom-content"><div className="max-w-[1200px] mx-auto px-4">Loading...</div></div>;
  if (error) return <div className="page-content bottom-content"><div className="max-w-[1200px] mx-auto px-4">Error: {error.message}</div></div>;
  if (!savingsData) return <div className="page-content bottom-content"><div className="max-w-[1200px] mx-auto px-4">No savings data available</div></div>;

  // Calculate effective totals considering special and coupon discounts
  const totalAmountSpent = Number(savingsData.total_amount_spent || 0);
  const totalSpecialDiscount = Number(savingsData.special_discount || 0);
  const totalCouponDiscount = Number(savingsData.coupon_discount || 0);
  const effectiveTotalAmountSpent = Math.max(0, totalAmountSpent - totalSpecialDiscount - totalCouponDiscount);

  return (
      <div className="page-content bottom-content">
        <div className="max-w-[1200px] mx-auto px-3">
          {/* Total Savings Card */}
          <div className="bg-[#027335] rounded-lg shadow-sm border-0 mb-4">
            <div className="p-4 text-white py-3">
              <h6 className="mb-3 font-normal text-center text-white text-base">
                Total Savings
              </h6>
              <div className="flex justify-between items-center mb-2">
                <span className="font-light">Regular Discount</span>
                <span className="text-xl">₹{savingsData.regular_discount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-light">Special Discount</span>
                <span className="text-xl">₹{savingsData.special_discount}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="font-light">Coupon Discount</span>
                <span className="text-xl">₹{totalCouponDiscount}</span>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <div className="bg-white rounded-lg h-full border border-[#E5E7EB] shadow-sm">
                <div className="p-3 flex flex-col justify-center items-center">
                  <div className="text-3xl font-bold text-[#212529] mb-1">
                    {savingsData.user_count}
                  </div>
                  <div className="text-[#6B7280] text-xs text-center">
                    Total Orders
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="bg-white rounded-lg h-full border border-[#E5E7EB] shadow-sm">
                <div className="p-3 flex flex-col justify-center items-center">
                  <div className="text-3xl font-bold text-[#212529] mb-1">
                    ₹{totalAmountSpent}
                  </div>
                  <div className="text-[#6B7280] text-xs text-center">
                    Amount spent on orders
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="bg-white rounded-lg h-full border border-[#E5E7EB] shadow-sm">
                <div className="p-3 flex flex-col justify-center items-center">
                  <div className="text-3xl font-bold text-[#212529] mb-1">
                    {savingsData.coupon_count || 0}
                  </div>
                  <div className="text-[#6B7280] text-xs text-center">
                    Total Coupons Applied
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Outlet Details */}
          {Object.entries(savingsData.outlet_wise_data).map(([key, outlet]) => (
            <div
              key={key}
              className="bg-white rounded-lg shadow-sm mb-4 border border-[#E5E7EB]"
            >
              <div className="p-3">
                <h6 className="mb-4 font-semibold text-base">{outlet.outlet_name}</h6>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[#A1A5B7]">Total Orders</span>
                  <span className="bg-[#198754] text-white rounded-full px-3 py-1 text-xs font-medium">
                    {outlet.order_count}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[#A1A5B7]">Amount Spent on Orders</span>
                  {(() => {
                    const outletAmount = Number(outlet.total_amount_spent || 0);
                    const outletSpecial = Number(outlet.special_discount || 0);
                    const outletCoupon = Number(outlet.coupon_discount || 0);
                    const outletEffective = Math.max(0, outletAmount - outletSpecial - outletCoupon);
                    return (
                      <span className="text-[#212529]">₹{outletEffective}</span>
                    );
                  })()}
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[#A1A5B7]">Regular Discount</span>
                  <span className="text-[#027335]">
                    ₹{outlet.regular_discount}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[#A1A5B7]">Special Discount</span>
                  <span className="text-[#027335]">
                    ₹{outlet.special_discount}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[#A1A5B7]">Coupon Discount</span>
                  <span className="text-[#027335]">
                    ₹{Number(outlet.coupon_discount || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#A1A5B7]">Complementary Items</span>
                  <span className="bg-[#E8F3FF] text-[#3699FF] rounded-full px-3 py-1 text-xs font-medium">
                    {outlet.complementary_count}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
  );
}

function CustomerSavings() {
  const { user, showAuthOffcanvas, setShowAuthOffcanvas } = useAuth();

  return (
    <>
      <Header />
      {!user ? (
        <AuthPrompt variant="savings" />
      ) : (
        <CustomerSavingsContent />
      )}
      <AuthOffcanvas
        isOpen={showAuthOffcanvas}
        onClose={() => setShowAuthOffcanvas(false)}
      />
      <Footer />
    </>
  );
}

export default CustomerSavings;
