import React, { useState, useEffect } from 'react';
import { WifiOff, X } from 'lucide-react';

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
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white py-2 px-4 z-50 shadow-lg">
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WifiOff className="h-5 w-5" />
            <span>
              Connection issue detected. Some features may be unavailable.
            </span>
          </div>
          <button
            type="button"
            className="p-1 hover:bg-red-700 rounded transition-colors"
            aria-label="Close"
            onClick={() => setShowBanner(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectionStatus;