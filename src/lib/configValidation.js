import { SERVICE_TYPES } from '../data/serviceTypes'

export const SPECIAL_USE_MAX_LENGTH = 280

const SERVICE_TYPE_IDS = new Set(SERVICE_TYPES.map(type => type.id))

function toSet(values) {
  return values instanceof Set ? values : new Set(values || [])
}

export function normalizeServiceTypeIds(ids) {
  return new Set([...toSet(ids)].filter(id => SERVICE_TYPE_IDS.has(id)))
}

export function getSelectedServiceTypes(ids) {
  const selectedIds = normalizeServiceTypeIds(ids)
  return SERVICE_TYPES.filter(type => selectedIds.has(type.id))
}

export function getAllowedAdditionalPermissionIds(selectedTypeIds) {
  const allowed = new Set()

  getSelectedServiceTypes(selectedTypeIds).forEach(type => {
    type.manifestPermissions
      .filter(permission => !permission.required)
      .forEach(permission => allowed.add(permission.id))

    type.runtimePermissions.forEach(permission => allowed.add(permission.id))
  })

  return allowed
}

export function normalizeAdditionalPermissionIds(ids, selectedTypeIds) {
  const allowed = getAllowedAdditionalPermissionIds(selectedTypeIds)
  return new Set([...toSet(ids)].filter(id => allowed.has(id)))
}

export function normalizeSpecialUseText(text) {
  return String(text ?? '').slice(0, SPECIAL_USE_MAX_LENGTH)
}

export function normalizeConfig({ selectedTypeIds, additionalPermissions, specialUseText }) {
  const normalizedTypeIds = normalizeServiceTypeIds(selectedTypeIds)

  return {
    selectedTypeIds: normalizedTypeIds,
    additionalPermissions: normalizeAdditionalPermissionIds(additionalPermissions, normalizedTypeIds),
    specialUseText: normalizeSpecialUseText(specialUseText),
  }
}

export function hasMissingSpecialUseDescription(selectedTypeIds, specialUseText) {
  return normalizeServiceTypeIds(selectedTypeIds).has('specialUse') &&
    normalizeSpecialUseText(specialUseText).trim() === ''
}

export function validateConfigForDownload(config) {
  const normalized = normalizeConfig(config)

  if (normalized.selectedTypeIds.size === 0) {
    throw new Error('Select at least one service type')
  }

  if (hasMissingSpecialUseDescription(normalized.selectedTypeIds, normalized.specialUseText)) {
    throw new Error('Enter a special use description before downloading')
  }

  return normalized
}
