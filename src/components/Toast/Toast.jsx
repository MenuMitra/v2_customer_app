import { memo, useEffect, useRef, useCallback } from 'react';
import { ICONS } from './constants';
import './Toast.css';

const Toast = memo(function Toast({
  id,
  type,
  message,
  title,
  duration = 3000,
  onClose,
  pauseOnHover = true
}) {
  const toastRef = useRef(null);
  const timeoutRef = useRef(null);
  const pausedRef = useRef(false);
  
  const startTimer = useCallback(() => {
    if (duration === null) return;
    
    timeoutRef.current = setTimeout(() => {
      if (!pausedRef.current) {
        onClose(id);
      }
    }, duration);
  }, [duration, id, onClose]);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Add show class after a small delay to trigger animation
    const toast = toastRef.current;
    if (toast) {
      requestAnimationFrame(() => {
        toast.classList.add('show');
      });
    }
    
    startTimer();
    return clearTimer;
  }, [startTimer, clearTimer]);

  const handleMouseEnter = useCallback(() => {
    if (pauseOnHover) {
      pausedRef.current = true;
      clearTimer();
    }
  }, [pauseOnHover, clearTimer]);

  const handleMouseLeave = useCallback(() => {
    if (pauseOnHover) {
      pausedRef.current = false;
      startTimer();
    }
  }, [pauseOnHover, startTimer]);

  const handleClose = useCallback(() => {
    clearTimer();
    const toast = toastRef.current;
    if (toast) {
      toast.classList.add('hiding');
      toast.addEventListener('animationend', () => onClose(id), { once: true });
    }
  }, [clearTimer, id, onClose]);

  return (
    <div
      ref={toastRef}
      className={`toast ${type}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="alert"
      aria-live="polite"
    >
      <button 
        className="close"
        onClick={handleClose}
        aria-label="Close notification"
      >
        <i className="fa-solid fa-times"></i>
      </button>
      
      <div className="toast-content">
        {type !== 'error' && (
          <i className={`toast-icon ${ICONS[type]}`} aria-hidden="true"></i>
        )}
        
        <div className="message">
          {title && (
            <span className="text-title" role="heading" aria-level="2">
              {title}
            </span>
          )}
          {message && <span className="text-body">{message}</span>}
        </div>
      </div>
      
      {duration !== null && <div className="progress-bar" />}
    </div>
  );
});

export default Toast; 