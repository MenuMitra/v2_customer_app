import { memo, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useToastContext } from './ToastContext';
import Toast from './Toast';

const ToastContainer = memo(function ToastContainer() {
  const { toasts, removeToast, config } = useToastContext();
  const position = useMemo(() => config?.position || 'bottom-center', [config?.position]);

  // Position-specific Tailwind classes
  const getPositionClasses = () => {
    const baseClasses = 'fixed z-[999999] flex flex-col gap-2 p-4 pointer-events-none max-w-full w-auto';
    
    switch (position) {
      case 'top-left':
        return `${baseClasses} top-0 left-0 max-[480px]:left-4 max-[480px]:right-4 max-[480px]:w-[calc(100%-32px)]`;
      case 'top-right':
        return `${baseClasses} top-0 right-0 max-[480px]:left-4 max-[480px]:right-4 max-[480px]:w-[calc(100%-32px)]`;
      case 'top-center':
        return `${baseClasses} top-0 left-1/2 -translate-x-1/2 max-[480px]:left-4 max-[480px]:right-4 max-[480px]:translate-x-0 max-[480px]:w-[calc(100%-32px)]`;
      case 'bottom-left':
        return `${baseClasses} bottom-0 left-0 max-[480px]:left-4 max-[480px]:right-4 max-[480px]:w-[calc(100%-32px)]`;
      case 'bottom-right':
        return `${baseClasses} bottom-0 right-0 max-[480px]:left-4 max-[480px]:right-4 max-[480px]:w-[calc(100%-32px)]`;
      case 'bottom-center':
      default:
        return `${baseClasses} bottom-0 left-1/2 -translate-x-1/2 max-[480px]:left-4 max-[480px]:right-4 max-[480px]:translate-x-0 max-[480px]:w-[calc(100%-32px)]`;
    }
  };

  return createPortal(
    <>
      <style>{`
        .toast-container-child {
          pointer-events: auto;
        }
      `}</style>
      <div 
        className={getPositionClasses()}
        role="region" 
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="toast-container-child">
            <Toast
              {...toast}
              onClose={removeToast}
              pauseOnHover={config?.pauseOnHover}
            />
          </div>
        ))}
      </div>
    </>,
    document.body
  );
});

export default ToastContainer; 