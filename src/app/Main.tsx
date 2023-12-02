/* eslint-disable react/jsx-no-undef */
"use client";
import '@aws-amplify/ui-react/styles.css';
import { loadStripe } from "@stripe/stripe-js";

import { StorageManager } from '@aws-amplify/ui-react-storage'
import {
  Text,
  Flex,
  Button,
  defaultDarkModeOverride,
  Loader,
  useTheme,
  Grid,
  View,
  Card,
  Heading,
  Authenticator,
  useAuthenticator,
  AccountSettings,
  Divider,
  CheckboxField,
  AuthenticatorProps,
  Menu,
  MenuItem,
  Input,
  Label,
} from '@aws-amplify/ui-react'
import { ThemeProvider } from '@aws-amplify/ui-react';
import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore:next-line
import dynamic from 'next/dynamic';
import { Auth, Storage } from 'aws-amplify';
// @ts-ignore
import { Features } from './Features.tsx';
// @ts-ignore
import { retry, noop, getData, measurePromise } from './utils.ts';

const Picker = (props: { onClick: any }) => {
  return (
    <Flex direction="column" justifyContent="space-around">
      <Button size="large" variation="primary" isFullWidth={true} onClick={props.onClick}>
        Browse Files
      </Button>
    </Flex>
  )
}

// @ts-ignore:next-line
const ReactPlayer: ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false });




