import React, { useState, useEffect } from 'react';

const ConnectionStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check connection status periodically
    const checkConnection = () => {
      // Simple check if environment variables are present
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const connected = !!(supabaseUrl && supabaseKey);
      setIsConnected(connected);
      setShowBanner(!connected);
    };

    // Initial check
    checkConnection();

    // Check every 5 seconds
    const interval = setInterval(checkConnection, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!showBanner) {
    return null;
  }

  return (
    <div className="connection-status-banner">
      <div className="container-fluid">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <i className="bi bi-wifi-off me-2"></i>
            <span>
              Connection issue detected. Some features may be unavailable.
            </span>
          </div>
          <button
            type="button"
            className="btn-close btn-close-white"
            aria-label="Close"
            onClick={() => setShowBanner(false)}
          ></button>
        </div>
      </div>
      
      <style>{`
        .connection-status-banner {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background-color: #dc3545;
          color: white;
          padding: 0.5rem 0;
          z-index: 1050;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .connection-status-banner .btn-close-white {
          filter: invert(1);
        }
      `}</style>
    </div>
  );
};

export default ConnectionStatus;