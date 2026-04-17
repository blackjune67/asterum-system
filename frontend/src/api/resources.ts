import { apiGetCached } from './client'
import type { ResourceItem } from '../types/resource'

export function fetchResources() {
  return apiGetCached<ResourceItem[]>('/resources')
}
