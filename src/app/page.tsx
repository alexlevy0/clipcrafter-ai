'use client'
import React from 'react'
import '@aws-amplify/ui-react/styles.css'
import { Amplify } from 'aws-amplify'
import config from '../amplifyconfiguration.json'
import { Authenticator } from '@aws-amplify/ui-react'
// @ts-expect-error:next-line
import { Main } from './Main.tsx'

Amplify.configure(config, {
  ssr: true,
})

const App = () => {
  return (
    <Authenticator.Provider>
      <Main />
    </Authenticator.Provider>
  )
}

export default App
