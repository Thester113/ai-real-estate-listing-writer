import type { Profile, Usage, Generation } from './supabase'

export * from './supabase'

export interface ListingFormData {
  propertyType: 'house' | 'apartment' | 'condo' | 'townhouse' | 'villa' | 'other'
  bedrooms: number
  bathrooms: number
  squareFeet?: number
  features: string[]
  location: string
  targetAudience: 'families' | 'professionals' | 'students' | 'retirees' | 'investors' | 'general'
  priceRange?: {
    min: number
    max: number
  }
  additionalDetails?: string
}

export interface ListingResult {
  title: string
  description: string
  highlights: string[]
  marketingPoints: string[]
  callToAction: string
}

export interface UserWithUsage extends Profile {
  currentUsage?: Usage
}

export interface DashboardStats {
  totalGenerations: number
  thisMonthGenerations: number
  totalWords: number
  averageWordsPerListing: number
  remainingGenerations: number
}

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  interval: 'month' | 'year'
  features: string[]
  limits: {
    dailyGenerations: number
    monthlyGenerations: number
    maxTokens: number
  }
  popular?: boolean
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}