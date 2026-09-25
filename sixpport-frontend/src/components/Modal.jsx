import { X } from 'lucide-react';

const Modal = ({ titulo, abierto, onCerrar, children, maxWidth = 'max-w-lg' }) => {
  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCerrar}
      />
      <div className={`relative w-full ${maxWidth} bg-sixx-panel border border-sixx-border rounded-xl shadow-2xl overflow-hidden`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-sixx-border">
          <h3 className="text-lg font-bold text-white">{titulo}</h3>
          <button
            onClick={onCerrar}
            className="text-sixx-muted hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
