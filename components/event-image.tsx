import React from 'react';

interface EventImageProps {
  eventName: string;
  className?: string;
}

export function EventImage({ eventName, className = "w-16 h-16" }: EventImageProps) {
  const getEventIcon = (name: string) => {
    const normalizedName = name.toLowerCase().trim();
    
    switch (normalizedName) {
      case 'pond relay':
        return (
          <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Pond with ripples */}
            <ellipse cx="32" cy="40" rx="20" ry="8" fill="#4F46E5" opacity="0.3"/>
            <ellipse cx="32" cy="40" rx="16" ry="6" fill="#4F46E5" opacity="0.5"/>
            <ellipse cx="32" cy="40" rx="12" ry="4" fill="#4F46E5" opacity="0.7"/>
            {/* Swimmers */}
            <circle cx="20" cy="35" r="3" fill="#F59E0B"/>
            <circle cx="44" cy="35" r="3" fill="#F59E0B"/>
            <circle cx="32" cy="30" r="3" fill="#F59E0B"/>
            {/* Relay baton */}
            <rect x="30" y="32" width="4" height="8" fill="#DC2626" rx="2"/>
          </svg>
        );
        
      case 'kayak race':
        return (
          <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Water */}
            <rect x="8" y="45" width="48" height="12" fill="#0EA5E9" opacity="0.6"/>
            {/* Kayak */}
            <ellipse cx="32" cy="42" rx="18" ry="4" fill="#8B5CF6"/>
            <ellipse cx="32" cy="42" rx="14" ry="3" fill="#A855F7"/>
            {/* Paddler */}
            <circle cx="32" cy="35" r="4" fill="#F59E0B"/>
            <rect x="30" y="25" width="4" height="12" fill="#374151"/>
            {/* Paddle */}
            <rect x="25" y="30" width="2" height="8" fill="#6B7280"/>
            <rect x="37" y="30" width="2" height="8" fill="#6B7280"/>
          </svg>
        );
        
      case 'flip-tac-toe':
        return (
          <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Game board */}
            <rect x="16" y="16" width="32" height="32" fill="#F3F4F6" stroke="#6B7280" strokeWidth="2"/>
            {/* Grid lines */}
            <line x1="28" y1="16" x2="28" y2="48" stroke="#6B7280" strokeWidth="2"/>
            <line x1="36" y1="16" x2="36" y2="48" stroke="#6B7280" strokeWidth="2"/>
            <line x1="16" y1="28" x2="48" y2="28" stroke="#6B7280" strokeWidth="2"/>
            <line x1="16" y1="36" x2="48" y2="36" stroke="#6B7280" strokeWidth="2"/>
            {/* Cups */}
            <circle cx="22" cy="22" r="3" fill="#DC2626"/>
            <circle cx="42" cy="22" r="3" fill="#DC2626"/>
            <circle cx="22" cy="42" r="3" fill="#DC2626"/>
            <circle cx="42" cy="42" r="3" fill="#DC2626"/>
            {/* Ball */}
            <circle cx="32" cy="32" r="2" fill="#F59E0B"/>
          </svg>
        );
        
      case 'sponge dodge':
        return (
          <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Sponges */}
            <rect x="12" y="12" width="8" height="8" fill="#F59E0B" rx="2"/>
            <rect x="44" y="12" width="8" height="8" fill="#F59E0B" rx="2"/>
            <rect x="12" y="44" width="8" height="8" fill="#F59E0B" rx="2"/>
            <rect x="44" y="44" width="8" height="8" fill="#F59E0B" rx="2"/>
            {/* Player dodging */}
            <circle cx="32" cy="32" r="6" fill="#10B981"/>
            <rect x="30" y="20" width="4" height="16" fill="#374151"/>
            {/* Sponge flying */}
            <circle cx="28" cy="28" r="2" fill="#F59E0B" opacity="0.8"/>
            <circle cx="36" cy="36" r="2" fill="#F59E0B" opacity="0.8"/>
          </svg>
        );
        
      case 'buzzer beater':
        return (
          <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Basketball hoop */}
            <rect x="20" y="15" width="24" height="4" fill="#6B7280"/>
            <rect x="20" y="15" width="4" height="20" fill="#6B7280"/>
            <rect x="40" y="15" width="4" height="20" fill="#6B7280"/>
            {/* Net */}
            <path d="M 20 19 L 24 25 L 28 30 L 32 35 L 36 30 L 40 25 L 44 19" stroke="#6B7280" strokeWidth="1" fill="none"/>
            {/* Basketball */}
            <circle cx="32" cy="45" r="6" fill="#F59E0B"/>
            <line x1="26" y1="45" x2="38" y2="45" stroke="#DC2626" strokeWidth="1"/>
            <line x1="32" y1="39" x2="32" y2="51" stroke="#DC2626" strokeWidth="1"/>
            {/* Timer/buzzer */}
            <rect x="50" y="20" width="8" height="8" fill="#DC2626" rx="1"/>
            <text x="54" y="25" fontSize="6" fill="white" textAnchor="middle">0</text>
          </svg>
        );
        
      case 'pint-athalon':
        return (
          <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Pint glasses */}
            <path d="M 15 20 L 15 45 L 25 45 L 25 20 Z" fill="#F59E0B" opacity="0.3" stroke="#E0A800" strokeWidth="1"/>
            <path d="M 25 20 L 25 45 L 35 45 L 35 20 Z" fill="#F59E0B" opacity="0.5" stroke="#E0A800" strokeWidth="1"/>
            <path d="M 35 20 L 35 45 L 45 45 L 45 20 Z" fill="#F59E0B" opacity="0.7" stroke="#E0A800" strokeWidth="1"/>
            {/* Foam */}
            <rect x="15" y="18" width="10" height="3" fill="#FEF3C7" rx="1"/>
            <rect x="25" y="18" width="10" height="3" fill="#FEF3C7" rx="1"/>
            <rect x="35" y="18" width="10" height="3" fill="#FEF3C7" rx="1"/>
            {/* Athlete */}
            <circle cx="50" cy="30" r="4" fill="#F59E0B"/>
            <rect x="48" y="20" width="4" height="16" fill="#374151"/>
            {/* Trophy */}
            <path d="M 50 15 L 48 20 L 52 20 Z" fill="#F59E0B"/>
            <rect x="49" y="20" width="2" height="4" fill="#F59E0B"/>
          </svg>
        );
        
      default:
        return (
          <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Default event icon */}
            <circle cx="32" cy="32" r="20" fill="#6B7280" opacity="0.2"/>
            <circle cx="32" cy="32" r="12" fill="#6B7280" opacity="0.4"/>
            <circle cx="32" cy="32" r="6" fill="#6B7280"/>
          </svg>
        );
    }
  };

  return getEventIcon(eventName);
} 