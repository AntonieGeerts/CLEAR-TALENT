import React from 'react';
import { Sparkles } from 'lucide-react';
import { branding } from '../config/branding';

interface LogoProps {
  variant?: 'main' | 'light' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'main',
  size = 'md',
  showText = true,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-12',
  };

  const iconSizes = {
    sm: 20,
    md: 24,
    lg: 32,
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  // Use logo image if available and not using fallback
  if (!branding.logo.useFallback) {
    const logoSrc = branding.logo[variant];
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <img
          src={logoSrc}
          alt={branding.logo.alt}
          className={sizeClasses[size]}
        />
        {showText && variant !== 'icon' && (
          <span className={`font-bold text-gray-900 ${textSizes[size]}`}>
            {branding.company.name}
          </span>
        )}
      </div>
    );
  }

  // Fallback to icon + text
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Sparkles className="text-primary-600" size={iconSizes[size]} />
      {showText && (
        <span className={`font-bold text-gray-900 ${textSizes[size]}`}>
          {branding.company.name}
        </span>
      )}
    </div>
  );
};

export default Logo;
