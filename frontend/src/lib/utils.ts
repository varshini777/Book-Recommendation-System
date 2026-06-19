import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const INVALID_COVER_PATTERNS = [
  '/public/covers/placeholder',
  '/covers/placeholder',
  'placeholder.svg',
  'placeholder.png',
]

export function isValidCoverUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false
  const trimmed = url.trim()
  if (trimmed === '') return false
  if (INVALID_COVER_PATTERNS.some(p => trimmed.toLowerCase().includes(p))) return false
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/')) return false
  return true
}