export const Main = () => {
  const { tokens } = useTheme();

  const { user } = useAuthenticator((context) => [context.user]);
  const { authStatus } = useAuthenticator(context => [context.authStatus]);
  const { route, toSignIn, toSignUp } = useAuthenticator(context => [context.route]);
  const [showAccountSettings, setShowAccountSettings] = useState(false)
  const [showFeatures, setShowFeatures] = useState(false)
  const [renderAuth, setRenderAuth] = useState<'signIn' | 'signUp' | undefined>(undefined)

  useEffect(() => {
    if ([authStatus, route].includes('authenticated')) {
      setRenderAuth(undefined)
    }
  }, [route, authStatus]);

  const goSignIn = () => {
    toSignIn()
    setRenderAuth('signIn')
  }

  const goSignUp = () => {
    toSignUp()
    setRenderAuth('signUp')
  }

  const displayAccountSettings = () => {
    setShowAccountSettings(!showAccountSettings)
  }

  const upgrade = async () => {
    try {
      const stripe = await loadStripe(
        "pk_test_51OHZRzHjC5oFez5BiDFM3Up4nzlz0XkRwfHDXbxLjNqzJSLuBq0ZKwyrhVH26W1pVG18vHKPINzFoBhTPmy7EhGE00vtJ4cAF4"
      );
      console.log({ stripe });
      const error = await stripe?.redirectToCheckout({
        lineItems: [{ price: "price_1OHZaRHjC5oFez5B3xJk2zRS", quantity: 1 }],
        mode: "subscription",
        successUrl: "https://main.d1dn1n1ry842dz.amplifyapp.com/",
        cancelUrl: "https://main.d1dn1n1ry842dz.amplifyapp.com/cancel",
      });
      console.log({ error });
    } catch (error) {
      console.error(error);
    }

  }

  const renderDashboard = () => {
    if (showFeatures) {
      return <Features />
    }
    return showAccountSettings ?
      <Flex
        flex={1}
        direction="column"
        justifyContent="space-between"
      >
        <Flex
          direction="column"
          justifyContent="space-between"
        >
          <AccountSettings.ChangePassword
            onSuccess={noop}
            onError={noop}
          />
        </Flex>
        <Grid
          templateColumns=".4fr 1fr"
          columnGap="0.5rem"
        >
          <AccountSettings.DeleteUser
            onError={noop}
            onSuccess={noop}
          />
          <Button
            variation="primary"
            loadingText=""
            onClick={displayAccountSettings}
          >
            Cancel
          </Button>
        </Grid>
      </Flex>
      : <Clip />
    // : (
    //   <Flex flex={1} width={"100%"}>
    //     <iframe
    //       title="alexlevy0/ClipCrafterStudio/main"
    //       allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
    //       sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
    //       frameBorder="0"
    //       style={{ width: "100%", height: "100%" }}
    //       // src="https://codesandbox.io/p/github/alexlevy0/ClipCrafterStudio/main?file=%2F.codesandbox%2Ftasks.json&embed=1"
    //       src="https://clip-crafter-studio-web-service.onrender.com"
    //     >
    //     </iframe>
    //   </Flex >
    // )
  }

  return (
    <ThemeProvider theme={{ name: 'my-theme', overrides: [defaultDarkModeOverride] }} colorMode={'dark'}>
      <Authenticator.Provider >
        <Grid
          style={{ height: '100vh' }}
          columnGap="0.5rem"
          rowGap="0.5rem"
          templateColumns=".5fr 1fr 1fr"
          templateRows=".3fr 3.6fr .1fr"
        >
          <Card
            columnStart="1"
            columnEnd="-1"
            display="flex"
          >
            <Flex
              flex={1}
              alignContent="center"
              alignItems="center"
              justifyContent="flex-start"
            // width={'100%'}
            >
              <Heading
                color={"#e8e6e3"}
                level={3}
                fontWeight="bold"
              >
                ClipCrafter AI
              </Heading>
              <Heading
                // width={'100%'}
                color={"#e8e6e3"}
                level={6}
                fontWeight="bold"
              >
                Real-Time Collaborative AI Video Editing in the Cloud
              </Heading>
            </Flex>
            <Flex
              // flex={1}
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
                    size="large"
                    menuAlign="end"
                  >
                    <MenuItem onClick={() => alert('Download')}>
                      My Projects
                    </MenuItem>
                    <MenuItem isDisabled onClick={() => alert('Create a Copy')}>
                      My Team
                    </MenuItem>
                    <MenuItem onClick={() => alert('Create a Copy')}>
                      Usage
                    </MenuItem>
                    <MenuItem onClick={upgrade}>
                      Upgrade
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={displayAccountSettings}>
                      Account Settings
                    </MenuItem>
                    <MenuItem onClick={() => Auth.signOut()}>
                      Logout
                    </MenuItem>
                  </Menu>

                </>
              ) : (
                <>
                  <Button
                    loadingText=""
                    onClick={goSignIn}

                  >
                    Login
                  </Button>
                  <Button
                    loadingText=""
                    onClick={goSignUp}
                  >
                    Sign Up
                  </Button>
                  <Menu
                    menuAlign="end"
                    size="large"
                  >
                    <MenuItem onClick={() => setShowFeatures(true)}>
                      Features
                    </MenuItem>
                    <MenuItem onClick={displayAccountSettings}>
                      API
                    </MenuItem>
                    <MenuItem onClick={upgrade}>
                      Upgrade
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={() => alert('Create a Copy')}>
                      Pricing
                    </MenuItem>

                  </Menu>
                </>
              )}
            </Flex>
          </Card>
          <Card
            columnStart="1"
            columnEnd="2"
            variation="elevated"
          >
            {/* <Clip /> */}
          </Card>
          <Card
            columnStart="2"
            columnEnd="-1"
            display="flex"
          >
            {renderDashboard()}
            {!!renderAuth && authStatus !== 'authenticated' && (
              <Authenticator
                hideSignUp={renderAuth === "signIn"}
                loginMechanisms={['email']}
                signUpAttributes={[
                  "email"
                ]}
                variation="modal"
                initialState={renderAuth}
                socialProviders={['apple', 'google']}
                services={{
                  async validateCustomSignUp(formData) {
                    if (Object.keys(formData).length >= 3 && !formData.acknowledgement) {
                      return {
                        acknowledgement: 'You must agree to the Terms & Conditions',
                      };
                    }
                  },
                }}
                components={{
                  SignIn: {
                    Footer() {
                      return (
                        <>
                          <Flex
                            paddingRight={tokens.components.authenticator.form.padding}
                            paddingLeft={tokens.components.authenticator.form.padding}
                            paddingBottom={tokens.components.button.paddingBlockEnd}
                          >
                            <Button
                              isFullWidth
                              variation="link"
                              onClick={() => setRenderAuth(undefined)}
                            >
                              Cancel
                            </Button>
                          </Flex>
                          <Authenticator.SignIn.Footer />
                        </>
                      )
                    }
                  },
                  SignUp: {
                    FormFields() {
                      const { validationErrors } = useAuthenticator();
                      return (
                        <>
                          <Authenticator.SignUp.FormFields />
                          <CheckboxField
                            errorMessage={validationErrors.acknowledgement as string}
                            hasError={!!validationErrors.acknowledgement}
                            name="acknowledgement"
                            value="yes"
                            label="I agree with the Terms & Conditions"
                          />
                          <Button
                            variation="link"
                            onClick={() => setRenderAuth(undefined)}
                          >
                            Cancel
                          </Button>
                        </>
                      );
                    },
                  },
                }}
              />
            )}
          </Card>
          <Card
            columnStart="1"
            columnEnd="-1"
          >
            Footer
          </Card>
        </Grid>
      </Authenticator.Provider>

    </ThemeProvider>

  );
};

