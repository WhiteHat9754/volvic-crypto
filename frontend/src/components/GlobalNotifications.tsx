// components/GlobalNotifications.tsx
'use client';

import React from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const GlobalNotifications: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  const icons = {
    success: <CheckCircle className="h-6 w-6 text-emerald-500" />,
    error: <XCircle className="h-6 w-6 text-red-500" />,
    warning: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
    info: <Info className="h-6 w-6 text-blue-500" />
  };

  const colors = {
    success: 'border-emerald-500/50 bg-emerald-500/10',
    error: 'border-red-500/50 bg-red-500/10',
    warning: 'border-yellow-500/50 bg-yellow-500/10',
    info: 'border-blue-500/50 bg-blue-500/10'
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto" />
      
      {/* Notifications Stack */}
      <div className="relative space-y-4 pointer-events-auto">
        {notifications.map((notification, index) => (
          <div
            key={notification.id}
            className={`relative bg-gray-800/95 backdrop-blur-lg border rounded-xl p-6 max-w-md w-full transform transition-all duration-300 ${
              colors[notification.type]
            } animate-in slide-in-from-top-4 fade-in-0`}
            style={{ 
              transform: `translateY(${index * 10}px) scale(${1 - index * 0.05})`,
              zIndex: 50 - index 
            }}
          >
            <button
              onClick={() => removeNotification(notification.id)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
            
            <div className="flex items-start space-x-4">
              {icons[notification.type]}
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-2">{notification.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{notification.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GlobalNotifications;
