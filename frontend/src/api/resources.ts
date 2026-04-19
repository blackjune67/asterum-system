import { apiGet } from './client'
import type { ResourceItem } from '../types/resource'

export function fetchResources() {
  return apiGet<ResourceItem[]>('/resources')
}
