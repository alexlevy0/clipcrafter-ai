'use client'
import '@aws-amplify/ui-react/styles.css'
import { Amplify } from 'aws-amplify'
import awsconfig from '../aws-exports.js'
import { Authenticator } from '@aws-amplify/ui-react'

import React from 'react'
// @ts-expect-error:next-line
import { Main } from './Main.tsx'

Amplify.configure({ ...awsconfig, ssr: true })

const App = () => {
  return (
    <Authenticator.Provider>
      <Main />
    </Authenticator.Provider>
  )
}

export default App
