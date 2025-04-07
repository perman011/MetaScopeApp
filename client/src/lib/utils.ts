import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names using clsx and tailwind-merge for optimal tree-shaking
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Determines the color status based on the percentage usage
 * @param value Current value
 * @param limit Maximum value
 * @returns "success", "warning", or "danger" based on usage percentage
 */
export function getStatusColor(value: number, limit: number) {
  const percentage = (value / limit) * 100;
  
  if (percentage < 60) {
    return "success";
  } else if (percentage < 80) {
    return "warning";
  } else {
    return "danger";
  }
}

/**
 * Format large numbers with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Format a percentage value
 */
export function formatPercentage(value: number, limit: number): string {
  const percentage = (value / limit) * 100;
  return `${Math.round(percentage)}%`;
}