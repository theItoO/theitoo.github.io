import { useRef, useState } from 'react'
import { SERVICE_TYPES } from '../data/serviceTypes'
import { SPECIAL_USE_MAX_LENGTH } from '../lib/configValidation'

const REGULAR = SERVICE_TYPES.filter(t => t.id !== 'specialUse')
const SPECIAL = SERVICE_TYPES.find(t => t.id === 'specialUse')
const GHOST_CELL_COUNT = (3 - (REGULAR.length % 3)) % 3

export default function TypeSelector({ selectedIds, onToggle, specialUseText, onSpecialUseText }) {
  const [hoverDesc, setHoverDesc] = useState(null)
  const clickingCbRef = useRef(false)
  const charLen = specialUseText.length
  const count = selectedIds.size
  const pillText = count === 1 ? '1 selected' : `${count} selected`
  const specialSelected = selectedIds.has('specialUse')

  return (
    <>
      <div className="header-row">
        <span className="label-above">Foreground service type</span>
        <span className={`count-pill${count > 0 ? ' has-selection' : ''}`} aria-hidden={count === 0 ? 'true' : undefined}>{pillText}</span>
      </div>

      <div className="card">
        <div className="grid-wrap">
          {REGULAR.map(type => (
            <div key={type.id} className="cell"
              onMouseEnter={() => setHoverDesc(type.desc)}
              onMouseLeave={() => setHoverDesc(null)}
            >
              <label htmlFor={`t-${type.id}`}>
                <input type="checkbox" id={`t-${type.id}`}
                  checked={selectedIds.has(type.id)}
                  onChange={() => onToggle(type.id)}
                />
                <span className="cell-name">{type.label}</span>
              </label>
            </div>
          ))}

          {Array.from({ length: GHOST_CELL_COUNT }).map((_, i) => (
            <div key={`ghost-${i}`} className="cell cell-ghost" aria-hidden="true" />
          ))}

          {/* Special Use — first column of the final row */}
          <div className="cell cell-special"
            onMouseEnter={() => setHoverDesc(SPECIAL.desc)}
            onMouseLeave={() => setHoverDesc(null)}
          >
            <label htmlFor="t-specialUse">
              <input type="checkbox" id="t-specialUse"
                checked={specialSelected}
                onMouseDown={() => { clickingCbRef.current = true }}
                onMouseUp={() => { clickingCbRef.current = false }}
                onChange={() => onToggle('specialUse')}
              />
              <span className="cell-name">{SPECIAL.label}</span>
            </label>
          </div>

          {/* Textarea — row 6 cols 2–3 */}
          <div className="cell cell-textarea">
            <textarea
              placeholder="Describe your special use case (required for Google Play review)…"
              maxLength={SPECIAL_USE_MAX_LENGTH}
              value={specialUseText}
              onChange={e => onSpecialUseText(e.target.value)}
              onFocus={() => { if (!specialSelected) onToggle('specialUse') }}
              onBlur={() => {
                if (clickingCbRef.current) return
                if (specialUseText.trim() === '' && specialSelected) onToggle('specialUse')
              }}
            />
            <span className={`char-count${charLen > 240 ? ' warn' : ''}`}>{charLen} / {SPECIAL_USE_MAX_LENGTH}</span>
          </div>
        </div>
      </div>

      <div className={`info-strip${hoverDesc ? ' active' : ''}`} aria-live="polite">
        <span className="info-dot" />
        <span className="info-text">{hoverDesc || 'Hover a service type to learn more.'}</span>
      </div>
    </>
  )
}
