import BaseModal from "../BaseModal";
import { useNavigate } from "react-router-dom";

function OrderExistsModal({
  isOpen,
  onClose,
  orderNumber,
  onCancelExisting,
  onAddToExisting,
  isLoading,
  orderStatus,
}) {
  const isCooking = orderStatus === "cooking";
  const navigate = useNavigate();

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      size="modal-dialog-centered"
      title="Existing Order Found"
    >
      <div className="text-center px-4">
        <p className="mb-4">
          {isCooking
            ? "Your order is currently being prepared. You can add more items to this order."
            : "You have an ongoing order (#" +
              orderNumber +
              "). Would you like to cancel this order and create a new one, or add items to this order?"}
        </p>

        <div className="grid gap-2">
          {/* Only show cancel button if order is not in cooking or served state */}
          {orderStatus &&
            !["cooking", "served"].includes(
              orderStatus.toLowerCase().trim()
            ) && (
              <button
                className="px-3 py-2 text-sm font-semibold text-white bg-[#FF3B30] hover:bg-[#FF3B30]/90 rounded-3xl border-0 transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                onClick={async () => {
                  await onCancelExisting();
                  navigate("/orders");
                }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span
                      className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Processing...
                  </>
                ) : (
                  "Cancel Existing & Create New Order"
                )}
              </button>
            )}

          <button
            className="px-3 py-2 text-sm font-semibold text-white bg-[#007AFF] hover:bg-[#007AFF]/90 rounded-3xl border-0 transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
            onClick={onAddToExisting}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span
                  className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Processing...
              </>
            ) : (
              `Add To Existing Order (#${orderNumber})`
            )}
          </button>

          <button
            className="px-3 py-2 text-sm font-semibold text-black bg-[#f8f9fa] hover:bg-[#e9ecef] rounded-3xl border border-[#dee2e6] transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
            onClick={onClose}
            disabled={isLoading}
          >
            Close
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

export default OrderExistsModal;
