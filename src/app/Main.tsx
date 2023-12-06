/* eslint-disable react/jsx-no-undef */
'use client'
import {
  AccountSettings,
  Authenticator,
  Button,
  Card,
  CheckboxField,
  Divider,
  Flex,
  Grid,
  Heading,
  Loader,
  Menu,
  MenuItem,
  ThemeProvider,
  defaultDarkModeOverride,
  useAuthenticator,
  useTheme,
} from '@aws-amplify/ui-react'
import { StorageManager } from '@aws-amplify/ui-react-storage'
import '@aws-amplify/ui-react/styles.css'
// import { loadStripe } from '@stripe/stripe-js'
import React, { useEffect, useRef, useState } from 'react'
// @ts-expect-error:next-line
import dynamic from 'next/dynamic'
// Import { Auth } from 'aws-amplify'
import { signOut } from 'aws-amplify/auth'
// @ts-expect-error:next-line
import { Features } from './Features.tsx'
// @ts-expect-error:next-line
import { getData, measurePromise, noop, retry } from './utils.ts'

function Picker(
  props: Readonly<{
    onClick: React.MouseEventHandler<HTMLButtonElement> | undefined
  }>,
) {
  return (
    <Flex
      direction="column"
      justifyContent="space-around"
    >
      <Button
        isFullWidth
        onClick={props.onClick}
        size="large"
        variation="primary"
      >
        Browse Files
      </Button>
    </Flex>
  )
}

const ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false })

