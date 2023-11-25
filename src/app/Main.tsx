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

const retry = async ({ fn = noop, retries = 60, delay = 1000, err = '' }) => {
  const attempt = async (remainingRetries: number, lastError = null): Promise<any> => {
    if (remainingRetries <= 0) {
      throw new Error(`Échec après ${retries} tentatives: ${err}\nDernière erreur: ${lastError}`);
    }
    try {
      return await fn();
    } catch (error) {
      console.log(`Tentative échouée avec l'erreur: ${error}, réessayer...`);
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
    console.log('getData Err' + error);
  }
}

export const Main = () => {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState('')

  const onSuccess = async ({ key = '' }) => {
    if (!key) return

    // @ts-ignore
    const url = await retry({ fn: async () => await getData(key) }).catch(console.error)
    setStatus('Voilà!')
    setUrl(url)
  }

  const onResetVideoUrl = () => setUrl('')

  const ref = useRef(null);

  return (
    <ThemeProvider theme={{ name: 'my-theme', overrides: [defaultDarkModeOverride] }} colorMode={'dark'}>
      <div>
        <StorageManager
          ref={ref}
          isResumable
          accessLevel='public'
          acceptedFileTypes={['video/*']}
          maxFileCount={1}
          onUploadSuccess={onSuccess}
          onFileRemove={onResetVideoUrl}
          onUploadError={onResetVideoUrl}
          onUploadStart={() => setStatus('Computing Video')}
          components={{ FilePicker({ onClick }) { return <Picker onClick={onClick} /> } }}
        />
        <Flex
          backgroundColor={'rgb(13, 25, 38)'}
          paddingLeft={60}
          paddingRight={60}
          paddingTop={50}
          direction="column" justifyContent="space-around">
          <>
            {status && status !== 'Voilà!' && <Loader
              emptyColor={'rgb(13, 25, 38)'}
              filledColor={'grey'}
              variation="linear"
            />}
            <Text
              variation="primary"
              as="p"
              lineHeight="1.5em"
              fontWeight={600}
              fontSize="2em"
              fontStyle="normal"
              width="50vw"
            >
              {!status ? 'Upload a file to get started' : status}
            </Text>
          </>
        </Flex>

        <main style={{ backgroundColor: 'rgb(13, 25, 38)' }} className="flex min-h-screen flex-col items-center justify-between p-0">
          <ReactPlayer playing={true} controls={true} url={url} width={"100%"} />
        </main>
      </div>
    </ThemeProvider>
  );
}