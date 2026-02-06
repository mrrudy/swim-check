/**
 * Color utilities for Pool View Display Options (005-pool-view-options)
 * HSL color interpolation for availability percentage bar
 */

/** HSL color representation */
export interface HSLColor {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

/** Color thresholds for availability bar */
export interface ColorStop {
  percentage: number; // 0-1
  color: HSLColor;
}

/** Color calculation result for availability bar */
export interface AvailabilityColor {
  /** CSS color string (hsl format) */
  background: string;
  /** CSS color string for text (contrast-safe) */
  text: string;
}

/**
 * Color stops for availability gradient:
 * - 100% available: Green (hsl(120, 65%, 40%))
 * - 50% available: Amber/Yellow (hsl(45, 85%, 50%))
 * - 20% available: Red (hsl(0, 70%, 50%))
 * - 0% available: Dark gray (hsl(0, 0%, 25%))
 */
export const AVAILABILITY_COLOR_STOPS: ColorStop[] = [
  { percentage: 0, color: { h: 0, s: 0, l: 25 } },      // Dark gray/black
  { percentage: 0.2, color: { h: 0, s: 70, l: 50 } },   // Red
  { percentage: 0.5, color: { h: 45, s: 85, l: 50 } },  // Amber
  { percentage: 1, color: { h: 120, s: 65, l: 40 } },   // Green
];

/**
 * Linear interpolation between two values
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Interpolate between two HSL colors
 */
function interpolateHSL(color1: HSLColor, color2: HSLColor, t: number): HSLColor {
  return {
    h: lerp(color1.h, color2.h, t),
    s: lerp(color1.s, color2.s, t),
    l: lerp(color1.l, color2.l, t),
  };
}

/**
 * Convert HSL color to CSS string
 */
function hslToString(color: HSLColor): string {
  return `hsl(${Math.round(color.h)}, ${Math.round(color.s)}%, ${Math.round(color.l)}%)`;
}

/**
 * Determine appropriate text color for contrast
 * Uses simplified luminance calculation
 */
function getContrastTextColor(color: HSLColor): string {
  // Use lightness as proxy for luminance
  // For dark backgrounds (l < 50%), use white text
  // For light backgrounds (l >= 50%), use dark text
  return color.l < 50 ? '#ffffff' : '#1a1a1a';
}

/**
 * Calculate availability color based on percentage
 * Uses HSL interpolation for smooth gradients between color stops
 *
 * @param percentage - Value from 0 to 1 (0 = no availability, 1 = full availability)
 * @returns Color object with background and text colors
 */
export function calculateAvailabilityColor(percentage: number): AvailabilityColor {
  // Clamp percentage to valid range
  const clampedPercentage = Math.max(0, Math.min(1, percentage));

  // Find the two color stops to interpolate between
  let lowerStop = AVAILABILITY_COLOR_STOPS[0];
  let upperStop = AVAILABILITY_COLOR_STOPS[AVAILABILITY_COLOR_STOPS.length - 1];

  for (let i = 0; i < AVAILABILITY_COLOR_STOPS.length - 1; i++) {
    const current = AVAILABILITY_COLOR_STOPS[i];
    const next = AVAILABILITY_COLOR_STOPS[i + 1];

    if (clampedPercentage >= current.percentage && clampedPercentage <= next.percentage) {
      lowerStop = current;
      upperStop = next;
      break;
    }
  }

  // Calculate interpolation factor between the two stops
  const range = upperStop.percentage - lowerStop.percentage;
  const t = range === 0 ? 0 : (clampedPercentage - lowerStop.percentage) / range;

  // Interpolate the color
  const interpolatedColor = interpolateHSL(lowerStop.color, upperStop.color, t);

  return {
    background: hslToString(interpolatedColor),
    text: getContrastTextColor(interpolatedColor),
  };
}