export function Main(): React.JSX.Element {
  const { tokens } = useTheme(),
    // Const { user } = useAuthenticator(context => [context.user])
    { authStatus } = useAuthenticator(context => [context.authStatus]),
    { route, toSignIn, toSignUp } = useAuthenticator(context => [context.route]),
    [showAccountSettings, setShowAccountSettings] = useState(false),
    [showFeatures, setShowFeatures] = useState(false),
    [renderAuth, setRenderAuth] = useState<'signIn' | 'signUp' | undefined>(undefined)

  useEffect((): void => {
    if (![authStatus, route].includes('authenticated')) {
      return
    }
    setRenderAuth(undefined)
  }, [route, authStatus])

  const goSignIn = (): void => {
      toSignIn()
      setRenderAuth('signIn')
    },
    goSignUp = () => {
      toSignUp()
      setRenderAuth('signUp')
    },
    displayAccountSettings = () => {
      setShowAccountSettings(!showAccountSettings)
    },
    upgrade = async () => {
      try {
        // const stripe = await loadStripe(
        //   'pk_test_51OHZRzHjC5oFez5BiDFM3Up4nzlz0XkRwfHDXbxLjNqzJSLuBq0ZKwyrhVH26W1pVG18vHKPINzFoBhTPmy7EhGE00vtJ4cAF4',
        // )
        // console.log({ stripe })
        // const error = await stripe?.redirectToCheckout({
        //   lineItems: [{ price: 'price_1OHZaRHjC5oFez5B3xJk2zRS', quantity: 1 }],
        //   mode: 'subscription',
        //   successUrl: 'https://main.dvqngwodvr6ir.amplifyapp.com/',
        //   cancelUrl: 'https://main.dvqngwodvr6ir.amplifyapp.com/cancel',
        // })
        // console.log({ error })
      } catch (error) {
        console.error(error)
      }
    },
    renderDashboard = () => {
      if (showFeatures) {
        return <Features />
      }
      return showAccountSettings ? (
        <Flex
          direction="column"
          flex={1}
          justifyContent="space-between"
        >
          <Flex
            direction="column"
            justifyContent="space-between"
          >
            <AccountSettings.ChangePassword
              onError={noop}
              onSuccess={noop}
            />
          </Flex>
          <Grid
            columnGap="0.5rem"
            templateColumns=".4fr 1fr"
          >
            <AccountSettings.DeleteUser
              onError={noop}
              onSuccess={noop}
            />
            <Button
              loadingText=""
              onClick={displayAccountSettings}
              variation="primary"
            >
              Cancel
            </Button>
          </Grid>
        </Flex>
      ) : (
        <Clip />
      )
      /*
       * : (
       *   <Flex flex={1} width={"100%"}>
       *     <iframe
       *       title="alexlevy0/ClipCrafterStudio/main"
       *       allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
       *       sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
       *       frameBorder="0"
       *       style={{ width: "100%", height: "100%" }}
       *       // src="https://codesandbox.io/p/github/alexlevy0/ClipCrafterStudio/main?file=%2F.codesandbox%2Ftasks.json&embed=1"
       *       src="https://clip-crafter-studio-web-service.onrender.com"
       *     >
       *     </iframe>
       *   </Flex >
       * )
       */
    }

  return (
    <ThemeProvider
      colorMode="dark"
      theme={{ name: 'my-theme', overrides: [defaultDarkModeOverride] }}
    >
      <Authenticator.Provider>
        <Grid
          columnGap={{ base: '0rem', large: '0.5rem' }}
          rowGap="0.5rem"
          style={{ height: '100vh' }}
          templateColumns={{ base: '0fr 1fr', large: '.2fr 1fr' }}
          templateRows=".3fr 3.6fr .1fr"
        >
          <Card
            columnEnd="-1"
            columnStart="1"
            display="flex"
          >
            <Flex
              alignContent="center"
              alignItems="center"
              flex={1}
              justifyContent="flex-start"
            >
              <Heading
                color="#e8e6e3"
                fontWeight="bold"
                level={3}
              >
                ClipCrafter AI
              </Heading>
              <Heading
                fontWeight="bold"
                level={6}
                display={{ base: 'none', large: 'block' }}
                // Width={'100%'}
                color={'#e8e6e3'}
              >
                Real-Time Collaborative AI Video Editing in the Cloud
              </Heading>
            </Flex>
            <Flex
              // Flex={1}
              alignContent="center"
              alignItems="center"
              justifyContent="flex-end"
            >
              {authStatus === 'authenticated' ? (
                <>
                  <Button
                    loadingText=""
                    onClick={goSignIn}
                  >
                    Dashboard
                  </Button>
                  <Button
                    loadingText=""
                    onClick={upgrade}
                  >
                    Upgrade
                  </Button>
                  <Menu
                    menuAlign="end"
                    size="large"
                  >
                    <MenuItem onClick={() => alert('Download')}>My Projects</MenuItem>
                    <MenuItem
                      isDisabled
                      onClick={() => alert('Create a Copy')}
                    >
                      My Team
                    </MenuItem>
                    <MenuItem onClick={() => alert('Create a Copy')}>Usage</MenuItem>
                    <MenuItem onClick={upgrade}>Upgrade</MenuItem>
                    <Divider />
                    <MenuItem onClick={displayAccountSettings}>Account Settings</MenuItem>
                    <MenuItem onClick={() => signOut()}>Logout</MenuItem>
                  </Menu>
                </>
              ) : (
                <>
                  <Button
                    display={{ base: 'none', large: 'flex' }}
                    loadingText=""
                    onClick={goSignIn}
                  >
                    Login
                  </Button>
                  <Button
                    display={{ base: 'none', large: 'flex' }}
                    loadingText=""
                    onClick={goSignUp}
                  >
                    Sign Up
                  </Button>
                  <Menu
                    menuAlign="end"
                    size="large"
                  >
                    <MenuItem onClick={() => setShowFeatures(true)}>Features</MenuItem>
                    <MenuItem onClick={displayAccountSettings}>API</MenuItem>
                    <MenuItem onClick={upgrade}>Upgrade</MenuItem>
                    <Divider />
                    <MenuItem onClick={goSignIn}>Login</MenuItem>
                    <MenuItem onClick={goSignUp}>Sign Up</MenuItem>
                  </Menu>
                </>
              )}
            </Flex>
          </Card>
          <Card
            columnEnd="2"
            columnStart="1"
            display={{ base: 'none', large: 'block' }}
            variation="elevated"
          >
            {/* <Clip /> */}
          </Card>
          <Card
            borderRadius={{ base: '0px', large: '20px' }}
            columnEnd="-1"
            columnStart="2"
            display="flex"
            marginRight={{ base: '0rem', large: '0.5rem' }}
          >
            {renderDashboard()}
            {Boolean(renderAuth) && authStatus !== 'authenticated' && (
              <Authenticator
                components={{
                  SignIn: {
                    Footer() {
                      return (
                        <>
                          <Flex
                            paddingBottom={tokens.components.button.paddingBlockEnd}
                            paddingLeft={tokens.components.authenticator.form.padding}
                            paddingRight={tokens.components.authenticator.form.padding}
                          >
                            <Button
                              isFullWidth
                              onClick={() => setRenderAuth(undefined)}
                              variation="link"
                            >
                              Cancel
                            </Button>
                          </Flex>
                          <Authenticator.SignIn.Footer />
                        </>
                      )
                    },
                  },
                  SignUp: {
                    FormFields() {
                      const { validationErrors } = useAuthenticator()
                      return (
                        <>
                          <Authenticator.SignUp.FormFields />
                          <CheckboxField
                            color="white"
                            errorMessage={validationErrors.acknowledgement as string}
                            hasError={Boolean(validationErrors.acknowledgement)}
                            label="I agree with the Terms & Conditions"
                            name="acknowledgement"
                            value="yes"
                          />
                          <Button
                            onClick={() => setRenderAuth(undefined)}
                            variation="link"
                          >
                            Cancel
                          </Button>
                        </>
                      )
                    },
                  },
                }}
                hideSignUp={renderAuth === 'signIn'}
                initialState={renderAuth}
                loginMechanisms={['email']}
                services={{
                  async validateCustomSignUp(formData) {
                    if (Object.keys(formData).length >= 3 && !formData.acknowledgement) {
                      return {
                        acknowledgement: 'You must agree to the Terms & Conditions',
                      }
                    }
                  },
                }}
                signUpAttributes={['email']}
                socialProviders={['google']}
                variation="modal"
              />
            )}
          </Card>
          <Card
            columnEnd="-1"
            columnStart="1"
          >
            Footer
          </Card>
        </Grid>
      </Authenticator.Provider>
    </ThemeProvider>
  )
}

