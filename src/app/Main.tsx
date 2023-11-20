"use client";
import '@aws-amplify/ui-react/styles.css';
import { StorageManager } from '@aws-amplify/ui-react-storage'
import { Flex, Button, ColorMode, defaultDarkModeOverride } from '@aws-amplify/ui-react'
import { ThemeProvider } from '@aws-amplify/ui-react';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Storage } from 'aws-amplify';


// @ts-ignore:next-line
const ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false });


const processFile = ({ file, key }: { key: string, file: Blob }) => {
  const fileParts = key.split('.');
  const ext = fileParts.pop();
  return {
    file,
    // key: `${Date.now()}${fileParts.join('.')}.${ext}`,
    key: `${Date.now()}${fileParts.join('.')}.${ext}`,
  };
}


export function Main({ signOut }: { signOut: any }) {
  const theme = {
    name: 'my-theme',
    overrides: [defaultDarkModeOverride],
  };
  const [colorMode] = useState<ColorMode>('system');
  const [files, setFiles] = useState({});
  const [hasWindow, setHasWindow] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHasWindow(true);
    }
    const fetchData = async () => {
      const result = await Storage.get('mejorar_tu_espanol_edited.mp4');
      setVideoUrl(result)
      console.log('File url ', result);
    }
    try {
      fetchData()
    } catch (error) {
      console.error(error)
    }
  }, []);



  const onUploadSuccess = ({ key }: { key: string }) => {
    console.log('onUploadSuccess', { key });
    // setFiles((prevFiles) => {
    //   return {
    //     ...prevFiles,
    //     [key as string]: {
    //       status: 'success',
    //     },
    //   };
    // });
  }


  return (
    <ThemeProvider theme={theme} colorMode={colorMode}>
      <div>
        <StorageManager
          isResumable
          accessLevel='public'
          acceptedFileTypes={['video/*']}
          maxFileCount={1}
          // processFile={processFile}
          onFileRemove={({ key }) => {
            setFiles((prevFiles) => {
              return {
                ...prevFiles,
                [key]: undefined,
              };
            });
          }}
          onUploadError={(error, { key }) => {
            setFiles((prevFiles) => {
              return {
                ...prevFiles,
                [key]: {
                  status: 'error',
                },
              };
            });
          }}
          // @ts-ignore:next-line
          onUploadSuccess={onUploadSuccess}
          onUploadStart={({ key }) => {
            setFiles((prevFiles) => {
              return {
                ...prevFiles,
                [key as string]: {
                  status: 'uploading',
                },
              };
            });
          }}
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
                  {/* <Divider orientation="vertical" /> */}
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
        {/* 
        {Object.keys(files).map((key) => {
          return files[key] ? (
            <div style={{ color: 'white' }}>
              {key}: {files[key].status}
            </div>
          ) : null;
        })} */}
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