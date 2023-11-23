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

const retry: any = async ({ fn = noop, retries = 60, delay = 1000, err = '' }) =>
  retries > 0 ? fn().catch(async error => {
    await sleep(delay);
    return retry({ fn, retries: retries - 1, delay, error });
  }) : Promise.reject(err);

const getUrl = async (key: string) => {
  const config = {
    validateObjectExistence: true,
    download: false, expires: 3600
  }
  const [name, format] = key.split('.')
  const newKey = `${name}_edited.${format}`
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

  const onSuccess = async ({ key = '' }) => {
    if (!key) return
    const url = await retry({ fn: () => getUrl(key) })
      .catch(console.error)
    setUrl(url)
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