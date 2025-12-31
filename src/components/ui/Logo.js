import React from 'react';

export function Logo({ className = '', animated = false, size = 'md' }) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-20 w-20'
  };

  const animationClass = animated ? 'animate-pulse' : '';

  return (
    <div className={`${sizeClasses[size]} ${animationClass} flex-shrink-0`}>
      <img 
        src="/logo_qapos.svg" 
        alt="QAntico POS Logo" 
        className={`${sizeClasses[size]} object-contain ${className}`}
      />
    </div>
  );
}

export function AnimatedLogo({ className = '', size = 'md' }) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-20 w-20'
  };

  return (
    <>
      <style>{`
        @keyframes logoBounce {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-10px) scale(1.05);
          }
        }
        .logo-animated {
          animation: logoBounce 2s ease-in-out infinite, pulse 2s ease-in-out infinite;
        }
      `}</style>
      <div className={`${sizeClasses[size]} flex-shrink-0`}>
        <img 
          src="/logo_qapos.svg" 
          alt="QAntico POS Logo" 
          className={`${sizeClasses[size]} object-contain logo-animated ${className}`}
        />
      </div>
    </>
  );
}

