// useDistance.ts (Stub)
// 距离计算功能已禁用：所有方法返回默认值

import { Technician } from '@/lib/data/types'
import { LocationData } from './useLocation'

export interface UseDistanceOptions {
  userLocation?: LocationData | null
  autoCalculate?: boolean
}

export interface UseDistanceReturn {
  distances: Map<string, number>
  loading: boolean
  error: string | null

  calculateDistanceToTechnician: (technician: Technician) => Promise<number | null>
  calculateDistanceToLocation: (targetLocation: LocationData) => Promise<number | null>
  getFormattedDistance: (distance: number) => string
  getDistance: (technicianId: string) => number | null
  clearDistances: () => void
  calculateMultipleDistances: (technicians: Technician[]) => Promise<void>
  sortTechniciansByDistance: (technicians: Technician[]) => Technician[]
  statistics: {
    count: number
    average: number
    min: number
    max: number
    nearest: string | null
  }
}

export function useDistance(_: UseDistanceOptions = {}): UseDistanceReturn {
  const noDistance = async () => null
  const noOp = async () => {}
  return {
    distances: new Map(),
    loading: false,
    error: null,
    calculateDistanceToTechnician: noDistance,
    calculateDistanceToLocation: noDistance,
    getFormattedDistance: () => '',
    getDistance: () => null,
    clearDistances: () => {},
    calculateMultipleDistances: noOp,
    sortTechniciansByDistance: (techs) => techs,
    statistics: {
      count: 0,
      average: 0,
      min: 0,
      max: 0,
      nearest: null
    }
  }
} 