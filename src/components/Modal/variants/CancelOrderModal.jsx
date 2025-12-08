import { useState } from 'react';

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg mx-4">
        <div className="bg-white rounded-2xl shadow-xl">
          {/* Header */}
          <div className="flex justify-between items-center p-3 border-b border-gray-200">
            <h6 className="text-base font-semibold m-0">
              Cancel Order {orderNumber ? `#${orderNumber}` : ''}
            </h6>
            <button 
              type="button" 
              className="text-gray-400 hover:text-gray-600 bg-transparent border-0 text-xl leading-none p-0 w-6 h-6 flex items-center justify-center"
              onClick={onClose}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          {/* Body */}
          <div className="px-3 pb-3">
            {/* Textarea Section */}
            <div className="mb-4">
              <div className="mb-2">
                <span className="text-red-600">*</span>
                <span className="text-sm ml-1">Please provide a reason for cancellations</span>
              </div>
              <textarea
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter your reason here..."
                rows="3"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              ></textarea>
            </div>

            {/* Predefined Reasons Section */}
            <div>
              <p className="text-red-600 mb-3 text-sm">
                Reason for cancellation:
              </p>
              {predefinedReasons.map((item, index) => (
                <div 
                  key={index} 
                  className="flex items-start mb-3 cursor-pointer"
                  onClick={() => setReason(item.description)}
                >
                  <input
                    type="radio"
                    name="cancelReason"
                    className="mr-2 mt-1 w-4 h-4 cursor-pointer"
                    checked={reason === item.description}
                    onChange={() => setReason(item.description)}
                  />
                  <div>
                    <p className="mb-0 text-sm font-medium">
                      {item.title}
                    </p>
                    <p className="mb-0 text-xs text-gray-600 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between p-3 gap-3">
            <button 
              type="button" 
              className="flex-1 bg-gray-100 text-gray-800 border-0 rounded-3xl py-2.5 px-4 hover:bg-gray-200 transition-colors"
              onClick={onClose}
            >
              Close
            </button>
            <button 
              type="button" 
              className="flex-1 bg-red-600 text-white border-0 rounded-3xl py-2.5 px-4 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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