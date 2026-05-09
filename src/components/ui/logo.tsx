import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className, showText = true, size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl'
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Icon */}
      <div className={cn("relative", sizeClasses[size])}>
        <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
          {/* Background circle with brand gradient */}
          <circle cx="16" cy="16" r="16" fill="url(#gradient)" />
          
          {/* Graduation cap design */}
          <path d="M8 14L16 10L24 14L16 18L8 14Z" fill="white" stroke="none"/>
          <path d="M12 16V20C12 21.1 13.8 22 16 22C18.2 22 20 21.1 20 20V16" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          <circle cx="22" cy="14" r="1" fill="white"/>
          
          {/* Proctor/security element */}
          <circle cx="6" cy="6" r="3" fill="#B2B0E8" opacity="0.8"/>
          <circle cx="6" cy="6" r="1.5" fill="white"/>
          
          {/* Define gradient */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B38A0" stopOpacity="1" />
              <stop offset="100%" stopColor="#1A2A80" stopOpacity="1" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {/* Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={cn("font-bold text-brand-dark", textSizeClasses[size])}>
            ProctorLink
          </span>
          {size !== 'sm' && (
            <span className="text-xs text-brand-medium/80 font-medium -mt-1">
              Powered by LogikSutra AI
            </span>
          )}
        </div>
      )}
    </div>
  );
}
