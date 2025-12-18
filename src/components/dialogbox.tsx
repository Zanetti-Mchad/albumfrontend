'use client';

import { FiX, FiCheckCircle, FiAlertCircle, FiInfo } from 'react-icons/fi';

interface DialogBoxProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  mode?: 'alert' | 'confirm';
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function DialogBox({ isOpen, onClose, title, message, type = 'info', mode = 'alert', onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel' }: DialogBoxProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FiCheckCircle className="w-12 h-12 text-green-500" />;
      case 'error':
        return <FiAlertCircle className="w-12 h-12 text-red-500" />;
      case 'warning':
        return <FiAlertCircle className="w-12 h-12 text-yellow-500" />;
      default:
        return <FiInfo className="w-12 h-12 text-blue-500" />;
    }
  };

  const getHeaderColor = () => {
    switch (type) {
      case 'success':
        return 'from-green-500 to-emerald-500';
      case 'error':
        return 'from-red-500 to-rose-500';
      case 'warning':
        return 'from-yellow-500 to-orange-500';
      default:
        return 'from-blue-500 to-indigo-500';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={`bg-gradient-to-r ${getHeaderColor()} p-6 rounded-t-2xl relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all"
          >
            <FiX className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 bg-white/20 p-4 rounded-full backdrop-blur-sm">
              {getIcon()}
            </div>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 text-center leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          {mode === 'confirm' ? (
            <div className="flex gap-3">
              <button
                onClick={onCancel ?? onClose}
                className="w-1/2 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-100 hover:border-gray-400 transition-all"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm ?? onClose}
                className={`w-1/2 py-3 bg-gradient-to-r ${getHeaderColor()} text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all`}
              >
                {confirmText}
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className={`w-full py-3 bg-gradient-to-r ${getHeaderColor()} text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all`}
            >
              Got it
            </button>
          )}
        </div>
      </div>
    </div>
  );
}