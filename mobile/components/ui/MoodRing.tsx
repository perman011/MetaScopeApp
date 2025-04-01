import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
  TextStyle,
  StyleProp
} from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING } from '../../constants/theme';

interface MoodRingProps {
  score: number;                  // Overall health score from 0-100
  securityScore?: number;         // Security score from 0-100
  complexityScore?: number;       // Complexity score from 0-100
  performanceScore?: number;      // Performance score from 0-100
  size?: 'sm' | 'md' | 'lg' | 'xl'; // Different size options
  showLabel?: boolean;            // Whether to show the label
  pulsate?: boolean;              // Whether to pulsate the ring
  style?: StyleProp<ViewStyle>;   // Additional styles for the container
  ringStyle?: StyleProp<ViewStyle>; // Additional styles for the ring
  labelStyle?: StyleProp<TextStyle>; // Additional styles for the label
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

export default function MoodRing({
  score,
  securityScore,
  complexityScore,
  performanceScore,
  size = 'md',
  showLabel = true,
  pulsate = false,
  style,
  ringStyle,
  labelStyle,
}: MoodRingProps) {
  const [color, setColor] = useState<string>('hsla(0, 0%, 50%, 0.8)'); // Default gray
  const pulseAnimation = useState(new Animated.Value(1))[0]; // Initial scale value

  // Size mapping
  const sizeDimensions = {
    sm: 40,
    md: 80,
    lg: 120,
    xl: 160,
  };

  const textSizes = {
    sm: FONT_SIZE.xs,
    md: FONT_SIZE.md,
    lg: FONT_SIZE.lg,
    xl: FONT_SIZE.xl,
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

  // Set up the pulsating animation if enabled
  useEffect(() => {
    if (pulsate) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          })
        ])
      ).start();
    }
  }, [pulsate, pulseAnimation]);

  // Convert HSLA to a format React Native can use
  const parseHsla = (hsla: string) => {
    // Fix to handle the format with spaces after commas
    const matches = hsla.match(/hsla\((\d+),\s*(\d+)%,\s*(\d+)%,\s*([\d.]+)\)/);
    
    if (matches) {
      return {
        h: parseInt(matches[1], 10),
        s: parseInt(matches[2], 10) / 100,
        l: parseInt(matches[3], 10) / 100,
        a: parseFloat(matches[4])
      };
    }
    
    // Alternative format: hsla(360, 100%, 50%, 1)
    const alternativeMatches = hsla.match(/hsla\((\d+), (\d+)%, (\d+)%, ([\d.]+)\)/);
    if (alternativeMatches) {
      return {
        h: parseInt(alternativeMatches[1], 10),
        s: parseInt(alternativeMatches[2], 10) / 100,
        l: parseInt(alternativeMatches[3], 10) / 100,
        a: parseFloat(alternativeMatches[4])
      };
    }
    
    return { h: 0, s: 0, l: 0.5, a: 0.8 }; // Default
  };

  // Convert HSL to RGB (React Native uses rgba)
  const hslToRgb = (h: number, s: number, l: number) => {
    h /= 360;
    let r, g, b;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  };

  // Convert HSLA to RGBA
  const hslaToRgba = (hsla: string) => {
    const { h, s, l, a } = parseHsla(hsla);
    const { r, g, b } = hslToRgb(h, s, l);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  };

  // Calculate shadow color (slightly more transparent version of the main color)
  const parsedColor = parseHsla(color);
  const shadowColor = parsedColor ? hslaToRgba(`hsla(${parsedColor.h}, ${parsedColor.s * 100}%, ${parsedColor.l * 100}%, ${parsedColor.a * 0.5})`) : 'rgba(0,0,0,0.2)';
  
  // Convert our HSLA color to RGBA for React Native
  const rgbaColor = hslaToRgba(color);

  const ringSize = sizeDimensions[size];
  const fontSize = textSizes[size];

  return (
    <View style={[styles.container, style]}>
      <Animated.View 
        style={[
          styles.ring,
          {
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            backgroundColor: rgbaColor,
            shadowColor: shadowColor,
            transform: [{ scale: pulsate ? pulseAnimation : 1 }]
          },
          ringStyle
        ]}
      >
        <Text style={[styles.scoreText, { fontSize }]}>
          {score}
        </Text>
      </Animated.View>
      
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={[styles.statusText, labelStyle]}>
            {getStatusText(score)}
          </Text>
          <Text style={styles.subtitleText}>
            Org Health
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  ring: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  scoreText: {
    color: 'white',
    fontWeight: FONT_WEIGHT.bold,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  labelContainer: {
    marginTop: SPACING.sm,
    alignItems: 'center',
  },
  statusText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textDark,
  },
  subtitleText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textLight,
  },
});