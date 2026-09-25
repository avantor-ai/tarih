import { useEffect, useRef, useState } from 'react'
import { useCameras, cameraLabel, cameraErrorText } from '../lib/useCameras'

/**
 * Камера тізімі + тікелей түсіру.
 *
 * Тізім әрқашан көрініп тұрады (презентацияда сыртқы USB камераны
 * бірден таңдау үшін). «Түсіру» басылғанда тірі көрініс ашылады.
 *
 * @param {(file: File) => void} onCapture  түсірілген кадр
 * @param {string} label  батырманың жазуы
 */
export default function CameraPicker({ onCapture, label = 'Камерамен түсіру', compact = false }) {
  const { devices, deviceId, select, permission, error, supported, requestAccess } = useCameras()
  const [open, setOpen] = useState(false)

  if (!supported) {
    return (
      <p className="cam__unsupported">
        Бұл браузер камераны қолдамайды. Суретті файл ретінде жүктеңіз.
      </p>
    )
  }

  const needsAccess = permission !== 'granted' || !devices.some((d) => d.label)

  return (
    <div className={`cam ${compact ? 'cam--compact' : ''}`}>
      <div className="cam__row">
        <label className="cam__field">
          <span className="cam__label">Камера</span>
          <select
            className="cam__select"
            value={deviceId}
            onChange={(e) => select(e.target.value)}
            disabled={!devices.length}
          >
            {devices.length ? (
              devices.map((d, i) => (
                <option key={d.deviceId || i} value={d.deviceId}>
                  {cameraLabel(d, i)}
                </option>
              ))
            ) : (
              <option value="">камера табылмады</option>
            )}
          </select>
        </label>

        {needsAccess ? (
          <button className="btn btn--ghost cam__btn" onClick={requestAccess}>
            Камераға рұқсат беру
          </button>
        ) : (
          <button className="btn btn--ghost cam__btn" onClick={() => setOpen(true)}>
            {label}
          </button>
        )}
      </div>

      {error && <p className="cam__error">{error}</p>}
      {permission === 'granted' && devices.length > 1 && (
        <p className="cam__hint">Табылған камера: {devices.length}</p>
      )}

      {open && (
        <CaptureModal
          deviceId={deviceId}
          devices={devices}
          onSelectDevice={select}
          onClose={() => setOpen(false)}
          onCapture={(file) => { onCapture(file); setOpen(false) }}
        />
      )}
    </div>
  )
}

/* ══════════════════════  Тірі көрініс  ══════════════════════ */

function CaptureModal({ deviceId, devices, onSelectDevice, onClose, onCapture }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [err, setErr] = useState(null)
  const [ready, setReady] = useState(false)
  const [size, setSize] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function start() {
      setReady(false); setErr(null)
      stop()
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: deviceId
            ? { deviceId: { exact: deviceId }, width: { ideal: 2560 }, height: { ideal: 1440 } }
            : { facingMode: 'environment', width: { ideal: 2560 }, height: { ideal: 1440 } },
          audio: false,
        })
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return }
        streamRef.current = stream
        const v = videoRef.current
        if (v) {
          v.srcObject = stream
          v.play?.().catch(() => {})
        }
      } catch (e) {
        if (!cancelled) setErr(cameraErrorText(e))
      }
    }

    function stop() {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }

    start()
    return () => { cancelled = true; stop() }
  }, [deviceId])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  function shoot() {
    const v = videoRef.current
    if (!v || !v.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = v.videoWidth
    canvas.height = v.videoHeight
    canvas.getContext('2d').drawImage(v, 0, 0)
    canvas.toBlob((blob) => {
      if (!blob) return
      onCapture(new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' }))
    }, 'image/jpeg', 0.92)
  }

  return (
    <div className="cammodal" onClick={onClose}>
      <div className="cammodal__box" onClick={(e) => e.stopPropagation()}>
        <button className="cammodal__close" onClick={onClose} aria-label="Жабу">×</button>

        <div className="cammodal__stage">
          {err ? (
            <p className="cammodal__error">{err}</p>
          ) : (
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              onLoadedMetadata={(e) => {
                setReady(true)
                setSize([e.currentTarget.videoWidth, e.currentTarget.videoHeight])
              }}
            />
          )}
          {!err && !ready && <p className="cammodal__loading">Камера қосылуда…</p>}
        </div>

        <div className="cammodal__bar">
          <select
            className="cam__select"
            value={deviceId}
            onChange={(e) => onSelectDevice(e.target.value)}
          >
            {devices.map((d, i) => (
              <option key={d.deviceId || i} value={d.deviceId}>{cameraLabel(d, i)}</option>
            ))}
          </select>

          {size && <span className="cammodal__size">{size[0]}×{size[1]}</span>}

          <button className="btn btn--primary" onClick={shoot} disabled={!ready}>
            Түсіру
          </button>
        </div>
      </div>
    </div>
  )
}
