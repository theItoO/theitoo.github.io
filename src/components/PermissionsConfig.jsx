import { getSelectedServiceTypes } from '../lib/configValidation'

function PermTag({ label }) {
  return <span className="perm-tag">{label}</span>
}

function VersionBadge({ since, until }) {
  if (!since && !until) return null
  return (
    <span className={`version-badge${until ? ' version-badge-until' : ''}`}>
      {until ? `up to ${until}` : `${since}+`}
    </span>
  )
}

function PermCheck({ id, label, desc, since, until, checked, onChange }) {
  return (
    <label className="perm-item" htmlFor={`perm-${id}`}>
      <input type="checkbox" id={`perm-${id}`} checked={checked} onChange={onChange} />
      <span className="perm-item-info">
        <span className="perm-item-label-row">
          <span className="perm-item-label">{label}</span>
          <VersionBadge since={since} until={until} />
        </span>
        <span className="perm-item-desc">{desc}</span>
      </span>
    </label>
  )
}

export default function PermissionsConfig({ selectedIds, additionalPermissions, onTogglePerm, specialUseText }) {
  const selectedTypes = getSelectedServiceTypes(selectedIds)

  return (
    <div className="perm-config">
      <div className="header-row">
        <span className="label-above">Configure permissions</span>
      </div>

      <div className="perm-type-list">
        {selectedTypes.map(type => {
          const hasOptionalManifest = type.manifestPermissions.some(p => !p.required)
          const hasRuntime = type.runtimePermissions.length > 0
          const hasRequired = type.manifestPermissions.some(p => p.required)
          const hasAnything = hasRequired || hasOptionalManifest || hasRuntime

          return (
            <div key={type.id} className="perm-card">
              <div className="perm-card-head">
                <div className="perm-card-title">
                  <span className="perm-card-name">{type.label}</span>
                  <code className="perm-xml-type">{type.xmlType}</code>
                </div>
                {type.fgsPermission
                  ? <PermTag label={type.fgsPermission.replace('android.permission.', '')} />
                  : <PermTag label="FOREGROUND_SERVICE (base)" />
                }
              </div>

              {!hasAnything && (
                <p className="perm-none">No additional permissions required.</p>
              )}

              {hasRequired && (
                <div className="perm-group">
                  {type.manifestPermissions.filter(p => p.required).map(p => (
                    <div key={p.id} className="perm-item perm-item-required">
                      <span className="perm-check-locked">✓</span>
                      <span className="perm-item-info">
                        <span className="perm-item-label">{p.label}</span>
                        <span className="perm-item-desc">{p.desc}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {hasOptionalManifest && (
                <div className="perm-group">
                  {type.atLeastOneNote && (
                    <p className="perm-at-least-one">{type.atLeastOneNote}</p>
                  )}
                  {type.manifestPermissions.filter(p => !p.required).map(p => (
                    <PermCheck key={p.id} id={p.id} label={p.label} desc={p.desc}
                      since={p.since} until={p.until}
                      checked={additionalPermissions.has(p.id)}
                      onChange={() => onTogglePerm(p.id)}
                    />
                  ))}
                </div>
              )}

              {hasRuntime && (
                <div className="perm-group">
                  {type.runtimePermissions.map(p => (
                    <PermCheck key={p.id} id={p.id} label={p.label} desc={p.desc}
                      since={p.since} until={p.until}
                      checked={additionalPermissions.has(p.id)}
                      onChange={() => onTogglePerm(p.id)}
                    />
                  ))}
                </div>
              )}

              {type.specialUseText && selectedIds.has('specialUse') && (
                <div className="perm-group">
                  <span className="perm-group-title">Special use description</span>
                  {specialUseText.trim()
                    ? <div className="special-use-display">
                        <p className="special-use-text">{specialUseText.trim()}</p>
                      </div>
                    : <div className="special-use-missing">
                        No description entered — required for Google Play review.
                      </div>
                  }
                </div>
              )}

              {(type.notes || type.timeout || type.whileInUse || type.systemOnly) && (
                <div className={`perm-note${type.systemOnly ? ' perm-note-warn' : ''}`}>
                  {type.systemOnly && <span className="perm-note-icon">⚠</span>}
                  <span>
                    {type.whileInUse && <><strong>Only works while the app is visible.</strong> {' '}</>}
                    {type.timeout && <><strong>Time limit:</strong> {type.timeout} {' '}</>}
                    {type.notes}
                    {type.systemOnly && <> This type is only valid for privileged system apps.</>}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
