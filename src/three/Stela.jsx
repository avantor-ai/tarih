/**
 * Күлтегін ескерткішінің процедуралық 3D моделі.
 * Дайын .glb файлы қажет емес — пішін де, тас бедері де, жазу да кодпен жасалады.
 */

import { useMemo, useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { buildStelaTextures, ensureRunicFont } from './textures'

const HEIGHT = 3.3

/** Ескерткіштің алдыңғы көрінісінің силуэті */
function makeShape() {
  const s = new THREE.Shape()
  const halfBottom = 0.53
  const halfTop = 0.44

  s.moveTo(-halfBottom, 0)
  s.lineTo(-halfTop - 0.02, HEIGHT * 0.83)
  s.quadraticCurveTo(-halfTop, HEIGHT * 0.95, -halfTop * 0.45, HEIGHT * 0.985)
  s.lineTo(halfTop * 0.45, HEIGHT * 0.985)
  s.quadraticCurveTo(halfTop, HEIGHT * 0.95, halfTop + 0.02, HEIGHT * 0.83)
  s.lineTo(halfBottom, 0)
  s.closePath()
  return s
}

/** ExtrudeGeometry-дің UV-ін қалыпқа келтіру, әйтпесе жазу дұрыс жатпайды */
function normalizeUVs(geo) {
  geo.computeBoundingBox()
  const bb = geo.boundingBox
  const w = bb.max.x - bb.min.x
  const h = bb.max.y - bb.min.y
  const d = bb.max.z - bb.min.z

  const pos = geo.attributes.position
  const nor = geo.attributes.normal
  const uv = geo.attributes.uv

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i)
    const nz = Math.abs(nor.getZ(i))

    if (nz > 0.5) {
      // алдыңғы/артқы бет — жазу осында
      uv.setXY(i, (x - bb.min.x) / w, (y - bb.min.y) / h)
    } else {
      // бүйір беттер — қысылған, жазусыз аймақ
      uv.setXY(i, ((z - bb.min.z) / d) * 0.06, (y - bb.min.y) / h)
    }
  }
  uv.needsUpdate = true
  return geo
}

export default function Stela({ scrollRef, ...props }) {
  const group = useRef()
  const [fontReady, setFontReady] = useState(false)

  useEffect(() => {
    let alive = true
    ensureRunicFont().then((ok) => { if (alive) setFontReady(ok) })
    return () => { alive = false }
  }, [])

  const geometry = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(makeShape(), {
      depth: 0.44,
      bevelEnabled: true,
      bevelThickness: 0.035,
      bevelSize: 0.035,
      bevelSegments: 4,
      curveSegments: 24,
    })
    geo.center()
    geo.translate(0, HEIGHT / 2, 0)
    return normalizeUVs(geo)
  }, [])

  // қаріп жүктелген соң текстураны қайта құрамыз
  const textures = useMemo(
    () => buildStelaTextures({ hasFont: fontReady }),
    [fontReady]
  )

  useEffect(() => () => {
    textures.map?.dispose()
    textures.bumpMap?.dispose()
  }, [textures])

  const plinthGeo = useMemo(() => {
    const g = new THREE.BoxGeometry(1.55, 0.42, 1.2, 4, 2, 4)
    // тастың табиғи біркелкі еместігі
    const pos = g.attributes.position
    for (let i = 0; i < pos.count; i++) {
      pos.setXYZ(
        i,
        pos.getX(i) + (Math.random() - 0.5) * 0.05,
        pos.getY(i) + (Math.random() - 0.5) * 0.035,
        pos.getZ(i) + (Math.random() - 0.5) * 0.05
      )
    }
    g.computeVertexNormals()
    return g
  }, [])

  useFrame((state, delta) => {
    if (!group.current) return
    const t = state.clock.elapsedTime
    const scroll = scrollRef?.current ?? 0

    // Жазу әрқашан көрерменге қарап тұруы керек, сондықтан толық айналдырмаймыз:
    // алдыңғы беттің маңында баяу тербеліс + скроллмен шамалы бұрылыс.
    const sway = Math.sin(t * 0.24) * 0.2
    const target = sway + scroll * 0.85
    group.current.rotation.y = THREE.MathUtils.damp(
      group.current.rotation.y, target, 3.5, delta
    )
    // әрең байқалатын тербеліс — «тірі» сезім береді
    group.current.position.y = Math.sin(t * 0.55) * 0.028
  })

  return (
    <group ref={group} {...props}>
      <mesh geometry={plinthGeo} position={[0, 0.21, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#6A5E4C" roughness={0.94} metalness={0.02} />
      </mesh>

      <mesh geometry={geometry} position={[0, 0.42, 0]} castShadow receiveShadow>
        <meshStandardMaterial
          map={textures.map}
          bumpMap={textures.bumpMap}
          bumpScale={0.034}
          roughnessMap={textures.roughnessMap}
          roughness={0.82}
          metalness={0.03}
          color="#EDE6D8"
        />
      </mesh>
    </group>
  )
}
