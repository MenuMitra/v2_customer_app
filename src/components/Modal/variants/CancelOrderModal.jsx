import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

function CancelOrderModal({
  isOpen,
  onClose,
  onConfirm,
  orderNumber,
  remainingSeconds
}) {
  const [reason, setReason] = useState('');

  const predefinedReasons = [
    {
      title: 'Delivery Delays:',
      description: 'Waiting too long, I lost patience.'
    },
    {
      title: 'Change of Mind:',
      description: "Don't want it anymore, found something better."
    },
    {
      title: 'Pricing Concerns:',
      description: 'Extra charges made it too expensive.'
    },
    {
      title: 'Order Errors:',
      description: 'Wrong customization or item, not worth it.'
    },
    {
      title: 'Poor Reviews/Quality Doubts:',
      description: 'Doubts about quality, I canceled quickly.'
    }
  ];

  const handleConfirm = () => {
    if (
      typeof remainingSeconds === 'number' &&
      Number.isFinite(remainingSeconds) &&
      remainingSeconds <= 0
    ) {
      return;
    }
    if (!reason.trim()) return;
    console.log('[CancelOrderModal] handleConfirm called with reason:', reason);
    onConfirm(reason);
    onClose();
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const displayOrderNumber = String(orderNumber || "").replace(/^#+/, "").trim();

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl flex flex-col h-fit max-h-[calc(100vh-2rem)] overflow-hidden"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 flex-shrink-0">
          <h6 className="text-lg font-semibold m-0">
            Cancel Order {displayOrderNumber}
          </h6>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600 bg-transparent border-0 text-xl leading-none p-0 w-8 h-8 flex items-center justify-center transition-colors"
            onClick={onClose}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Body — grows only when modal hits max height */}
        <div className="px-4 py-3 overflow-y-auto overscroll-contain min-h-0 flex-auto">
          <div className="mb-3">
            <div className="mb-2">
              <span className="text-red-600">*</span>
              <span className="text-sm ml-1 text-gray-700">Please provide a reason for cancellations</span>
            </div>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              placeholder="Enter your reason here..."
              rows="2"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            ></textarea>
          </div>

          <div>
            <p className="text-red-600 mb-2 text-sm font-medium">
              Reason for cancellation:
            </p>
            <div className="space-y-1">
              {predefinedReasons.map((item, index) => (
                <label
                  key={index}
                  className="flex items-start cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg transition-colors"
                >
                  <input
                    type="radio"
                    name="cancelReason"
                    className="mr-3 mt-0.5 w-4 h-4 cursor-pointer text-red-600 focus:ring-red-500 flex-shrink-0"
                    checked={reason === item.description}
                    onChange={() => setReason(item.description)}
                  />
                  <div className="flex-1">
                    <p className="mb-0 text-sm font-medium text-gray-900">
                      {item.title}
                    </p>
                    <p className="mb-0 text-xs text-gray-600 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-4 py-3 gap-3 border-t border-gray-200 flex-shrink-0">
          <button
            type="button"
            className="flex-1 bg-gray-100 text-gray-800 border-0 rounded-3xl py-2.5 px-4 font-medium hover:bg-gray-200 transition-colors"
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="button"
            className="flex-1 bg-red-600 text-white border-0 rounded-3xl py-2.5 px-4 font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleConfirm}
            disabled={
              !reason.trim() ||
              (typeof remainingSeconds === 'number' &&
                Number.isFinite(remainingSeconds) &&
                remainingSeconds <= 0)
            }
          >
            <i className="fas fa-times-circle mr-2"></i>
            Confirm Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default CancelOrderModal;
