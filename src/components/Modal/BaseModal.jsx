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

  const contentMaxHeight = layoutOffsets.viewport
    ? Math.max(layoutOffsets.viewport - (layoutOffsets.header + layoutOffsets.footer + 64), 240)
    : undefined;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center overflow-y-auto bg-black/50 z-[2000] box-border px-4"
      style={{
        paddingTop: layoutOffsets.header + 16,
        paddingBottom: layoutOffsets.footer + 16,
      }}
      onClick={handleBackdropClick}
      aria-modal="true" 
      role="dialog"
    >
      <div 
        className={`w-full m-0 ${size === 'modal-dialog-centered' ? 'max-w-lg' : ''}`}
        role="document"
      >
        <div 
          className="w-full bg-white rounded-lg shadow-xl overflow-y-auto"
          style={{
            maxHeight: contentMaxHeight ? `${contentMaxHeight}px` : 'calc(100vh - 120px)',
          }}
        >
          {title && (
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h5 className="text-lg font-semibold text-gray-900 m-0">{title}</h5>
              <button 
                className="text-gray-400 hover:text-gray-600 transition-colors bg-transparent border-0 text-2xl leading-none p-0 w-8 h-8 flex items-center justify-center" 
                onClick={onClose}
                type="button"
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          )}
          <div className="p-4">
            {children}
          </div>
          {footer && (
            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
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
