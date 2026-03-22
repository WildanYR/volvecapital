export interface MetadataObject {
  key: string
  value: string
}

export function convertStringToMetadataObject(
  metadata?: string,
): Array<MetadataObject> {
  if (!metadata)
    return []
  const obj = JSON.parse(metadata)
  const entries = Object.entries(obj)
  return entries.map(v => ({ key: v[0], value: v[1] as string }))
}

export function convertMetadataObjectToString(
  metadata: Array<MetadataObject>,
): string {
  const obj = metadata.reduce(
    (acc, { key, value }) => {
      acc[key] = value
      return acc
    },
    {} as Record<string, string>,
  )
  return JSON.stringify(obj)
}