function Clip() {
  const PROCESSING = 'Processing',
    READY = 'Ready',
    STANDBY = '',
    [url, setUrl] = useState(''),
    [urlEdited, setUrlEdited] = useState(''),
    [processDurationSecond, setProcessDurationSecond] = useState(''),
    [status, setStatus] = useState(STANDBY)

  useEffect(() => {
    Notification.requestPermission()
  }, [])

  const onReady = () => {
      setStatus(READY)
    },
    onSuccess = async ({ key = '' }) => {
      try {
        if (!key) {
          return
        }
        setStatus(`${PROCESSING} : ${key}…`)
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        const url = await retry({ fn: async () => await getData(key, '') })
        setUrl(url)

        const durationSecond = await measurePromise(async () => {
          const urlEdited = await retry({ fn: async () => await getData(key) })
          setUrlEdited(urlEdited)
        })
        setProcessDurationSecond(`⏱️ ${durationSecond}`)
        new Notification(`⏱️ ${durationSecond}`)
      } catch (error) {
        console.error(`onSuccess ERROR : ${error}`)
      }
    },
    onResetVideoUrl = () => setUrl(''),
    ref = useRef(null)

  return (
    <Flex
      direction="column"
      flex={1}
    >
      <StorageManager
        // MaxFileSize={''} // TODO
        acceptedFileTypes={['video/*']}
        components={{
          // eslint-disable-next-line react/prop-types
          FilePicker({ onClick }) {
            return <Picker onClick={onClick} />
          },
        }} // TODO
        maxFileCount={1}
        onFileRemove={onResetVideoUrl}
        onUploadError={onResetVideoUrl}
        onUploadStart={onResetVideoUrl}
        onUploadSuccess={onSuccess}
        ref={ref}
        isResumable
        // AccessLevel="public"
        accessLevel="guest"
      />
      {/* <Flex direction="column" gap="small">
        <Input
          size="small"
          width="100%"
          enterKeyHint="send"
          placeholder="Paste YouTube link or drop a file"
        />
      </Flex> */}
      <Heading level={5}>{status}</Heading>
      {Boolean(url) && processDurationSecond === '' && (
        <Flex
          backgroundColor="rgb(13, 25, 38)"
          direction="column"
          gap="small"
          justifyContent="space-around"
        >
          <Loader
            emptyColor="rgb(13, 25, 38)"
            filledColor="rgb(125, 214, 232)"
            variation="linear"
          />
        </Flex>
      )}
      {processDurationSecond !== '' && (
        <Flex
          backgroundColor="rgb(13, 25, 38)"
          direction="column"
          gap="small"
          justifyContent="space-around"
        >
          <Heading level={5}>{processDurationSecond}</Heading>
        </Flex>
      )}
      <Flex
        alignContent="center"
        gap="small"
        justifyContent="center"
      >
        <ReactPlayer
          controls
          playing={false}
          style={{ backgroundColor: 'black' }}
          url={url}
          width="100%"
        />
        <ReactPlayer
          controls
          onReady={onReady}
          playing={false}
          style={{ backgroundColor: 'grey' }}
          url={urlEdited}
          width="100%"
        />
      </Flex>
    </Flex>
  )
}
