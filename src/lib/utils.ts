import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatNumber(num: number): string {
  if (num >= 1e9) {
    return `${(num / 1e9).toFixed(2)}B`;
  }
  if (num >= 1e6) {
    return `${(num / 1e6).toFixed(2)}M`;
  }
  if (num >= 1e3) {
    return `${(num / 1e3).toFixed(2)}K`;
  }
  return num.toFixed(0);
}

/**
 * Format distance in meters to appropriate unit
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${meters.toFixed(0)} m`;
}

/**
 * Format energy in joules to scientific notation
 */
export function formatEnergy(joules: number): string {
  const exponent = Math.floor(Math.log10(joules));
  const mantissa = joules / Math.pow(10, exponent);
  return `${mantissa.toFixed(2)} × 10^${exponent} J`;
}

/**
 * Format megatons TNT equivalent
 */
export function formatMegatons(megatons: number): string {
  if (megatons >= 1) {
    return `${megatons.toFixed(2)} MT`;
  }
  return `${(megatons * 1000).toFixed(2)} KT`;
}

/**
 * Format temperature in Celsius
 */
export function formatTemperature(celsius: number): string {
  return `${celsius.toFixed(0)}°C`;
}

/**
 * Format Richter magnitude
 */
export function formatMagnitude(magnitude: number): string {
  return `${magnitude.toFixed(1)} M`;
}

/**
 * Get severity level based on impact energy
 */
export function getImpactSeverity(megatons: number): {
  level: 'minimal' | 'low' | 'moderate' | 'high' | 'catastrophic' | 'extinction';
  color: string;
  description: string;
} {
  if (megatons < 0.001) {
    return {
      level: 'minimal',
      color: '#10b981',
      description: 'Minimal damage, mostly atmospheric effects'
    };
  }
  if (megatons < 0.1) {
    return {
      level: 'low',
      color: '#3b82f6',
      description: 'Local damage, similar to small bomb'
    };
  }
  if (megatons < 10) {
    return {
      level: 'moderate',
      color: '#f59e0b',
      description: 'City-scale destruction'
    };
  }
  if (megatons < 1000) {
    return {
      level: 'high',
      color: '#ef4444',
      description: 'Regional catastrophe'
    };
  }
  if (megatons < 100000) {
    return {
      level: 'catastrophic',
      color: '#dc2626',
      description: 'Continental devastation'
    };
  }
  return {
    level: 'extinction',
    color: '#7f1d1d',
    description: 'Global extinction event'
  };
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Get historical impact comparison
 */
export function getHistoricalComparison(megatons: number): string {
  if (megatons < 0.015) {
    return 'Chelyabinsk meteor (2013)';
  }
  if (megatons < 15) {
    return 'Tunguska event (1908)';
  }
  if (megatons < 50) {
    return 'Largest nuclear test (Tsar Bomba)';
  }
  if (megatons < 10000) {
    return 'Chicxulub impactor (dinosaur extinction)';
  }
  return 'Larger than any known impact in history';
}
