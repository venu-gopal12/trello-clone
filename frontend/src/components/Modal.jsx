import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

const Modal = ({ children, onClose, isOpen }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div style={styles.overlay} onClick={onClose}>
      <div 
        style={styles.modal} 
        onClick={e => e.stopPropagation()}
      >
        <button style={styles.closeButton} onClick={onClose}>&times;</button>
        {children}
      </div>
    </div>,
    document.body
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    zIndex: 1000,
    paddingTop: '60px',
    overflowY: 'auto'
  },
  modal: {
    backgroundColor: '#f4f5f7',
    borderRadius: '2px',
    width: '768px',
    maxWidth: '100%',
    minHeight: '600px',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    boxShadow: '0 8px 16px -4px rgba(9,30,66,0.25), 0 0 0 1px rgba(9,30,66,0.08)',
    margin: '0 12px 60px',
    outline: 'none',
  },
  closeButton: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#42526e',
    fontSize: '24px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ':hover': {
        backgroundColor: 'rgba(9,30,66,0.08)'
    }
  }
};

export default Modal;
