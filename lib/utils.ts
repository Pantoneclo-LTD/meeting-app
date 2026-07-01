import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAvatarInitials(value: string, value2?: string) {

  if (!value) return ''
  const str = value2 ? `${value} ${value2}` : value;
  const words = str
    .trim()
    .split(/\s+/)        // split by spaces
    .slice(0, 2);         // take max 2 words

  if (words.length == 1) {
    return words[0].slice(0, 2).toUpperCase()
  }

  return words.map(word => word.charAt(0).toUpperCase())
    .join('');
}