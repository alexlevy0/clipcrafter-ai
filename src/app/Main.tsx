/* eslint-disable react/jsx-no-undef */
"use client";
import '@aws-amplify/ui-react/styles.css';
import { StorageManager } from '@aws-amplify/ui-react-storage'
import { Text, Flex, Button, defaultDarkModeOverride, Loader } from '@aws-amplify/ui-react'
import { ThemeProvider } from '@aws-amplify/ui-react';
import React, { useRef, useState } from 'react';
// @ts-ignore:next-line
import dynamic from 'next/dynamic';
import { Auth, Storage } from 'aws-amplify';

const Picker = (props: { onClick: any }) => {
  return (
    <Flex direction="column" justifyContent="space-around">
      <Button size="large" variation="primary" isFullWidth={true} onClick={props.onClick}>
        Browse Files
      </Button>
      <Button size="large" isFullWidth={true} onClick={async () => Auth.signOut().catch(console.error)}>
        Logout
      </Button>
    </Flex>
  )
}

// @ts-ignore:next-line
const ReactPlayer: ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false });

const noop = async () => { undefined }

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retry = async ({ fn = noop, retries = 120, delay = 4000, err = '' }) => {
  const attempt = async (remainingRetries: number, lastError = null): Promise<any> => {
    if (remainingRetries <= 0) {
      throw new Error(`RemainingRetries ${retries}, ${lastError}`);
    }
    try {
      return await fn();
    } catch (error) {
      await sleep(delay);
      return attempt(remainingRetries - 1);
    }
  };

  return attempt(retries);
}

const getData = async (key: string) => {
  try {
    const config = {
      validateObjectExistence: true,
      download: false, expires: 3600
    }
    const [name, format] = key.split('.')
    const newKey = `${name}_edited.${format}`
    return await Storage.get(newKey, config)
  } catch (error) {
    throw new Error("No data yet");
  }
}

const READY = 'Ready'
const STANDBY = ''
const PROCESSING = 'Processing'

export const Main = () => {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState(STANDBY)

  const onReady = () => {
    setStatus(READY)
  }

  const onSuccess = async ({ key = '' }) => {
    if (!key) return
    setStatus(`${PROCESSING} : ${key}…`)
    // @ts-ignore
    const url = await retry({ fn: async () => await getData(key) })
    console.log({ url });
    setUrl(url)
  }

  const onResetVideoUrl = () => setUrl('')

  const ref = useRef(null);

  return (
    <ThemeProvider theme={{ name: 'my-theme', overrides: [defaultDarkModeOverride] }} colorMode={'dark'}>
      <div>
        <StorageManager
          // defaultFiles={[{ key: 'public/5_YOUTUBERS_para_MEJORAR_tu_ESPANOL___Mis_favoritos-(1080p).mp4' }]}
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
        <Flex
          backgroundColor={'rgb(13, 25, 38)'}
          paddingLeft={60}
          paddingRight={60}
          paddingTop={50}
          direction="column" justifyContent="space-around">
          <>
            <Text
              variation="primary"
              as="p"
              lineHeight="1.5em"
              fontWeight={600}
              fontSize="1em"
              fontStyle="normal"
              width="100%"
            >
              {status}
            </Text>
            {status !== READY && status !== STANDBY && (
              <Loader
                emptyColor={'rgb(13, 25, 38)'}
                filledColor={'rgb(125, 214, 232)'}
                variation="linear"
              />
            )}
          </>
        </Flex>
        <main style={{ backgroundColor: 'rgb(13, 25, 38)' }} className="flex min-h-screen flex-col items-center justify-between p-0">
          <ReactPlayer onReady={onReady} playing={true} controls={true} url={url} width={"100%"} />
        </main>
      </div>
    </ThemeProvider>
  );
}