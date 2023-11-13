"use client";
import '@aws-amplify/ui-react/styles.css';
import { Amplify } from 'aws-amplify';
import awsconfig from '../aws-exports';
import { StorageManager } from '@aws-amplify/ui-react-storage'
import { Button, ColorMode, defaultDarkModeOverride } from '@aws-amplify/ui-react'
import { ThemeProvider, Theme } from '@aws-amplify/ui-react';
import React, { useEffect, useState } from 'react';
// import ReactPlayer from 'react-player';
import dynamic from 'next/dynamic';
const ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false });


// Amplify.configure(awsconfig);
Amplify.configure({ ...awsconfig, ssr: true });

const theme: Theme = {
  name: 'my-theme',
  tokens: {
    colors: {
      font: {
        primary: { value: '#008080' },
        // ...
      },
    },
  },
};

const processFile = ({ file, key }: { key: string, file: Blob }) => {
  const fileParts = key.split('.');
  const ext = fileParts.pop();
  return {
    file,
    // This will prepend a unix timestamp
    // to ensure all files uploaded are unique
    key: `${Date.now()}${fileParts.join('.')}.${ext}`,
  };
}

export default function Home() {
  const [colorMode] = React.useState<ColorMode>('system');
  const theme = {
    name: 'my-theme',
    overrides: [defaultDarkModeOverride],
  };
  const [files, setFiles] = React.useState({});

  const [hasWindow, setHasWindow] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setHasWindow(true);
    }
  }, []);
  return (
    <ThemeProvider theme={theme} colorMode={colorMode}>
      <>
        <StorageManager
          isResumable
          accessLevel='public'
          acceptedFileTypes={['video/*']}
          // maxFileSize={10000} // TODO
          maxFileCount={5}
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
          onUploadSuccess={({ key }) => {
            setFiles((prevFiles) => {
              return {
                ...prevFiles,
                [key as string]: {
                  status: 'success',
                },
              };
            });
          }}
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
                <Button variation="primary" onClick={onClick}>
                  Browse Files
                </Button>
              );
            },
          }}
        />
        {/* {Object.keys(files).map((key) => {
          return files[key] ? (
            <div style={{ color: 'white' }}>
              {key}: {files[key].status}
            </div>
          ) : null;
        })} */}
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
          {hasWindow && <ReactPlayer
            url='https://giistyxelor.s3.amazonaws.com/giists/video/video0cP3w019TiZYYcUy22WY.mp4'
            controls
            playing={true}
          />}
        </main>
      </>
    </ThemeProvider>

  );
}
