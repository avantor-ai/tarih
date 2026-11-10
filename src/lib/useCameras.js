import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Қолжетімді камералардың тізімі және таңдалғанын есте сақтау.
 *
 * Не́ге керек: презентацияда сыртқы USB камера қолданылады. Браузердің
 * әдепкі <input capture> тәсілі құрылғыны таңдауға мүмкіндік бермейді —
 * ол жүйенің өз камерасын ашады. Сондықтан getUserMedia арқылы тізімді
 * өзіміз құрып, таңдауды пайдаланушыға береміз.
 *
 * Маңызды: құрылғылардың АТАУЛАРЫ рұқсат берілгеннен кейін ғана көрінеді.
 * Сондықтан алдымен ағынды бір рет сұраймыз, содан соң қайта тізімдейміз.
 */

const STORAGE_KEY = 'tas-jazular:camera'

export function useCameras() {
  const [devices, setDevices] = useState([])
  const [deviceId, setDeviceId] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || '' } catch { return '' }
  })
  const [permission, setPermission] = useState('unknown') // unknown | granted | denied | unsupported
  const [error, setError] = useState(null)
  const probeRef = useRef(null)

  const supported = typeof navigator !== 'undefined'
    && navigator.mediaDevices?.getUserMedia
    && navigator.mediaDevices?.enumerateDevices

  /** Тізімді жаңарту (атаулар рұқсаттан кейін ғана толық болады) */
  const refresh = useCallback(async () => {
    if (!supported) { setPermission('unsupported'); return [] }
    try {
      const all = await navigator.mediaDevices.enumerateDevices()
      const cams = all.filter((d) => d.kind === 'videoinput')
      setDevices(cams)
      if (cams.length && cams.some((c) => c.label)) setPermission('granted')
      return cams
    } catch (e) {
      setError({ name: e?.name, message: e?.message })
      return []
    }
  }, [supported])

  /** Рұқсат сұрау: бір рет ағын ашып, бірден жабамыз — тек атаулар үшін */
  const requestAccess = useCallback(async () => {
    if (!supported) { setPermission('unsupported'); return false }
    setError(null)
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true })
      s.getTracks().forEach((t) => t.stop())
      setPermission('granted')
      await refresh()
      return true
    } catch (e) {
      setPermission(e.name === 'NotAllowedError' ? 'denied' : 'unknown')
      // Мәтінге компонентте айналады — таңдалған тілде шығуы үшін
      setError({ name: e?.name, message: e?.message })
      return false
    }
  }, [supported, refresh])

  useEffect(() => {
    if (!supported) { setPermission('unsupported'); return }
    refresh()
    const onChange = () => refresh()
    navigator.mediaDevices.addEventListener?.('devicechange', onChange)
    return () => {
      navigator.mediaDevices.removeEventListener?.('devicechange', onChange)
      probeRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [supported, refresh])

  const select = useCallback((id) => {
    setDeviceId(id)
    try { localStorage.setItem(STORAGE_KEY, id) } catch { /* жады толы */ }
  }, [])

  // Сақталған камера жоғалып кетсе, біріншісіне ауысамыз
  useEffect(() => {
    if (!devices.length) return
    if (deviceId && devices.some((d) => d.deviceId === deviceId)) return
    select(devices[0].deviceId)
  }, [devices, deviceId, select])

  return { devices, deviceId, select, permission, error, supported, refresh, requestAccess }
}

/** Камераның атауын адам оқитын күйге келтіру */
export function cameraLabel(device, index, word = 'Камера') {
  if (device.label) {
    // «HD Webcam (046d:0825)» → «HD Webcam»
    return device.label.replace(/\s*\([0-9a-f]{4}:[0-9a-f]{4}\)\s*$/i, '').trim()
  }
  return `${word} ${index + 1}`
}

/**
 * Қате → таңдалған тілдегі мәтін.
 * @param {{name?: string, message?: string}} e
 * @param {object} L  t.camera
 */
export function cameraErrorText(e, L) {
  return L.errors[e?.name] || e?.message || L.errors.default
}
