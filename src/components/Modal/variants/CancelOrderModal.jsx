import { useState, useEffect } from 'react';

function CancelOrderModal({ isOpen, onClose, onConfirm, orderNumber }) {
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

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-lg my-8">
        <div className="bg-white rounded-2xl shadow-xl max-h-[calc(100vh-4rem)] flex flex-col">
          {/* Header - Fixed */}
          <div className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
            <h6 className="text-lg font-semibold m-0">
              Cancel Order {orderNumber ? `#${orderNumber}` : ''}
            </h6>
            <button 
              type="button" 
              className="text-gray-400 hover:text-gray-600 bg-transparent border-0 text-xl leading-none p-0 w-8 h-8 flex items-center justify-center transition-colors"
              onClick={onClose}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          {/* Body - Scrollable */}
          <div className="px-4 py-3 overflow-y-auto flex-1">
            {/* Textarea Section */}
            <div className="mb-4">
              <div className="mb-2">
                <span className="text-red-600">*</span>
                <span className="text-sm ml-1 text-gray-700">Please provide a reason for cancellations</span>
              </div>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                placeholder="Enter your reason here..."
                rows="3"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              ></textarea>
            </div>

            {/* Predefined Reasons Section */}
            <div>
              <p className="text-red-600 mb-3 text-sm font-medium">
                Reason for cancellation:
              </p>
              <div className="space-y-3">
                {predefinedReasons.map((item, index) => (
                  <label 
                    key={index} 
                    className="flex items-start cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                  >
                    <input
                      type="radio"
                      name="cancelReason"
                      className="mr-3 mt-1 w-4 h-4 cursor-pointer text-red-600 focus:ring-red-500 flex-shrink-0"
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

          {/* Footer - Fixed */}
          <div className="flex justify-between p-4 gap-3 border-t border-gray-200 flex-shrink-0">
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
              disabled={!reason.trim()}
            >
              <i className="fas fa-times-circle mr-2"></i>
              Confirm Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CancelOrderModal;
