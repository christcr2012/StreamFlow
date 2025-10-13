import { customAlphabet } from 'nanoid';

// Generate a short, URL-safe public ID
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 12);

export function generatePublicId(): string {
  return nanoid();
}

// Format currency in cents to dollars
export function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// Format date to locale string
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString();
}

// Format datetime to locale string
export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString();
}

// Truncate text to a maximum length
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Class name utility for conditional classes
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

