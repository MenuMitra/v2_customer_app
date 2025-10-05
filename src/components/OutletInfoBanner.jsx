import React from "react";
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
  React.useEffect(() => {
    if (outletCode && !outletName) {
      fetchOutletDetailsByCode(outletCode);
    }
  }, [outletCode, outletName, fetchOutletDetailsByCode]);

  return (
    <div className="container py-2 shadow-lg">
      <div className="d-flex align-items-center">
        {/* Left side - Store Icon and Name */}
        <div className="d-flex align-items-center flex-grow-1">
          <div className="me-2 text-primary">
            <i class="fa-solid fa-store"></i>
          </div>
          <div
            onClick={handleOutletClick}
            style={{ cursor: "pointer" }}
            role="button"
            className="outlet-info"
          >
            <h6 className="mb-0 text-dark fw-semibold">{outletName || "-"}</h6>
          </div>
        </div>

        {/* Right side - Order Type Selection */}
        <div>
          {isOutletOnlyUrl ? (
            <button
              className="btn btn-link p-0 d-flex align-items-center"
              onClick={handleOrderTypeClick}
              style={{ textDecoration: "none" }}
            >
              <div className="text-primary">
                {orderSettings.order_type ? (
                  <span style={{ fontSize: "24px" }}>
                    {orderTypeIcons[orderSettings.order_type]}
                  </span>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 15 24"
                    fill="currentColor"
                    className="me-2"
                  >
                    <path d="M12 2C8.1 2 5 5.1 5 9c0 4 7 13 7 13s7-9 7-13c0-3.9-3.1-7-7-7zm0 4c1.7 0 3 1.3 3 3s-1.3 3-3 3-3-1.3-3-3 1.3-3 3-3z" />
                  </svg>
                )}
              </div>
              <div className="d-flex flex-column align-items-start ms-2">
                <span className="fw-bold text-dark">
                  {orderSettings.order_type
                    ? orderTypeNames[orderSettings.order_type]
                    : "Select Order Type"}
                </span>
                <small className="text-muted">
                  {orderSettings.order_type
                    ? "Tap to change"
                    : "Click to select"}
                </small>
              </div>
            </button>
          ) : (
            <div className="d-flex align-items-center">
              <span className="fw-normal text-light">
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
