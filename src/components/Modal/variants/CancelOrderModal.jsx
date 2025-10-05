import React, { useState } from 'react';

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
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content" style={{ borderRadius: '16px' }}>
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center p-3">
            <h6 className="mb-0">
              Cancel Order {orderNumber ? `#${orderNumber}` : ''}
            </h6>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose}
              style={{ fontSize: '0.8rem' }}
            ></button>
          </div>

          {/* Body */}
          <div className="px-3 pb-3">
            {/* Textarea Section */}
            <div className="mb-4">
              <div className="mb-2">
                <span className="text-danger">*</span>
                <span style={{ fontSize: '0.9rem' }}>Please provide a reason for cancellations</span>
              </div>
              <textarea
                className="form-control"
                placeholder="Enter your reason here..."
                rows="3"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                style={{
                  border: '1px solid #E8E8E8',
                  borderRadius: '8px',
                  fontSize: '0.9rem'
                }}
              ></textarea>
            </div>

            {/* Predefined Reasons Section */}
            <div>
              <p className="text-danger mb-3" style={{ fontSize: '0.9rem' }}>
                Reason for cancellation:
              </p>
              {predefinedReasons.map((item, index) => (
                <div 
                  key={index} 
                  className="d-flex align-items-start mb-2"
                  onClick={() => setReason(item.description)}
                  style={{ 
                    cursor: 'pointer',
                    marginBottom: '12px',
                    opacity: 1
                  }}
                >
                  <input
                    type="radio"
                    name="cancelReason"
                    className="me-2 mt-1"
                    checked={reason === item.description}
                    onChange={() => setReason(item.description)}
                    style={{ transform: 'scale(1.1)' }}
                  />
                  <div>
                    <p className="mb-0" style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                      {item.title}
                    </p>
                    <p className="mb-0" style={{ 
                      fontSize: '0.85rem', 
                      color: '#666',
                      marginTop: '2px'
                    }}>
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="d-flex justify-content-between p-3 gap-3">
            <button 
              type="button" 
              className="btn flex-grow-1"
              onClick={onClose}
              style={{
                backgroundColor: '#F5F5F5',
                color: '#333',
                border: 'none',
                borderRadius: '8px',
                padding: '10px'
              }}
            >
              Close
            </button>
            <button 
              type="button" 
              className="btn btn-danger flex-grow-1"
              onClick={handleConfirm}
              disabled={!reason.trim()}
              style={{
                backgroundColor: '#FF0000',
                border: 'none',
                borderRadius: '8px',
                padding: '10px'
              }}
            >
              <i className="fas fa-times-circle me-2"></i>
              Confirm Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CancelOrderModal;