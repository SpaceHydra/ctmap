import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const config = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      iconColor: 'text-emerald-600',
      titleColor: 'text-emerald-900',
      progressColor: 'bg-emerald-500'
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
      iconColor: 'text-rose-600',
      titleColor: 'text-rose-900',
      progressColor: 'bg-rose-500'
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      iconColor: 'text-amber-600',
      titleColor: 'text-amber-900',
      progressColor: 'bg-amber-500'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-900',
      progressColor: 'bg-blue-500'
    }
  };

  const { icon: Icon, bgColor, borderColor, iconColor, titleColor, progressColor } = config[type];

  return (
    <div className={`${bgColor} ${borderColor} border-2 rounded-xl shadow-lg p-4 min-w-[320px] max-w-md animate-in slide-in-from-right-4 fade-in duration-300`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${bgColor} border ${borderColor}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-bold text-sm ${titleColor} mb-0.5`}>{title}</p>
          {message && (
            <p className="text-xs text-slate-600 leading-relaxed">{message}</p>
          )}
        </div>
        <button
          onClick={() => onClose(id)}
          className="p-1 hover:bg-white/50 rounded transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1 bg-white/50 rounded-full overflow-hidden">
        <div
          className={`h-full ${progressColor} animate-shrink-width`}
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
    </div>
  );
};

// Toast Container Component
interface ToastContainerProps {
  toasts: Array<{
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
  }>;
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-[100] space-y-3 pointer-events-none">
      <div className="space-y-3 pointer-events-auto">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            duration={toast.duration}
            onClose={onClose}
          />
        ))}
      </div>
    </div>
  );
};
