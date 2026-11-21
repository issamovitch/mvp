'use client'

import { cn } from '@/lib/utils'

interface StatusDotProps {
  online: boolean
  className?: string
  ringClass?: string
  size?: 'sm' | 'md'
}

/**
 * Small green/gray presence indicator that overlaps the bottom
 * corner of an avatar.
 */
export function StatusDot({ online, className, ringClass = 'ring-white', size = 'sm' }: StatusDotProps) {
  return (
    <span
      className={cn(
        'absolute bottom-0 right-0 rounded-full ring-2',
        size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3',
        ringClass,
        online ? 'bg-[#31A24C]' : 'bg-[#B0B3B8]',
        className
      )}
      aria-label={online ? 'متصل' : 'غير متصل'}
    />
  )
}
