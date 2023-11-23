"use client";
import '@aws-amplify/ui-react/styles.css';
import { StorageManager } from '@aws-amplify/ui-react-storage'
import { Flex, Button, defaultDarkModeOverride } from '@aws-amplify/ui-react'
import { ThemeProvider } from '@aws-amplify/ui-react';
import React, { useState } from 'react';
// @ts-ignore:next-line
import dynamic from 'next/dynamic';
import { Auth, Storage } from 'aws-amplify';

// @ts-ignore:next-line
const ReactPlayer: ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false });

const noop = async () => { undefined }

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retry = async ({ fn = noop, retries = 60, delay = 1000, keepTrying = false, err = '' }) => {
  const attempt = async (remainingRetries: number): Promise<any> => {
    try {
      const result = await fn();
      if (keepTrying && remainingRetries > 0) {
        await sleep(delay);
        return attempt(remainingRetries - 1);
      }
      return result;
    } catch (error) {
      if (remainingRetries <= 0) {
        throw err || error;
      }
      await sleep(delay);
      return attempt(remainingRetries - 1);
    }
  };

  return attempt(retries);
}

const getData = async (key: string, getProps: boolean = false) => {
  const config = {
    validateObjectExistence: true,
    download: false, expires: 3600
  }
  const [name, format] = key.split('.')
  const newKey = `${name}_edited.${format}`
  if (getProps) {
    return await Storage.getProperties(newKey)
  }
  return await Storage.get(newKey, config)
}

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

export const Main = () => {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState('')

  const onSuccess = async ({ key = '' }) => {
    if (!key) return
    const url = await retry({
      fn: async () => {
        await getData(key)
      }
    })
      .catch(console.error)
    setUrl(url)
    const props = await retry({
      keepTrying: true,
      fn: async () => {
        await getData(`${key}:status`, true)
      }
    })
      .catch(console.error)
    const { metadata: { status = '' } } = props || {}
    setStatus(status)
    console.log({ status });
  }

  const onResetVideoUrl = () => setUrl('')

  return (
    <ThemeProvider theme={{ name: 'my-theme', overrides: [defaultDarkModeOverride] }} colorMode={'dark'}>
      <div>
        <StorageManager
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
        <main style={{ backgroundColor: 'rgb(13, 25, 38)' }} className="flex min-h-screen flex-col items-center justify-between p-0">
          <ReactPlayer playing={true} controls={true} url={url} width={"100%"} />
        </main>
      </div>
    </ThemeProvider>
  );
}