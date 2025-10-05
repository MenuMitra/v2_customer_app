import React from "react";
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

  if (isLoading) return <div className="page-content bottom-content"><div className="container">Loading...</div></div>;
  if (error) return <div className="page-content bottom-content"><div className="container">Error: {error.message}</div></div>;
  if (!savingsData) return <div className="page-content bottom-content"><div className="container">No savings data available</div></div>;

  // Calculate effective totals considering special and coupon discounts
  const totalAmountSpent = Number(savingsData.total_amount_spent || 0);
  const totalSpecialDiscount = Number(savingsData.special_discount || 0);
  const totalCouponDiscount = Number(savingsData.coupon_discount || 0);
  const effectiveTotalAmountSpent = Math.max(0, totalAmountSpent - totalSpecialDiscount - totalCouponDiscount);

  return (
      <div className="page-content bottom-content">
        <div className="container px-3">
          {/* Total Savings Card */}
          <div
            className="card border-0 mb-4"
            style={{ backgroundColor: "#027335" }}
          >
            <div className="card-body text-white py-3">
              <h6 className="mb-3 fw-normal text-center text-white">
                Total Savings
              </h6>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-light">Regular Discount</span>
                <span className="fs-5">₹{savingsData.regular_discount}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="fw-light">Special Discount</span>
                <span className="fs-5">₹{savingsData.special_discount}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mt-2">
                <span className="fw-light">Coupon Discount</span>
                <span className="fs-5">₹{totalCouponDiscount}</span>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="row g-3 mb-4">
            <div className="col-4">
              <div
                className="card h-100"
                style={{
                  border: "1px solid #E5E7EB",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                <div className="card-body p-3 d-flex flex-column justify-content-center align-items-center">
                  <div className="fs-3 fw-bold text-dark mb-1">
                    {savingsData.user_count}
                  </div>
                  <div
                    className="text-muted small"
                    style={{ color: "#6B7280" }}
                  >
                    Total Orders
                  </div>
                </div>
              </div>
            </div>
            <div className="col-4">
              <div
                className="card h-100"
                style={{
                  border: "1px solid #E5E7EB",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                <div className="card-body p-3 d-flex flex-column justify-content-center align-items-center">
                  <div className="fs-3 fw-bold text-dark mb-1">
                    ₹{totalAmountSpent}
                  </div>
                  <div
                    className="text-muted small"
                    style={{ color: "#6B7280" }}
                  >
                    Amount spent on orders
                  </div>
                </div>
              </div>
            </div>
            <div className="col-4">
              <div
                className="card h-100"
                style={{
                  border: "1px solid #E5E7EB",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                <div className="card-body p-3 d-flex flex-column justify-content-center align-items-center">
                  <div className="fs-3 fw-bold text-dark mb-1">
                    {savingsData.coupon_count || 0}
                  </div>
                  <div
                    className="text-muted small"
                    style={{ color: "#6B7280" }}
                  >
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
              className="card mb-4"
              style={{
                border: "1px solid #E5E7EB",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                backgroundColor: "#FFFFFF",
              }}
            >
              <div className="card-body p-3">
                <h6 className="mb-4 fw-semibold">{outlet.outlet_name}</h6>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span style={{ color: "#A1A5B7" }}>Total Orders</span>
                  <span className="badge bg-success rounded-pill px-3">
                    {outlet.order_count}
                  </span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span style={{ color: "#A1A5B7" }}>Amount Spent on Orders</span>
                  {(() => {
                    const outletAmount = Number(outlet.total_amount_spent || 0);
                    const outletSpecial = Number(outlet.special_discount || 0);
                    const outletCoupon = Number(outlet.coupon_discount || 0);
                    const outletEffective = Math.max(0, outletAmount - outletSpecial - outletCoupon);
                    return (
                      <span className="text-dark">₹{outletEffective}</span>
                    );
                  })()}
                </div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span style={{ color: "#A1A5B7" }}>Regular Discount</span>
                  <span style={{ color: "#027335" }}>
                    ₹{outlet.regular_discount}
                  </span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span style={{ color: "#A1A5B7" }}>Special Discount</span>
                  <span style={{ color: "#027335" }}>
                    ₹{outlet.special_discount}
                  </span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span style={{ color: "#A1A5B7" }}>Coupon Discount</span>
                  <span style={{ color: "#027335" }}>
                    ₹{Number(outlet.coupon_discount || 0)}
                  </span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span style={{ color: "#A1A5B7" }}>Complementary Items</span>
                  <span
                    className="badge rounded-pill px-3"
                    style={{
                      backgroundColor: "#E8F3FF",
                      color: "#3699FF",
                    }}
                  >
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
