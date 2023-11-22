/* eslint-disable react-hooks/rules-of-hooks */
// @ts-nocheck
"use client";
import '@aws-amplify/ui-react/styles.css';
import React, { useState, useLayoutEffect, useRef } from 'react';
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html, Mask, useMask, Clone, Float as FloatImpl } from '@react-three/drei'
import { Main } from './Main.tsx'


function MyComponentWithSpline(props) {
  if (typeof window === 'undefined') {
    return null
  }

  const { nodes, portal, position } = props
  let timeout = null
  const v = new THREE.Vector3()
  const wheel = useRef(0)
  const hand = useRef()
  // const mesh = useRef<THREE.Mesh>(null!)
  const [clicked, click] = useState(false)
  const stencil = useMask(1, true)

  useLayoutEffect(() => {
    if (!nodes) return
    Object.values(nodes).forEach(
      (node) =>
        node.material &&
        node.parent.name !== 'hand-r' &&
        node.name !== 'Cube3' &&
        node.name !== 'Cube 8' &&
        node.name !== 'Cube 17' &&
        node.name !== 'Cube 24' &&
        Object.assign(node.material, stencil),
    )
  })

  useFrame((state) => {
    v.copy({ x: state.pointer.x, y: state.pointer.y, z: 0 })
    v.unproject(state.camera)

    if (hand?.current?.rotation?.x) {
      hand.current.rotation.x = THREE.MathUtils.lerp(
        hand.current.rotation.x,
        clicked ? -0.7 : -0.5, 0.2
      )
    }


    if (hand?.current?.position?.lerp) {
      hand.current.position.lerp(
        {
          x: v.x - 100,
          y: wheel.current + v.y,
          z: v.z
        },
        0.4
      )

    }

    state.camera.zoom = THREE.MathUtils.lerp(state.camera.zoom, clicked ? 0.9 : 0.7, clicked ? 0.025 : 0.15)
    state.camera.position.lerp({
      x: -state.pointer.x * 400,
      y: -state.pointer.y * 200,
      z: 1000
    }
      , 0.1)
    state.camera.lookAt(0, 0, 0)
    state.camera.updateProjectionMatrix()
  })

  return (
    <group {...props} dispose={null} position={position}>
      <Float object={nodes['Bg-stuff']} />
      <Float object={nodes['Emoji-4']} />
      <Float object={nodes['Emoji-2']} />
      <Float object={nodes['Emoji-3']} />
      <Float object={nodes['Emoji-1']} />
      <Float object={nodes['Icon-text-2']} />
      <Float object={nodes['Icon-like']} />
      <Float object={nodes['Icon-star']} />
      <Float object={nodes['Icon-play']} />
      <Float object={nodes['Icon-text-1']} />
      <group ref={hand}>
        <Clone object={nodes['hand-r']} rotation-y={0.35} />
      </group>
      <Clone object={nodes['Bubble-BG']} scale={1.25} />
      <FloatImpl floatIntensity={100} rotationIntensity={0.5} speed={1}>
        <Float intensity={100} rotation={0.5} object={nodes['Bubble-LOGO']} position={[0, -0, 0]} scale={1.5} />
        <group position={[0, -50, 0]} rotation={[-0.15, 0, 0]}>
          <Clone object={nodes['hand-l']} position={[80, 100, -150]} />
          <group name="phone" position={[-50, 0, -68]}>
            <Clone object={[nodes['Rectangle 4'], nodes['Rectangle 3'], nodes['Boolean 2']]} />
            <Mask id={1} colorWrite={false} depthWrite={false} geometry={nodes.screen.geometry} castShadow receiveShadow position={[0, 0, 9.89]}>
              <Html className="content-embed" portal={portal} scale={40} transform zIndexRange={[-1, 0]}>
                <Main />
              </Html>
            </Mask>
            <mesh
              onWheel={(e) => {
                wheel.current = -e.deltaY / 2
                clearTimeout(timeout)
                timeout = setTimeout(() => (wheel.current = 0), 100)
              }}
              onPointerDown={(e) => {
                e.target.setPointerCapture(e.pointerId)
                click(true)
              }}
              onPointerUp={(e) => {
                e.target.releasePointerCapture(e.pointerId)
                click(false)
              }}
              // ref={mesh}
              receiveShadow
              geometry={nodes.screen.geometry}
            >
              <meshStandardMaterial transparent opacity={0.05} />
            </mesh>
          </group>
        </group>
      </FloatImpl>
    </group>
  )
}

export default MyComponentWithSpline

const Float = ({ object, intensity = 300, rotation = 1, ...props }) => {
  return (
    <FloatImpl floatIntensity={intensity} rotationIntensity={rotation} speed={2}>
      <Clone object={object} {...props} />
    </FloatImpl>
  )
}
