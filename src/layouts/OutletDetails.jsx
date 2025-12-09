import { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useOutlet } from "../contexts/OutletContext";
import OutletInfoBanner from "../components/OutletInfoBanner";
import { useToast } from "../components/Toast/useToast";
import { useQuery } from "@tanstack/react-query";
import apiService from "../api/apiService";

function OutletDetails() {
  const { outletInfo, outletId } = useOutlet();
  const toast = useToast();
  const {
    data: restaurantDetails = {
      outlet_details: {
        name: outletInfo?.outletName,
        address: outletInfo?.outletAddress,
        mobile: outletInfo?.outletMobile,
        veg_nonveg: outletInfo?.vegNonveg,
        upi_id: "",
        image: null,
      },
      count: {
        total_menu: 0,
        total_special_menu: 0,
        total_offer_menu: 0,
        total_category: 0,
        total_tables: 0,
      },
    },
    isLoading: isDetailsLoading,
    error: detailsError,
  } = useQuery({
    queryKey: ["restaurantDetails", outletId],
    queryFn: () => apiService.customer.getRestaurantDetails({ outletId }),
    enabled: !!outletId,
  });
  const [isProcessingUPI, setIsProcessingUPI] = useState(false);
  const [isProcessingPhonePe, setIsProcessingPhonePe] = useState(false);
  const [isProcessingGPay, setIsProcessingGPay] = useState(false);

  // Initial fetch and periodic refresh
  useEffect(() => {
    if (detailsError) {
      toast.error(detailsError.message || "Failed to load outlet details", "Error");
    }
  }, [detailsError, toast]);

  if (isDetailsLoading) {
    return (
      <>
        <Header />
        <div className="max-w-[1200px] mx-auto px-4 py-4">
          <div className="card mb-4">
            <div className="card-body">
              <div className="flex items-center mb-4 animate-pulse">
                <div className="rounded-xl bg-[#f8f9fa] mr-3 w-16 h-16" />
                <div className="w-full">
                  <div className="h-5 bg-[#e9ecef] rounded-full w-1/2 mb-2" />
                  <div className="h-3.5 bg-[#e9ecef] rounded-full w-2/3" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4 animate-pulse">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={`stats-skel-${i}`}>
                    <div className="h-6 bg-[#e9ecef] rounded-full w-2/3 mb-2" />
                    <div className="h-3 bg-[#e9ecef] rounded-full w-1/2" />
                  </div>
                ))}
              </div>

              <div className="text-center mb-3 animate-pulse">
                <div className="h-4 bg-[#e9ecef] rounded-full w-1/2 mx-auto" />
              </div>

              <div className="grid grid-cols-2 gap-2 animate-pulse">
                <div><div className="h-12 bg-[#e9ecef] rounded-xl w-full" /></div>
                <div><div className="h-12 bg-[#e9ecef] rounded-xl w-full" /></div>
                <div className="col-span-2"><div className="h-12 bg-[#e9ecef] rounded-xl w-full" /></div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const handleGenericUPI = () => {
    if (isProcessingUPI) return;
    try {
      setIsProcessingUPI(true);
      const upiUrl = `upi://pay?pa=${
        restaurantDetails?.outlet_details?.upi_id
      }&pn=${encodeURIComponent(
        restaurantDetails?.outlet_details?.name
      )}&mc=1234&tid=TEST123&tr=TEST123&tn=Test payment&am=1&cu=INR`;
      window.location.href = upiUrl;
    } catch (error) {
      console.clear();
      setIsProcessingUPI(false);
    }
  };

  const handlePhonePe = () => {
    if (isProcessingPhonePe) return;
    try {
      setIsProcessingPhonePe(true);
      const phonePeUrl = `phonepe://upi/pay?pa=${
        restaurantDetails?.outlet_details?.upi_id
      }&pn=${encodeURIComponent(
        restaurantDetails?.outlet_details?.name
      )}&mc=1234&tid=TEST123&tr=TEST123&tn=Test payment&am=1&cu=INR`;
      window.location.href = phonePeUrl;
    } catch (error) {
      console.clear();
    } finally {
      setIsProcessingPhonePe(false);
    }
  };

  const handleGooglePay = () => {
    if (isProcessingGPay) return;
    try {
      setIsProcessingGPay(true);
      const googlePayUrl = `gpay://upi/pay?pa=${
        restaurantDetails?.outlet_details?.upi_id
      }&pn=${encodeURIComponent(
        restaurantDetails?.outlet_details?.name
      )}&mc=1234&tid=TEST123&tr=TEST123&tn=Test payment&am=1&cu=INR`;
      window.location.href = googlePayUrl;
    } catch (error) {
      console.clear();
    } finally {
      setIsProcessingGPay(false);
    }
  };

  const handleCopyUPI = async () => {
    const upi = restaurantDetails?.outlet_details?.upi_id || "";
    if (!upi) {
      toast.info("UPI ID not available", "Info");
      return;
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(upi);
      } else {
        const tempInput = document.createElement("input");
        tempInput.value = upi;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand("copy");
        document.body.removeChild(tempInput);
      }
      toast.success("UPI ID copied to clipboard", "Copied");
    } catch (err) {
      toast.error("Failed to copy UPI ID", "Error");
    }
  };

  const VegIcon = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="1"
        y="1"
        width="14"
        height="14"
        rx="2"
        stroke="#008000"
        strokeWidth="2"
      />
      <circle cx="8" cy="8" r="4" fill="#008000" />
    </svg>
  );

  const NonVegIcon = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="1"
        y="1"
        width="14"
        height="14"
        rx="2"
        stroke="#FF0000"
        strokeWidth="2"
      />
      <circle cx="8" cy="8" r="4" fill="#FF0000" />
    </svg>
  );

  return (
    <>
      <Header />
      <OutletInfoBanner />
      <div className="max-w-[1200px] mx-auto px-4 py-4">
        {/* Restaurant Details Card */}
        <div className="card mb-4">
          <div className="card-body  border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
            <div className="flex items-center mb-4">
              <div className="rounded-xl bg-[#f8f9fa] mr-3 flex items-center justify-center w-16 h-16">
                {restaurantDetails?.outlet_details?.image ? (
                  <img
                    src={restaurantDetails.outlet_details.image}
                    alt="Restaurant"
                    className="rounded-xl w-full h-full object-cover"
                  />
                ) : (
                  <i className="fas fa-store text-[var(--primary)] text-2xl"></i>
                )}
              </div>
              <div>
                <div className="flex items-center mb-1">
                  <h5 className="mb-0 font-semibold mr-2">
                    {restaurantDetails?.outlet_details?.name}
                  </h5>
                  <div className="flex items-center">
                    {(() => {
                      const foodType = restaurantDetails?.outlet_details?.veg_nonveg?.toLowerCase();
                      if (foodType === "veg") return <VegIcon />;
                      if (foodType === "nonveg") return <NonVegIcon />;
                      return null;
                    })()}
                  </div>
                </div>
                <p className="text-[#6c757d] mb-1 text-sm">
                  <i className="fas fa-map-marker-alt mr-2"></i>
                  {restaurantDetails?.outlet_details?.address}
                </p>
                <div className="flex items-center">
                  <span className="text-[#6c757d] text-sm">
                    <i className="fas fa-phone mr-1"></i>
                    {restaurantDetails?.outlet_details?.mobile}
                  </span>
                </div>
              </div>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="flex flex-col items-center justify-center py-3">
                <h3 className="mb-1 font-semibold text-2xl">
                  {restaurantDetails?.count?.total_menu}
                </h3>
                <small className="text-[#6c757d] text-xs">Menu Items</small>
              </div>
              <div className="flex flex-col items-center justify-center py-3">
                <h3 className="mb-1 font-semibold text-2xl">
                  {restaurantDetails?.count?.total_special_menu}
                </h3>
                <small className="text-[#6c757d] text-xs">Special Items</small>
              </div>
              <div className="flex flex-col items-center justify-center py-3">
                <h3 className="mb-1 font-semibold text-2xl">
                  {restaurantDetails?.count?.total_offer_menu}
                </h3>
                <small className="text-[#6c757d] text-xs">Offer Items</small>
              </div>
              <div className="col-span-3 grid grid-cols-2 gap-3">
                <div className="flex flex-col items-center justify-center py-3">
                  <h3 className="mb-1 font-semibold text-2xl">
                    {restaurantDetails?.count?.total_category}
                  </h3>
                  <small className="text-[#6c757d] text-xs">Categories</small>
                </div>
                <div className="flex flex-col items-center justify-center py-3">
                  <h3 className="mb-1 font-semibold text-2xl">
                    {restaurantDetails?.count?.total_tables}
                  </h3>
                  <small className="text-[#6c757d] text-xs">Total Tables</small>
                </div>
              </div>
            </div>

            {/* UPI Payment Section */}
            <div className="text-center mb-3">
              <h6 className="mb-2 text-base font-semibold">Quick Payment</h6>
              <div className="flex items-center justify-center">
                <i className="fas fa-qrcode text-[var(--primary)] mr-2"></i>
                <span className="font-mono mr-2 text-lg">
                  {restaurantDetails?.outlet_details?.upi_id}
                </span>
                {restaurantDetails?.outlet_details?.upi_id && (
                  <button
                    type="button"
                    className="px-0 text-lg hover:text-[var(--primary)] transition-colors"
                    onClick={handleCopyUPI}
                    aria-label="Copy UPI ID"
                  >
                    <i className="fa-solid fa-copy"></i>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <button
                  className="w-full h-[75%] bg-[#f3e8ff] text-[#5F259F] rounded-lg hover:bg-[#e9d5ff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed py-3"
                  onClick={handlePhonePe}
                  disabled={isProcessingPhonePe}
                >
                  <div className="flex items-center justify-center">
                    <img src="/icons/phonepe-icon.svg" alt="PhonePe" width="40" height="40" className="mr-2" />
                    <span>
                      {isProcessingPhonePe ? "Opening..." : "PhonePe"}
                    </span>
                  </div>
                </button>
              </div>
              <div>
                <button
                  className="w-full h-[75%] bg-[#e8f0fe] text-[#1a73e8] rounded-lg hover:bg-[#d2e3fc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed py-3"
                  onClick={handleGooglePay}
                  disabled={isProcessingGPay}
                >
                  <div className="flex items-center justify-center">
                    <img src="/icons/google-pay-icon.svg" alt="Google Pay" width="40" height="40" className="mr-2" />
                    <span>{isProcessingGPay ? "Opening..." : "GPay"}</span>
                  </div>
                </button>
              </div>
              <div className="col-span-2">
                <button
                  className="w-full h-full bg-[#e6ffe6] text-[#212529] rounded-lg hover:bg-[#ccffcc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed py-3"
                  onClick={handleGenericUPI}
                  disabled={isProcessingUPI}
                >
                  <div className="flex items-center justify-center">
                    <img src="/icons/upi-payment-icon.svg" alt="UPI Payment" width="40" height="40" className="mr-2" />
                    <span>
                      {isProcessingUPI ? "Opening..." : "Other UPI Apps"}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default OutletDetails;
