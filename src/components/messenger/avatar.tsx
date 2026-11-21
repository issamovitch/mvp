'use client'

import { cn } from '@/lib/utils'

interface AvatarProps {
  name: string
  color: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeMap = {
  xs: 'w-7 h-7 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-14 h-14 text-xl',
}

/**
 * Colored circle avatar with the Arabic initial of the name.
 */
export function Avatar({ name, color, size = 'md', className }: AvatarProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full font-bold text-white shrink-0 select-none',
        sizeMap[size],
        className
      )}
      style={{ backgroundColor: color }}
      aria-hidden
    >
      {name.charAt(0)}
    </div>
  )
}
