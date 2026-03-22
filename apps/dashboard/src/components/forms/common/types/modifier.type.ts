import type { MetadataObject } from '@/dashboard/lib/metadata-converter'

export interface ModifierObject {
  modifier_id: string
  metadata: Array<MetadataObject>
}
