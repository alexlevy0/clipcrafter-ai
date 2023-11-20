"use client";
import '@aws-amplify/ui-react/styles.css';
import { StorageManager } from '@aws-amplify/ui-react-storage'
import { Flex, Button, ColorMode, defaultDarkModeOverride } from '@aws-amplify/ui-react'
import { ThemeProvider } from '@aws-amplify/ui-react';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Storage, Hub } from 'aws-amplify';

// @ts-ignore:next-line
const ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false });

const theme = {
  name: 'my-theme',
  overrides: [defaultDarkModeOverride],
};

interface IfilesNames {
  [key: string]: { status: string, error?: string };
};

interface IStorageGet {
  level?: 'private' | 'protected' | 'public';
  identityId?: string;
  download?: boolean;
  expires?: number;
  contentType?: string;
  validateObjectExistence?: boolean;
  cacheControl?: string;
  track?: boolean;
};

export function Main({ signOut }: { signOut: any }) {
  const [colorMode] = useState<ColorMode>('system');
  const [filesNames, setFilesNames] = useState<IfilesNames>({});
  const [hasWindow, setHasWindow] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHasWindow(true);
    }

    const fetchData = async () => {
      const fileKey = Object.keys(filesNames).find((key: string) =>
        filesNames[key].status === "success" && !filesNames[key].error)

      const S3Key = fileKey?.[0]
      if (S3Key?.length) {
        const storageGetConfig: IStorageGet = {
          level: 'public', // TODO Change to private
          // identityId: 'xxxxxxx', // the identityId of that user
          download: false,
          track: true,
        }
        const signedURL = await Storage.get(S3Key, storageGetConfig)
        if (signedURL) {
          setVideoUrl(signedURL)
        }
      }
    }

    try {
      fetchData()
    } catch (error) {
      console.error(error)
    }
  }, [filesNames]);

  useEffect(() => {
    let _listener: () => void

    const startListener = () => {
      const allChanelRegex = /.*/
      _listener = Hub.listen(allChanelRegex, ({
        patternInfo,
        source,
        channel,
        payload: { event, data }
      }) => {
        console.log(`Event on : ${channel}`,
          { patternInfo }, { source }, { event }, { data }
        );
      });
    }

    startListener()

    return () => _listener()
  }, []);

  const onFileEvent = (key: string, { status, error }: { status: string, error?: any }) => {
    console.log('onFileEvent : ', { key }, { status }, { error });
    setFilesNames((prevFiles) => {
      return {
        ...prevFiles,
        [key as string]: {
          status,
          ...(error ? error : {}),
        },
      };
    });
    console.log({ filesNames });
  }


  return (
    <ThemeProvider theme={theme} colorMode={colorMode}>
      <div>
        <StorageManager
          isResumable
          // Size is in bytes
          // maxFileSize={10000} // TODO
          accessLevel='public'
          acceptedFileTypes={['video/*']}
          maxFileCount={1}
          onUploadSuccess={({ key = 'N/A' }) => onFileEvent(key, { 'status': 'success' })}
          onFileRemove={({ key }) => onFileEvent(key, { 'status': 'remove' })}
          onUploadError={(error, { key }) => onFileEvent(key, { 'status': 'error', error })}
          onUploadStart={({ key = 'N/A' }) => onFileEvent(key, { 'status': 'uploading' })}
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
                  <Button
                    size="large"
                    isFullWidth={true}
                    onClick={signOut}
                  >
                    Logout
                  </Button>
                </Flex>
              );
            },
          }}
        />
        <main className="flex min-h-screen flex-col items-center justify-between p-0">
          {hasWindow && (
            <ReactPlayer
              // @ts-ignore:next-line
              width={"100%"}
              url={videoUrl}
              controls
              playing={false}
            />)}
        </main>
      </div>
    </ThemeProvider>
  );
}