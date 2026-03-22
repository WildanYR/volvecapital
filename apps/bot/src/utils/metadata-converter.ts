import { Metadata } from '../types/account.type.js';

export function convertStringToMetadataObject(metadata?: string): Array<Metadata> {
  if (!metadata) return [];
  const obj = JSON.parse(metadata);
  const entries = Object.entries(obj);
  return entries.map((v) => ({ key: v[0], value: v[1] as string }));
}