const Clip = () => {
  const READY = 'Ready'
  const STANDBY = ''
  const PROCESSING = 'Processing'

  const [url, setUrl] = useState('')
  const [urlEdited, setUrlEdited] = useState('')
  const [processDurationSecond, setProcessDurationSecond] = useState('')
  const [status, setStatus] = useState(STANDBY)

  useEffect(() => {
    Notification.requestPermission()
  }, []);

  const onReady = () => {
    setStatus(READY)
  }

  const onSuccess = async ({ key = '' }) => {
    try {
      if (!key) return
      setStatus(`${PROCESSING} : ${key}…`)
      // @ts-ignore
      const url = await retry({ fn: async () => await getData(key, '') })
      setUrl(url)

      const durationSecond = await measurePromise(async () => {
        const urlEdited = await retry({ fn: async () => await getData(key) })
        setUrlEdited(urlEdited)
      })
      setProcessDurationSecond(`⏱️ ${durationSecond}`)
      new Notification(`⏱️ ${durationSecond}`)
    } catch (error) {
      console.error(`onSuccess ERROR : ${error}`);
    }
  }

  const onResetVideoUrl = () => setUrl('')

  const ref = useRef(null);

  return (
    <Flex
      direction="column"
      flex={1}

    >
      <StorageManager
        // maxFileSize={''} // TODO
        ref={ref}
        isResumable
        accessLevel='public'
        acceptedFileTypes={['video/*']}
        maxFileCount={1}
        onUploadSuccess={onSuccess}
        onFileRemove={onResetVideoUrl}
        onUploadError={onResetVideoUrl}
        onUploadStart={onResetVideoUrl}
        components={{ FilePicker({ onClick }) { return <Picker onClick={onClick} /> } }}
      />
      {/* <Flex direction="column" gap="small">
        <Input
          size="small"
          width="100%"
          enterKeyHint="send"
          placeholder="Paste YouTube link or drop a file"
        />
      </Flex> */}
      <Heading
        level={5}
      >
        {status}
      </Heading>
      {!!url && processDurationSecond === '' && (
        <Flex
          backgroundColor={'rgb(13, 25, 38)'}
          direction="column"
          gap="small"
          justifyContent="space-around"
        >
          <Loader
            emptyColor={'rgb(13, 25, 38)'}
            filledColor={'rgb(125, 214, 232)'}
            variation="linear"
          />
        </Flex>
      )}
      {processDurationSecond !== '' && (
        <Flex
          backgroundColor={'rgb(13, 25, 38)'}
          direction="column"
          gap="small"
          justifyContent="space-around"
        >
          <Heading
            level={5}
          >
            {processDurationSecond}
          </Heading>
        </Flex>
      )}
      <Flex
        alignContent="center"
        justifyContent={'center'}
        gap="small"
      >
        <ReactPlayer
          style={{ backgroundColor: 'black' }}
          playing={false}
          controls={true}
          url={url}
          width={"100%"}
        />
        <ReactPlayer
          style={{ backgroundColor: 'grey' }}
          onReady={onReady}
          playing={false}
          controls={true}
          url={urlEdited}
          width={"100%"}
        />
      </Flex>
    </Flex>
  );
}
