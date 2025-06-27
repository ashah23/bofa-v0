import React from 'react';
import Image from 'next/image';

interface EventBackgroundProps {
  eventName: string;
  className?: string;
  children?: React.ReactNode;
}

export function EventBackground({ eventName, className = "", children }: EventBackgroundProps) {
  const getEventBackground = (name: string) => {
    const normalizedName = name.toLowerCase().trim();
    
    switch (normalizedName) {
      case 'kayak race':
        return '/images/kayak.jpg';
      case 'pond relay':
        return '/images/pond-relay.jpg';
      case 'flip-tac-toe':
        return '/images/flip-tac-toe.jpg';
      case 'sponge dodge':
        return '/images/sponge-dodge.jpg';
      case 'slam dunk':
        return '/images/slam-dunk.jpg';
      case 'pint-athalon':
        return '/images/pint-athalon.jpg';
      default:
        return '/images/default-event.jpg';
    }
  };

  const backgroundImage = getEventBackground(eventName);

  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={backgroundImage}
          alt={`${eventName} background`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={false}
        />
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40 z-10"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-20 p-4">
        {children}
      </div>
    </div>
  );
} 