// @ts-nocheck
"use client";
import '@aws-amplify/ui-react/styles.css';
import { Amplify } from 'aws-amplify';
import awsconfig from '../aws-exports';
import { StorageManager } from '@aws-amplify/ui-react-storage'
import { Flex, Divider, Button, ColorMode, defaultDarkModeOverride } from '@aws-amplify/ui-react'
import { ThemeProvider, withAuthenticator } from '@aws-amplify/ui-react';
import React, { useEffect, useState, useLayoutEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, Mask, useMask, OrthographicCamera, Clone, Float as FloatImpl } from '@react-three/drei'

const ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false });
const useSpline = dynamic(() => import('@splinetool/r3f-spline'), { ssr: false });

Amplify.configure({ ...awsconfig, ssr: true });

const processFile = ({ file, key }: { key: string, file: Blob }) => {
  const fileParts = key.split('.');
  const ext = fileParts.pop();
  return {
    file,
    key: `${Date.now()}${fileParts.join('.')}.${ext}`,
  };
}

function App(props) {
  console.log(props?.user)
  console.log({ props })
  const container = useRef()
  const domContent = useRef()
  // return null
  return (
    <div ref={container} className="content-container">
      <div
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden' }}
        ref={domContent}
      />
      <Canvas
        shadows
        flat
        linear
        style={{ pointerEvents: 'none' }}
        eventSource={container}
        eventPrefix="page">
        <directionalLight castShadow intensity={0.4} position={[-10, 50, 300]} shadow-mapSize={[512, 512]} shadow-bias={-0.002}>
          <orthographicCamera attach="shadow-camera" args={[-2000, 2000, 2000, -2000, -10000, 10000]} />
        </directionalLight>
        <OrthographicCamera makeDefault={true} far={100000} near={-100000} position={[0, 0, 1000]} />
        <hemisphereLight intensity={0.5} color="#eaeaea" position={[0, 1, 0]} />
        <Scene /* signOut={props?.signOut} */ portal={domContent} position={[0, -50, 0]} />
      </Canvas>
    </div>
  )
}

export default withAuthenticator(App);

function Main({ signOut }) {
  const [colorMode] = React.useState<ColorMode>('system');
  const theme = {
    name: 'my-theme',
    overrides: [defaultDarkModeOverride],
  };
  const [files, setFiles] = React.useState({});
  const [hasWindow, setHasWindow] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setHasWindow(true);
    }
  }, []);
  const onLogout = () => {
    signOut()
    console.log('fire onLogout')
  }
  return (
    <ThemeProvider theme={theme} colorMode={colorMode}>
      <div >
        <StorageManager
          isResumable
          accessLevel='public'
          acceptedFileTypes={['video/*']}
          maxFileCount={5}
          processFile={processFile}
          onFileRemove={({ key }) => {
            setFiles((prevFiles) => {
              return {
                ...prevFiles,
                [key]: undefined,
              };
            });
          }}
          onUploadError={(error, { key }) => {
            setFiles((prevFiles) => {
              return {
                ...prevFiles,
                [key]: {
                  status: 'error',
                },
              };
            });
          }}
          onUploadSuccess={({ key }) => {
            setFiles((prevFiles) => {
              return {
                ...prevFiles,
                [key as string]: {
                  status: 'success',
                },
              };
            });
          }}
          onUploadStart={({ key }) => {
            setFiles((prevFiles) => {
              return {
                ...prevFiles,
                [key as string]: {
                  status: 'uploading',
                },
              };
            });
          }}
          components={{
            FilePicker({ onClick }) {
              return (
                <Flex direction="column" justifyContent="space-around">
                  <Button
                    size="large"
                    variation="primary"
                    isFullWidth={true}
                    onClick={onClick}
                  >
                    Browse Files
                  </Button>
                  {/* <Divider orientation="vertical" /> */}
                  <Button
                    size="large"
                    isFullWidth={true}
                    onClick={onLogout}
                  >
                    Logout
                  </Button>
                </Flex>
              );
            },
          }}
        />
        {/* 
        {Object.keys(files).map((key) => {
          return files[key] ? (
            <div style={{ color: 'white' }}>
              {key}: {files[key].status}
            </div>
          ) : null;
        })} */}
        <main className="flex min-h-screen flex-col items-center justify-between p-0">
          {hasWindow && <ReactPlayer
            width={"100%"}
            url='https://giistyxelor.s3.amazonaws.com/giists/video/video0cP3w019TiZYYcUy22WY.mp4'
            controls
            playing={false}
          />}
        </main>
      </div>
    </ThemeProvider>
  );
}


function Scene({ signOut, portal, ...props }) {
  let timeout = null
  const v = new THREE.Vector3()
  const wheel = useRef(0)
  const hand = useRef()
  const [clicked, click] = useState(false)
  const { nodes } = useSpline('/scroll.splinecode')
  // Take the stencil and drop it over everything but the right hand
  const stencil = useMask(1, true)
  useLayoutEffect(() => {
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
    hand.current.rotation.x = THREE.MathUtils.lerp(hand.current.rotation.x, clicked ? -0.7 : -0.5, 0.2)
    hand.current.position.lerp({ x: v.x - 100, y: wheel.current + v.y, z: v.z }, 0.4)
    state.camera.zoom = THREE.MathUtils.lerp(state.camera.zoom, clicked ? 0.9 : 0.7, clicked ? 0.025 : 0.15)
    state.camera.position.lerp({ x: -state.pointer.x * 400, y: -state.pointer.y * 200, z: 1000 }, 0.1)
    state.camera.lookAt(0, 0, 0)
    state.camera.updateProjectionMatrix()
  })
  return (
    <group {...props} dispose={null}>
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
                <Main signOut={signOut} />
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
              receiveShadow
              geometry={nodes.screen.geometry}>
              <meshStandardMaterial transparent opacity={0.1} />
            </mesh>
          </group>
        </group>
      </FloatImpl>
    </group>
  )
}

const Float = ({ object, intensity = 300, rotation = 1, ...props }) => (
  <FloatImpl floatIntensity={intensity} rotationIntensity={rotation} speed={2}>
    <Clone object={object} {...props} />
  </FloatImpl>
)
