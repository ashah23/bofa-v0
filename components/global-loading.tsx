'use client';
import React, { useEffect, useState } from "react";

interface GlobalLoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function GlobalLoading({ message = "Pouring your beer...", size = 'md' }: GlobalLoadingProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isFilling, setIsFilling] = useState(true);

  // Beer glass states - from empty to full
  const beerFrames = [
    { fill: 0, foam: 0, label: "Empty" },
    { fill: 5, foam: 3, label: "Starting to fill" },
    { fill: 10, foam: 5, label: "Starting to fill" },
    { fill: 15, foam: 6, label: "Starting to fill up" },
    { fill: 20, foam: 8, label: "A little beer" },
    { fill: 25, foam: 9, label: "A little more beer" },
    { fill: 30, foam: 10, label: "Getting there" },
    { fill: 35, foam: 11, label: "Getting closer there" },
    { fill: 40, foam: 12, label: "Half full" },
    { fill: 45, foam: 13, label: "Half full" },
    { fill: 50, foam: 15, label: "More than half" },
    { fill: 55, foam: 16, label: "More than half" },
    { fill: 60, foam: 18, label: "Almost full" },
    { fill: 65, foam: 19, label: "Almost full" },
    { fill: 70, foam: 20, label: "Nearly there" },
    { fill: 75, foam: 21, label: "Nearly there" },
    { fill: 80, foam: 22, label: "Full glass" },
    { fill: 90, foam: 25, label: "Overflowing" },
    { fill: 100, foam: 30, label: "Maximum capacity" },
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isFilling) {
      // Filling phase - cycle through frames every 200ms
      interval = setInterval(() => {
        setCurrentFrame(prev => {
          if (prev >= beerFrames.length - 1) {
            // Start emptying after reaching full
            setTimeout(() => setIsFilling(false), 1000);
            return prev;
          }
          return prev + 1;
        });
      }, 100);
    } else {
      // Emptying phase - cycle backwards
      interval = setInterval(() => {
        setCurrentFrame(prev => {
          if (prev <= 0) {
            // Start filling again
            setTimeout(() => setIsFilling(true), 1000);
            return 0;
          }
          return prev - 1;
        });
      }, 50); // Faster emptying
    }

    return () => clearInterval(interval);
  }, [isFilling]);

  const sizeClasses = {
    sm: { container: 'w-24 h-36 sm:w-32 sm:h-48', text: 'text-sm' },
    md: { container: 'w-32 h-48 sm:w-40 sm:h-60', text: 'text-base sm:text-lg' },
    lg: { container: 'w-40 h-60 sm:w-48 sm:h-72', text: 'text-lg sm:text-xl' }
  };

  const currentSize = sizeClasses[size];
  const currentBeer = beerFrames[currentFrame];

  // Calculate foam position - it should float on top of the beer
  const foamTop = Math.max(0, 100 - currentBeer.fill - currentBeer.foam);
  const foamHeight = currentBeer.foam;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className={`beer-glass-container ${currentSize.container}`}>
        {/* Glass outline */}
        <div className="beer-glass-outline">
          {/* Beer liquid */}
          <div 
            className="beer-liquid"
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              height: `${currentBeer.fill}%`,
              background: 'linear-gradient(to top, #e0a800 0%, #fbbf24 60%, #ffe066 100%)',
              borderRadius: '0 0 34px 34px',
              transition: 'height 0.3s ease-out',
            }}
          ></div>
          
          {/* Foam - positioned to float on top of beer */}
          <div 
            className="beer-foam"
            style={{
              position: 'absolute',
              top: `${foamTop}%`,
              left: 0,
              width: '100%',
              height: `${foamHeight}%`,
              background: 'linear-gradient(to bottom, #fffbe7 0%, #fef3c7 100%)',
              borderRadius: '40px 40px 20px 20px',
              transition: 'all 0.3s ease-out',
            }}
          ></div>
          
          {/* Bubbles - only show when there's beer */}
          {currentBeer.fill > 10 && (
            <>
              <div className="bubble bubble-1"></div>
              <div className="bubble bubble-2"></div>
              <div className="bubble bubble-3"></div>
              <div className="bubble bubble-4"></div>
              <div className="bubble bubble-5"></div>
            </>
          )}
        </div>
      </div>
      
      <p className={`mt-6 font-bold text-yellow-800 animate-pulse text-center ${currentSize.text}`}>
        {isFilling ? message : "Cheers! 🍺"}
      </p>

      <style jsx>{`
        .beer-glass-container {
          position: relative;
          margin: 0 auto;
        }

        .beer-glass-outline {
          width: 100%;
          height: 100%;
          border: 4px solid #e0c068;
          border-radius: 0 0 30px 30px;
          position: relative;
          background: transparent;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        @media (min-width: 640px) {
          .beer-glass-outline {
            border-width: 6px;
            border-radius: 0 0 40px 40px;
          }
        }

        .bubble {
          position: absolute;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 50%;
          animation: bubbleRise 2s infinite ease-in-out;
          will-change: transform, opacity;
        }

        .bubble-1 {
          width: 4px;
          height: 4px;
          left: 20%;
          bottom: 20%;
          animation-delay: 0s;
        }

        .bubble-2 {
          width: 3px;
          height: 3px;
          left: 60%;
          bottom: 30%;
          animation-delay: 0.4s;
        }

        .bubble-3 {
          width: 4px;
          height: 4px;
          left: 30%;
          bottom: 40%;
          animation-delay: 0.8s;
        }

        .bubble-4 {
          width: 3px;
          height: 3px;
          left: 70%;
          bottom: 50%;
          animation-delay: 1.2s;
        }

        .bubble-5 {
          width: 4px;
          height: 4px;
          left: 15%;
          bottom: 60%;
          animation-delay: 1.6s;
        }

        @media (min-width: 640px) {
          .bubble-1, .bubble-3, .bubble-5 {
            width: 6px;
            height: 6px;
          }
          
          .bubble-2, .bubble-4 {
            width: 4px;
            height: 4px;
          }
        }

        @keyframes bubbleRise {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
          20% {
            opacity: 0.6;
          }
          80% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(-150px) scale(0.5);
            opacity: 0;
          }
        }

        @media (max-width: 640px) {
          @keyframes bubbleRise {
            0% {
              transform: translateY(0) scale(1);
              opacity: 0;
            }
            20% {
              opacity: 0.6;
            }
            80% {
              opacity: 0.6;
            }
            100% {
              transform: translateY(-100px) scale(0.5);
              opacity: 0;
            }
          }
        }
      `}</style>
    </div>
  );
} 