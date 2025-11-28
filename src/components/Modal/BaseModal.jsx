import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const getLayoutOffsets = () => {
  if (typeof window === 'undefined') {
    return { header: 0, footer: 0, viewport: 0 };
  }

  const header = document.querySelector('.header')?.getBoundingClientRect().height || 0;
  const footer = document.querySelector('.menubar-area.footer-fixed')?.getBoundingClientRect().height || 0;

  return {
    header,
    footer,
    viewport: window.innerHeight || 0
  };
};

const BaseModal = ({ 
  isOpen,
  title, 
  children, 
  footer,
  onClose,
  size = 'modal-dialog-centered' // default size
}) => {
  const [layoutOffsets, setLayoutOffsets] = useState(getLayoutOffsets());

  // Keep modal offset aware of the sticky header/footer heights
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => setLayoutOffsets(getLayoutOffsets());
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

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

  const overlayStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    paddingTop: layoutOffsets.header + 16,
    paddingBottom: layoutOffsets.footer + 16,
    paddingLeft: 16,
    paddingRight: 16,
    overflowY: 'auto',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 2000,
    boxSizing: 'border-box'
  };

  const contentMaxHeight = layoutOffsets.viewport
    ? Math.max(layoutOffsets.viewport - (layoutOffsets.header + layoutOffsets.footer + 64), 240)
    : undefined;

  return (
    <div 
      className="modal fade show add-menu-card" 
      style={overlayStyle}
      onClick={handleBackdropClick}
      aria-modal="true" 
      role="dialog"
    >
      <div 
        className={`modal-dialog ${size}`}
        role="document"
        style={{ width: '100%', margin: 0 }}
      >
        <div 
          className="modal-content"
          style={{
            width: '100%',
            maxHeight: contentMaxHeight ? `${contentMaxHeight}px` : 'calc(100vh - 120px)',
            overflowY: 'auto'
          }}
        >
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

BaseModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
  onClose: PropTypes.func.isRequired,
  size: PropTypes.string
};
