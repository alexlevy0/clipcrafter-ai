"use client";
import '@aws-amplify/ui-react/styles.css';
import { Amplify } from 'aws-amplify';
import awsconfig from '../aws-exports.js';
// import { withAuthenticator } from '@aws-amplify/ui-react';
import { Authenticator } from '@aws-amplify/ui-react';

import React, { useEffect, useRef, useState } from 'react';
// // @ts-ignore:next-line
// import dynamic from 'next/dynamic';
// import { Canvas } from '@react-three/fiber'
// import { OrthographicCamera } from '@react-three/drei';
// // @ts-ignore
// import getSpline from '@splinetool/r3f-spline'
// @ts-ignore
import { Main } from './Main.tsx'

Amplify.configure({ ...awsconfig, ssr: true });

// // @ts-ignore
// const MyComponentWithSpline = dynamic(() => import('./CmpWithSpline.tsx'), { ssr: false });


// const Scene = ({ portal, position }: any) => {
//   if (typeof window === 'undefined') {
//     return null
//   }

//   const { nodes } = getSpline('scroll.splinecode')

//   return nodes && (
//     <MyComponentWithSpline position={position} nodes={nodes} portal={portal} />
//   )
// }

const App = () => {

  return (
    <Authenticator.Provider >
      <Main />
    </Authenticator.Provider>
  )

  // const container = useRef(null)
  // const domContent = useRef(null)
  // return (
  //   <div ref={container} className="content-container">
  //     <div style={{ top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', position: 'absolute' }} ref={domContent} />
  //     <Canvas shadows flat linear style={{ pointerEvents: 'none' }} eventSource={container as any} eventPrefix="page">
  //       <directionalLight castShadow intensity={0.4} position={[-10, 50, 300]} shadow-mapSize={[512, 512]} shadow-bias={-0.002}>
  //         <orthographicCamera attach="shadow-camera" args={[-2000, 2000, 2000, -2000, -10000, 10000]} />
  //       </directionalLight>
  //       <OrthographicCamera makeDefault={true} far={100000} near={-100000} position={[0, 0, 1000]} />
  //       <hemisphereLight intensity={0.5} color="#eaeaea" position={[0, 1, 0]} />
  //       <Scene portal={domContent} position={[0, -50, 0]} />
  //     </Canvas>
  //   </div>
  // )
}

// export default withAuthenticator(App);
export default App;
