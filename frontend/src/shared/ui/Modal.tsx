import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../lib/format';

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = 'max-w-xl',
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  width?: string;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative bg-white rounded-2xl shadow-pop w-full', width)}>
        {(title || subtitle) && (
          <div className="px-6 pt-5 pb-4 border-b border-line">
            <div className="flex items-start justify-between">
              <div>
                {title && <h3 className="text-lg font-semibold text-ink-900">{title}</h3>}
                {subtitle && <p className="text-sm text-ink-500 mt-0.5">{subtitle}</p>}
              </div>
              <button className="text-ink-500 hover:text-ink-900" onClick={onClose}>
                <X size={20} />
              </button>
            </div>
          </div>
        )}
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-line flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
