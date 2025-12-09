import PropTypes from 'prop-types';

const Offcanvas = ({
  isOpen,
  onClose,
  position = 'bottom',
  className = '',
  showBackdrop = true,
  children,
  containerClassName = '',
}) => {
  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Position-specific Tailwind classes
  const getPositionClasses = () => {
    const baseClasses = 'fixed flex flex-col max-w-full bg-white z-[1045] transition-transform duration-300 ease-in-out';
    
    switch (position) {
      case 'bottom':
        return `${baseClasses} right-0 left-0 bottom-0 h-[30vh] max-h-full border-t border-[rgba(0,0,0,0.175)] ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`;
      case 'top':
        return `${baseClasses} top-0 right-0 left-0 h-[30vh] max-h-full border-b border-[rgba(0,0,0,0.175)] ${
          isOpen ? 'translate-y-0' : '-translate-y-full'
        }`;
      case 'start':
        return `${baseClasses} top-0 left-0 w-[400px] h-full border-r border-[rgba(0,0,0,0.175)] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`;
      case 'end':
        return `${baseClasses} top-0 right-0 w-[400px] h-full border-l border-[rgba(0,0,0,0.175)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`;
      default:
        return baseClasses;
    }
  };

  return (
    <>
      {/* Backdrop */}
      {showBackdrop && (
        <div 
          className={`fixed top-0 left-0 w-screen h-screen bg-black z-[1040] transition-opacity duration-300 ${
            isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
          }`}
          onClick={handleBackdropClick}
        />
      )}

      {/* Offcanvas */}
      <div 
        className={`${getPositionClasses()} ${isOpen ? 'visible' : 'invisible'} ${className}`}
      >
        <div className={`w-full px-[15px] mx-auto max-w-[1024px] ${containerClassName}`}>
          <div className="flex-grow p-4 overflow-y-auto text-sm">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

Offcanvas.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  position: PropTypes.oneOf(['bottom', 'top', 'start', 'end']),
  className: PropTypes.string,
  showBackdrop: PropTypes.bool,
  children: PropTypes.node.isRequired,
  containerClassName: PropTypes.string,
};

export default Offcanvas;
