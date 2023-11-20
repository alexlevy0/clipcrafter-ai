"use client";
import '@aws-amplify/ui-react/styles.css';
import { StorageManager } from '@aws-amplify/ui-react-storage'
import { Flex, Button, ColorMode, defaultDarkModeOverride } from '@aws-amplify/ui-react'
import { ThemeProvider } from '@aws-amplify/ui-react';
import React, { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Storage, Hub } from 'aws-amplify';

// @ts-ignore:next-line
const ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false });

const theme = {
  name: 'my-theme',
  overrides: [defaultDarkModeOverride],
};

interface IfilesNames {
  [key: string]: { status: Status, error?: string };
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

enum Status {
  uploading,
  remove,
  success,
  error,
}

export function Main({ signOut }: { signOut: any }) {
  const [colorMode] = useState<ColorMode>('system');
  const [filesNames, setFilesNames] = useState<IfilesNames>({});
  const [hasWindow, setHasWindow] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>("");

  const displayVideo = useCallback(async () => {
    const fileKey = Object.keys(filesNames).find((key: string) =>
      filesNames[key].status === Status.success && !filesNames[key].error)

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
  }, [filesNames]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHasWindow(true);
    }

    const fetchData = async () => {
      try {
        await displayVideo()
      } catch (error) {
        throw new Error(`DisplayVideo Error : ${error}`);
      }
    }
    fetchData().catch(console.error)
  }, [filesNames, displayVideo]);

  useEffect(() => {
    let _listener: () => void

    const startListener = () => {
      _listener = Hub.listen(/.*/, ({
        patternInfo,
        source,
        channel,
        payload: { event, data }
      }) => {
        console.log(`Event on : ${channel}`,
          { patternInfo }, { source }, { event }, { data }
        );
        if (event === "getSignedUrl") {
          displayVideo()
        }
      });
    }

    startListener()

    return () => {
      _listener()
      console.log('listener removed');
    }
  });

  const onFileEvent = (key: string, { status, error }: { status: Status, error?: any }) => {
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
          onUploadSuccess={({ key = 'N/A' }) => onFileEvent(key, { 'status': Status.success })}
          onFileRemove={({ key }) => onFileEvent(key, { 'status': Status.remove })}
          onUploadError={(error, { key }) => onFileEvent(key, { 'status': Status.error, error })}
          onUploadStart={({ key = 'N/A' }) => onFileEvent(key, { 'status': Status.uploading })}
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