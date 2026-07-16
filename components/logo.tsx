import Image from 'next/image'
import { cn } from '@/lib/utils'

export function Logo({
  className,
  size = 36,
}: {
  className?: string
  size?: number
}) {
  return (
    <span
      className={cn(
        'flex items-center justify-center overflow-hidden rounded-full bg-card ring-1 ring-border',
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src="/images/logo-mark.png"
        alt="LuckyPickCanada.ca logo: a four-leaf clover joined with a Canadian maple leaf"
        width={size}
        height={size}
        className="h-full w-full object-cover"
        priority
      />
    </span>
  )
}
