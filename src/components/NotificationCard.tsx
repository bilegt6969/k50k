'use client';

import { ShoppingBagIcon } from '@heroicons/react/24/outline';

export interface NotificationCardProps {
  title: string;
  description: string;
  /** Optional: 'product-added' uses shopping bag + green tint; default is product-added */
  variant?: 'product-added' | 'success' | 'info';
  onDismiss?: () => void;
  /** Optional: show close button */
  dismissible?: boolean;
}

const variantStyles = {
  'product-added': {
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    Icon: ShoppingBagIcon,
  },
  success: {
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    Icon: ShoppingBagIcon,
  },
  info: {
    iconBg: 'bg-sky-50',
    iconColor: 'text-sky-600',
    Icon: ShoppingBagIcon,
  },
} as const;

export function NotificationCard({
  title,
  description,
  variant = 'product-added',
  onDismiss,
  dismissible = false,
}: NotificationCardProps) {
  const { iconBg, iconColor, Icon } = variantStyles[variant];

  return (
    <div
      className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_4px_14px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] border border-gray-100/80 min-w-[280px] max-w-[360px]"
      role="alert"
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBg}`}
        aria-hidden
      >
        <Icon className={`h-5 w-5 ${iconColor}`} strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <p className="font-semibold text-gray-800 text-[15px] leading-tight">
          {title}
        </p>
        <p className="mt-0.5 text-sm text-gray-500 leading-snug line-clamp-2">
          {description}
        </p>
      </div>
      {dismissible && onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          aria-label="Dismiss"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
