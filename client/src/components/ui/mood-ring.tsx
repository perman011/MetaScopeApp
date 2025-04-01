import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface MoodRingProps {
  score: number; // Overall health score from 0-100
  securityScore?: number; // Security score from 0-100
  complexityScore?: number; // Complexity score from 0-100
  performanceScore?: number; // Performance score from 0-100
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl'; // Different size options
  showLabel?: boolean; // Whether to show the label
  animation?: boolean; // Whether to animate the color transition
  pulsate?: boolean; // Whether to pulsate the ring
}

// Color calculation utility
function calculateColor(
  score: number,
  securityScore: number = score,
  complexityScore: number = score,
  performanceScore: number = score
): string {
  // Base color calculation based on overall health
  let baseHue: number;
  
  // Red (0) to Green (120) hue scale for health score
  if (score < 50) {
    // From red (0) to yellow (60)
    baseHue = (score / 50) * 60;
  } else {
    // From yellow (60) to green (120)
    baseHue = 60 + ((score - 50) / 50) * 60;
  }

  // Adjust saturation based on complexity (higher complexity = more saturated)
  const saturation = 80 + (complexityScore / 100) * 20;
  
  // Adjust lightness based on security (lower security = darker)
  // Range from 40% to 60% lightness
  const lightness = 40 + (securityScore / 100) * 20;

  // Adjust opacity based on performance 
  // Range from 0.8 to 1 opacity
  const opacity = 0.8 + (performanceScore / 100) * 0.2;
  
  return `hsla(${baseHue}, ${saturation}%, ${lightness}%, ${opacity})`;
}

// Function to determine the status text
function getStatusText(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'At Risk';
  if (score >= 20) return 'Poor';
  return 'Critical';
}

export function MoodRing({
  score,
  securityScore,
  complexityScore,
  performanceScore,
  className,
  size = 'md',
  showLabel = true,
  animation = true,
  pulsate = false,
}: MoodRingProps) {
  const [color, setColor] = useState<string>('hsla(0, 0%, 50%, 0.8)'); // Default gray

  // Size mapping
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-16 h-16 text-sm',
    lg: 'w-24 h-24 text-base',
    xl: 'w-32 h-32 text-lg',
  };

  // Update color when scores change
  useEffect(() => {
    setColor(calculateColor(
      score,
      securityScore || score,
      complexityScore || score,
      performanceScore || score
    ));
  }, [score, securityScore, complexityScore, performanceScore]);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div 
        className={cn(
          "rounded-full flex items-center justify-center",
          sizeClasses[size],
          animation ? "transition-all duration-1000" : "",
          pulsate ? "animate-pulse" : ""
        )}
        style={{ 
          backgroundColor: color,
          boxShadow: `0 0 15px ${color}, 0 0 30px ${color}33`,
          border: '4px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        <span className="font-bold text-white drop-shadow-md">
          {score}
        </span>
      </div>
      
      {showLabel && (
        <div className="mt-2 text-center">
          <div className="font-medium">{getStatusText(score)}</div>
          <div className="text-xs text-muted-foreground">Org Health</div>
        </div>
      )}
    </div>
  );
}

// Mobile-friendly version that uses React Native
export function MoodRingNative() {
  // This will be implemented for the mobile app later
}