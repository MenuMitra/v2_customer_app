import { useEffect } from "react";
import { useModal } from "../contexts/ModalContext";
import { useOutlet } from "../contexts/OutletContext";
import { useNavigate } from "react-router-dom";

function OutletInfoBanner() {
  const { openModal } = useModal();
  const {
    outletName,
    address,
    outletCode,
    fetchOutletDetailsByCode,
    isOutletOnlyUrl,
    tableNumber,
    sectionName,
    orderSettings,
  } = useOutlet();
  const navigate = useNavigate();

  // Map of order types to their icons
  const orderTypeIcons = {
    counter: "🏪",
    "drive-through": "🚗",
    delivery: "🛵",
    parcel: "📦",
  };

  // Map of order types to their display names
  const orderTypeNames = {
    counter: "Counter",
    "drive-through": "Drive Through",
    delivery: "Delivery",
    parcel: "Parcel",
  };

  const handleOrderTypeClick = () => {
    openModal("orderType");
  };

  const handleOutletClick = () => {
    navigate("/outlet-details");
  };

  // If we have an outlet code but no outlet details, fetch them
  useEffect(() => {
    if (outletCode && !outletName) {
      fetchOutletDetailsByCode(outletCode);
    }
  }, [outletCode, outletName, fetchOutletDetailsByCode]);

  return (
    <div className="container mx-auto py-2 shadow-lg">
      <div className="flex items-center">
        {/* Left side - Store Icon and Name */}
        <div className="flex items-center flex-grow">
          <div className="mr-2 text-primary">
            <i className="fa-solid fa-store"></i>
          </div>
          <div
            onClick={handleOutletClick}
            role="button"
            className="outlet-info cursor-pointer"
          >
            <h6 className="mb-0 text-gray-900 font-semibold">{outletName || "-"}</h6>
          </div>
        </div>

        {/* Right side - Order Type Selection */}
        <div>
          {isOutletOnlyUrl ? (
            <button
              className="p-0 flex items-center no-underline bg-transparent border-0 hover:opacity-80 transition-opacity"
              onClick={handleOrderTypeClick}
            >
              <div className="text-primary">
                {orderSettings.order_type ? (
                  <span className="text-2xl">
                    {orderTypeIcons[orderSettings.order_type]}
                  </span>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-8 h-8 mr-2"
                    viewBox="0 0 15 24"
                    fill="currentColor"
                  >
                    <path d="M12 2C8.1 2 5 5.1 5 9c0 4 7 13 7 13s7-9 7-13c0-3.9-3.1-7-7-7zm0 4c1.7 0 3 1.3 3 3s-1.3 3-3 3-3-1.3-3-3 1.3-3 3-3z" />
                  </svg>
                )}
              </div>
              <div className="flex flex-col items-start ml-2">
                <span className="font-bold text-gray-900">
                  {orderSettings.order_type
                    ? orderTypeNames[orderSettings.order_type]
                    : "Select Order Type"}
                </span>
                <small className="text-gray-500">
                  {orderSettings.order_type
                    ? "Tap to change"
                    : "Click to select"}
                </small>
              </div>
            </button>
          ) : (
            <div className="flex items-center">
              <span className="font-normal text-gray-300">
                {sectionName ? sectionName : "SectionName"}-
                {tableNumber &&
                Array.isArray(tableNumber) &&
                tableNumber.length > 0
                  ? tableNumber.join(", ")
                  : tableNumber || "N/A"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OutletInfoBanner;
