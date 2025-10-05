import { memo, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useToastContext } from './ToastContext';
import Toast from './Toast';
import './ToastContainer.css';

const ToastContainer = memo(function ToastContainer() {
  const { toasts, removeToast, config } = useToastContext();
  const position = useMemo(() => config?.position || 'bottom-center', [config?.position]);

  return createPortal(
    <div 
      className={`toast-container ${position}`} 
      role="region" 
      aria-label="Notifications"
      style={{ zIndex: 999999 }}
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={removeToast}
          pauseOnHover={config?.pauseOnHover}
        />
      ))}
    </div>,
    document.body
  );
});

export default ToastContainer; 