import { useState, useRef, useCallback, useEffect } from 'react'
import { ArrowLeft, ArrowRight, Download, Link2 } from 'lucide-react'
import TypeSelector from './components/TypeSelector'
import PermissionsConfig from './components/PermissionsConfig'
import PreviewDownload from './components/PreviewDownload'
import { buildComponentBuildInfos } from './lib/buildJson'
import {
  hasMissingSpecialUseDescription,
  normalizeAdditionalPermissionIds,
  normalizeConfig,
} from './lib/configValidation'
import { downloadAix } from './lib/download'

const STEPS = ['Service Types', 'Permissions', 'Download']

function parseUrlConfig() {
  const p = new URLSearchParams(window.location.search)
  const types = p.get('t') ? new Set(p.get('t').split(',').filter(Boolean)) : new Set()
  const perms = p.get('p') ? new Set(p.get('p').split(',').filter(Boolean)) : new Set()
  const desc = p.get('s') ?? ''
  const config = normalizeConfig({ selectedTypeIds: types, additionalPermissions: perms, specialUseText: desc })
  const step = config.selectedTypeIds.size > 0 ? 2 : 0

  return {
    types: config.selectedTypeIds,
    perms: config.additionalPermissions,
    desc: config.specialUseText,
    step,
  }
}

function setsEqual(a, b) {
  if (a.size !== b.size) return false
  for (const value of a) {
    if (!b.has(value)) return false
  }
  return true
}

export default function App() {
  const init = parseUrlConfig()
  const [step, setStep] = useState(init.step)
  const [selectedIds, setSelectedIds] = useState(init.types)
  const [additionalPermissions, setAdditionalPermissions] = useState(init.perms)
  const [specialUseText, setSpecialUseText] = useState(init.desc)
  const [downloading, setDownloading] = useState(false)
  const [toast, setToast] = useState({ msg: '', show: false })
  const toastTimer = useRef(null)

  // Clean URL after restoring state from it
  useEffect(() => {
    if (window.location.search) {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  useEffect(() => {
    setAdditionalPermissions(prev => {
      const next = normalizeAdditionalPermissionIds(prev, selectedIds)
      return setsEqual(prev, next) ? prev : next
    })
  }, [selectedIds])

  const showToast = useCallback(msg => {
    clearTimeout(toastTimer.current)
    setToast({ msg, show: true })
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2600)
  }, [])

  const toggleType = id => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const togglePerm = id => {
    setAdditionalPermissions(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const goNext = () => {
    if (step === 0 && selectedIds.size === 0) {
      showToast('Select at least one service type')
      return
    }
    if (hasMissingSpecialUseDescription(selectedIds, specialUseText)) {
      showToast('Enter a special use description')
      return
    }
    setStep(s => s + 1)
  }

  const goBack = () => setStep(s => s - 1)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const json = buildComponentBuildInfos({ selectedTypeIds: selectedIds, additionalPermissions, specialUseText })
      await downloadAix(json)
    } catch (e) {
      showToast('Download failed: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setDownloading(false)
    }
  }

  const handleShare = async () => {
    const config = normalizeConfig({ selectedTypeIds: selectedIds, additionalPermissions, specialUseText })
    const p = new URLSearchParams()
    if (config.selectedTypeIds.size) p.set('t', [...config.selectedTypeIds].join(','))
    if (config.additionalPermissions.size) p.set('p', [...config.additionalPermissions].join(','))
    if (config.selectedTypeIds.has('specialUse') && config.specialUseText.trim()) {
      p.set('s', config.specialUseText.trim())
    }
    const query = p.toString()
    const url = `${window.location.origin}${window.location.pathname}${query ? `?${query}` : ''}`
    try {
      await navigator.clipboard.writeText(url)
      showToast('Link copied!')
    } catch {
      showToast('Could not copy — try manually: ' + url)
    }
  }

  return (
    <>
      <div className="app-header">
        <div className="app-title-row">
          <span className="app-title">Itoo Manifest</span>
          <span className="app-sub">Customize your Android foreground service</span>
        </div>

        <div className="step-indicator">
          {STEPS.map((label, i) => (
            <div key={i} className="step-indicator-item">
              <div className={`step-dot ${i < step ? 'done' : i === step ? 'active' : ''}`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`step-label ${i === step ? 'active' : ''}`}>{label}</span>
              {i < STEPS.length - 1 && <div className={`step-line ${i < step ? 'done' : ''}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="step-body">
        {step === 0 && (
          <TypeSelector
            selectedIds={selectedIds}
            onToggle={toggleType}
            specialUseText={specialUseText}
            onSpecialUseText={setSpecialUseText}
          />
        )}

        {step === 1 && (
          <PermissionsConfig
            selectedIds={selectedIds}
            additionalPermissions={additionalPermissions}
            onTogglePerm={togglePerm}
            specialUseText={specialUseText}
          />
        )}

        {step === 2 && (
          <PreviewDownload
            selectedIds={selectedIds}
            additionalPermissions={additionalPermissions}
            specialUseText={specialUseText}
          />
        )}
      </div>

      <div className="action-bar">
        {step > 0 && (
          <button className="btn btn-reset" onClick={goBack}>
            <ArrowLeft size={14} strokeWidth={2.2} /> Back
          </button>
        )}
        {step < 2 && (
          <button className="btn btn-save" onClick={goNext}>
            {step === 0 ? 'Configure permissions' : 'Preview & download'}
            <ArrowRight size={14} strokeWidth={2.2} />
          </button>
        )}
        {step === 2 && (
          <>
            <button className="btn btn-save" onClick={handleDownload} disabled={downloading}>
              <Download size={13} strokeWidth={2.2} />
              {downloading ? 'Building…' : 'Download .aix'}
            </button>
            <button className="btn btn-share" style={{ marginLeft: 'auto' }} onClick={handleShare}>
              <Link2 size={13} strokeWidth={2.2} /> Share link
            </button>
          </>
        )}
      </div>

      <div className={`toast${toast.show ? ' show' : ''}`} role="status" aria-live="polite" aria-atomic="true">{toast.msg}</div>
    </>
  )
}
