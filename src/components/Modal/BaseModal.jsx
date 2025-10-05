import React, { useEffect } from 'react';

const BaseModal = ({ 
  isOpen,
  title, 
  children, 
  footer,
  onClose,
  size = 'modal-dialog-centered' // default size
}) => {
  // Add body class when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('Modal mounted - adding body classes');
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px';

      // Cleanup when modal closes
      return () => {
        console.log('Modal unmounted - removing body classes');
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    // Only close if clicking the outer modal container
    if (e.target === e.currentTarget) {
      console.log('Backdrop clicked - closing modal');
      onClose();
    }
  };

  return (
    <div 
      className="modal fade show" 
      style={{ 
        display: 'block',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1045
      }}
      onClick={handleBackdropClick}
      aria-modal="true" 
      role="dialog"
    >
      <div 
        className={`modal-dialog ${size}`}
        role="document"
      >
        <div className="modal-content">
          {title && (
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button 
                className="btn-close" 
                onClick={onClose}
                type="button"
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          )}
          <div className="modal-body">
            {children}
          </div>
          {footer && (
            <div className="modal-footer">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BaseModal;
