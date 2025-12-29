import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  cn,
  formatCurrency,
  formatDate,
  formatRelativeTime,
  slugify,
  truncate,
  getInitials,
  getErrorMessage,
} from '@/lib/utils'

describe('lib/utils', () => {
  describe('cn', () => {
    it('merges class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('handles conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
    })

    it('handles undefined and null', () => {
      expect(cn('foo', undefined, null, 'bar')).toBe('foo bar')
    })

    it('merges Tailwind classes correctly', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
    })

    it('handles empty input', () => {
      expect(cn()).toBe('')
    })

    it('handles arrays', () => {
      expect(cn(['foo', 'bar'])).toBe('foo bar')
    })

    it('handles objects', () => {
      expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz')
    })
  })

  describe('formatCurrency', () => {
    it('formats cents to USD by default', () => {
      expect(formatCurrency(2900)).toBe('$29.00')
    })

    it('formats zero correctly', () => {
      expect(formatCurrency(0)).toBe('$0.00')
    })

    it('formats large amounts correctly', () => {
      expect(formatCurrency(100000)).toBe('$1,000.00')
    })

    it('formats negative amounts correctly', () => {
      expect(formatCurrency(-500)).toBe('-$5.00')
    })

    it('formats with custom currency', () => {
      expect(formatCurrency(2900, 'EUR')).toMatch(/29[.,]00/)
    })

    it('handles decimal cents', () => {
      expect(formatCurrency(2999)).toBe('$29.99')
    })
  })

  describe('formatDate', () => {
    it('formats date string correctly', () => {
      const result = formatDate('2025-01-15')
      // Date parsing can vary by timezone, so check for correct month and year
      expect(result).toMatch(/January \d+, 2025/)
    })

    it('formats Date object correctly', () => {
      // Use UTC to avoid timezone issues
      const result = formatDate(new Date('2025-06-20T12:00:00Z'))
      expect(result).toMatch(/June \d+, 2025/)
    })

    it('formats ISO date string correctly', () => {
      const result = formatDate('2025-12-25T12:00:00Z')
      expect(result).toMatch(/December \d+, 2025/)
    })
  })

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-01-15T12:00:00Z'))
    })

    it('formats seconds ago', () => {
      const result = formatRelativeTime('2025-01-15T11:59:30Z')
      expect(result).toMatch(/30 seconds ago|just now/)
    })

    it('formats minutes ago', () => {
      const result = formatRelativeTime('2025-01-15T11:55:00Z')
      expect(result).toMatch(/5 minutes ago/)
    })

    it('formats hours ago', () => {
      const result = formatRelativeTime('2025-01-15T09:00:00Z')
      expect(result).toMatch(/3 hours ago/)
    })

    it('formats days ago', () => {
      const result = formatRelativeTime('2025-01-12T12:00:00Z')
      expect(result).toMatch(/3 days ago/)
    })

    it('formats months ago', () => {
      const result = formatRelativeTime('2024-11-15T12:00:00Z')
      expect(result).toMatch(/2 months ago/)
    })

    it('formats future time in seconds', () => {
      const result = formatRelativeTime('2025-01-15T12:00:30Z')
      expect(result).toMatch(/in 30 seconds/)
    })

    it('formats future time in minutes', () => {
      const result = formatRelativeTime('2025-01-15T12:05:00Z')
      expect(result).toMatch(/in 5 minutes/)
    })

    it('formats future time in hours', () => {
      const result = formatRelativeTime('2025-01-15T15:00:00Z')
      expect(result).toMatch(/in 3 hours/)
    })

    it('formats future time in days', () => {
      const result = formatRelativeTime('2025-01-18T12:00:00Z')
      expect(result).toMatch(/in 3 days/)
    })

    it('formats future time in months', () => {
      const result = formatRelativeTime('2025-03-15T12:00:00Z')
      expect(result).toMatch(/in 2 months/)
    })
  })

  describe('slugify', () => {
    it('converts to lowercase', () => {
      expect(slugify('Hello World')).toBe('hello-world')
    })

    it('replaces spaces with hyphens', () => {
      expect(slugify('foo bar baz')).toBe('foo-bar-baz')
    })

    it('removes special characters', () => {
      expect(slugify('hello!@#$%world')).toBe('helloworld')
    })

    it('handles multiple spaces', () => {
      expect(slugify('foo   bar')).toBe('foo-bar')
    })

    it('handles empty string', () => {
      expect(slugify('')).toBe('')
    })

    it('handles only special characters', () => {
      expect(slugify('!@#$%')).toBe('')
    })

    it('handles numbers', () => {
      expect(slugify('Article 123')).toBe('article-123')
    })
  })

  describe('truncate', () => {
    it('returns original if under length', () => {
      expect(truncate('hello', 10)).toBe('hello')
    })

    it('returns original if exactly at length', () => {
      expect(truncate('hello', 5)).toBe('hello')
    })

    it('truncates and adds ellipsis', () => {
      expect(truncate('hello world', 5)).toBe('hello...')
    })

    it('trims trailing space before ellipsis', () => {
      expect(truncate('hello world test', 11)).toBe('hello world...')
    })

    it('handles empty string', () => {
      expect(truncate('', 10)).toBe('')
    })

    it('handles length of 0', () => {
      expect(truncate('hello', 0)).toBe('...')
    })
  })

  describe('getInitials', () => {
    it('gets initials from two words', () => {
      expect(getInitials('John Doe')).toBe('JD')
    })

    it('gets initials from single word', () => {
      expect(getInitials('John')).toBe('J')
    })

    it('limits to two characters', () => {
      expect(getInitials('John Robert Doe')).toBe('JR')
    })

    it('handles lowercase names', () => {
      expect(getInitials('john doe')).toBe('JD')
    })

    it('handles empty string', () => {
      expect(getInitials('')).toBe('')
    })

    it('handles extra spaces', () => {
      expect(getInitials('  John   Doe  ')).toBe('JD')
    })
  })

  describe('getErrorMessage', () => {
    it('returns message from Error instance', () => {
      expect(getErrorMessage(new Error('test error'))).toBe('test error')
    })

    it('returns string directly', () => {
      expect(getErrorMessage('string error')).toBe('string error')
    })

    it('returns default for null', () => {
      expect(getErrorMessage(null)).toBe('An unknown error occurred')
    })

    it('returns default for undefined', () => {
      expect(getErrorMessage(undefined)).toBe('An unknown error occurred')
    })

    it('returns default for number', () => {
      expect(getErrorMessage(42)).toBe('An unknown error occurred')
    })

    it('returns default for object', () => {
      expect(getErrorMessage({ message: 'foo' })).toBe('An unknown error occurred')
    })

    it('returns default for array', () => {
      expect(getErrorMessage(['error'])).toBe('An unknown error occurred')
    })
  })
})
