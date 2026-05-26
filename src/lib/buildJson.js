import { SERVICE_TYPES } from '../data/serviceTypes'
import { normalizeConfig, validateConfigForDownload } from './configValidation'

const BASE_PERMISSIONS = [
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.WAKE_LOCK',
  'android.permission.RECEIVE_BOOT_COMPLETED',
]

const BOOT_RECEIVER =
  '<receiver android:exported = "true" android:name = "xyz.kumaraswamy.itoo.receivers.BootReceiver"  >\n' +
  '<intent-filter  >\n' +
  '<action android:name = "android.intent.action.BOOT_COMPLETED" />\n' +
  '<action android:name = "android.intent.action.QUICKBOOT_POWERON" />\n' +
  '</intent-filter>\n' +
  '</receiver>\n'

const START_RECEIVER =
  '<receiver android:exported = "true" android:name = "xyz.kumaraswamy.itoo.receivers.StartReceiver" />\n'

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function buildComponentBuildInfos({ selectedTypeIds, additionalPermissions, specialUseText, strict = true }) {
  const config = strict
    ? validateConfigForDownload({ selectedTypeIds, additionalPermissions, specialUseText })
    : normalizeConfig({ selectedTypeIds, additionalPermissions, specialUseText })
  const selectedTypes = SERVICE_TYPES.filter(t => config.selectedTypeIds.has(t.id))
  const permissions = new Set(BASE_PERMISSIONS)

  selectedTypes.forEach(t => {
    if (t.fgsPermission) permissions.add(t.fgsPermission)
    t.manifestPermissions.filter(p => p.required).forEach(p => permissions.add(p.id))
  })

  config.additionalPermissions.forEach(p => permissions.add(p))

  const activities = []

  if (selectedTypes.length > 0) {
    const fgsType = selectedTypes.map(t => t.xmlType).join('|')
    const propertyLine = (config.selectedTypeIds.has('specialUse') && config.specialUseText.trim())
      ? `<property android:name = "android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE" android:value = "${escapeXml(config.specialUseText.trim())}" />\n`
      : ''
    activities.push(
      `<service android:exported = "true" android:foregroundServiceType = "${fgsType}" ` +
      `android:name = "xyz.kumaraswamy.itoo.ItooService" android:process = ":doraemon" >\n` +
      propertyLine +
      `</service>\n`
    )
  }

  activities.push(BOOT_RECEIVER)
  activities.push(START_RECEIVER)

  return [{
    assets: [],
    activities,
    permissions: [...permissions],
    type: 'xyz.kumaraswamy.itoo.Itoo',
    androidMinSdk: [7],
  }]
}
