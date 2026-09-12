/**
 * Басты беттегі 3D сахна: таңғы дала, тұман, ескерткіш.
 */

import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import Stela from './Stela'

/* ─────────────────────  Дала жері  ───────────────────── */

function Steppe() {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(150, 150, 90, 90)
    const pos = g.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const d = Math.sqrt(x * x + y * y)
      // ортасы тегіс, шеті бұдырлы — көкжиектегі жоталар
      const rolling =
        Math.sin(x * 0.055) * Math.cos(y * 0.045) * 1.5 +
        Math.sin(x * 0.14 + 1.2) * Math.cos(y * 0.11) * 0.55
      const falloff = THREE.MathUtils.smoothstep(d, 6, 44)
      pos.setZ(i, rolling * falloff)
    }
    g.computeVertexNormals()
    return g
  }, [])

  return (
    <mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
      <meshStandardMaterial color="#5F5439" roughness={1} metalness={0} />
    </mesh>
  )
}

/* ─────────────────────  Алыстағы жоталар  ───────────────────── */

function Hills() {
  const hills = useMemo(() => {
    const arr = []
    let seed = 21
    const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2 + rnd() * 0.35
      const dist = 52 + rnd() * 26
      arr.push({
        pos: [Math.cos(angle) * dist, -1.5 + rnd() * 1.2, Math.sin(angle) * dist],
        scale: [14 + rnd() * 16, 4.5 + rnd() * 7, 14 + rnd() * 16],
      })
    }
    return arr
  }, [])

  return (
    <group>
      {hills.map((h, i) => (
        <mesh key={i} position={h.pos} scale={h.scale}>
          <sphereGeometry args={[1, 14, 9]} />
          <meshStandardMaterial color="#463F2F" roughness={1} fog />
        </mesh>
      ))}
    </group>
  )
}

/* ─────────────────────  Ауадағы шаң  ───────────────────── */

function Dust({ count = 420 }) {
  const ref = useRef()

  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 26
      positions[i * 3 + 1] = Math.random() * 9
      positions[i * 3 + 2] = (Math.random() - 0.5) * 22
      speeds[i] = 0.05 + Math.random() * 0.16
    }
    return { positions, speeds }
  }, [count])

  useFrame((state, delta) => {
    const arr = ref.current?.geometry.attributes.position
    if (!arr) return
    const t = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      let y = arr.getY(i) + speeds[i] * delta
      if (y > 9) y = 0
      arr.setY(i, y)
      arr.setX(i, arr.getX(i) + Math.sin(t * 0.3 + i) * delta * 0.045)
    }
    arr.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color="#E5C98C"
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

/* ─────────────────────  Камера қозғалысы  ───────────────────── */

function CameraRig({ scrollRef }) {
  const { camera, pointer } = useThree()
  const base = useMemo(() => new THREE.Vector3(0, 2.1, 7.4), [])

  useFrame((state, delta) => {
    const scroll = scrollRef?.current ?? 0

    // скроллмен камера жақындап, сәл жоғары көтеріледі
    const targetX = base.x + pointer.x * 0.75
    const targetY = base.y + pointer.y * 0.4 + scroll * 1.5
    const targetZ = base.z - scroll * 2.6

    camera.position.x = THREE.MathUtils.damp(camera.position.x, targetX, 2.6, delta)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, targetY, 2.6, delta)
    camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 2.6, delta)

    camera.lookAt(0, 1.75 + scroll * 0.4, 0)
  })

  return null
}

/* ─────────────────────  Сахна  ───────────────────── */

export default function HeroScene({ scrollRef }) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.85]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 2.1, 7.4], fov: 42, near: 0.1, far: 220 }}
      onCreated={({ gl, scene, camera }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.04
        scene.fog = new THREE.FogExp2('#C6B490', 0.0118)
        scene.background = new THREE.Color('#C6B490')
        if (import.meta.env.DEV) { window.__scene = scene; window.__gl = gl; window.__camera = camera }
      }}
    >
      {/* таңғы жарық */}
      <hemisphereLight args={['#F7E4BE', '#3E3729', 0.62]} />

      <directionalLight
        position={[-6.2, 5.4, 5.6]}
        intensity={3.1}
        color="#FFE0AC"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={35}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0006}
      />

      {/* артқы контур жарығы — заманауи 3D көрініс береді */}
      <directionalLight position={[6.5, 3.2, -5.5]} intensity={2.1} color="#63E0D6" />
      <ambientLight intensity={0.16} />

      <Suspense fallback={null}>
        <Stela scrollRef={scrollRef} position={[0, 0, 0]} />
        <Steppe />
        <Hills />
        <Dust />
      </Suspense>

      <CameraRig scrollRef={scrollRef} />
    </Canvas>
  )
}
