import { Readable } from 'stream'
import {
  TranscribeClient,
  StartTranscriptionJobCommand,
  GetTranscriptionJobCommand,
  StartTranscriptionJobRequest,
  TranscriptionJobStatus,
} from '@aws-sdk/client-transcribe'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { conf } from './config'
import { sleep } from './utils'
import { log } from './logger'

const { transcribeJobCheckDelay, transcribeRegion, enabled } = conf.transcribeConf

function streamToString(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    stream.on('data', chunk => chunks.push(Buffer.from(chunk)))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
  })
}

async function fetchTranscript(transcriptFileUri: string, Bucket: string): Promise<string> {
  const key = transcriptFileUri.split('/').slice(3).join('/')
  const s3 = new S3Client({ region: transcribeRegion })
  const data = await s3.send(new GetObjectCommand({ Bucket, Key: key }))

  if (data.Body instanceof Readable) {
    return streamToString(data.Body)
  } else {
    throw new Error('Expected a stream in the response Body')
  }
}

async function waitForTranscriptionJobCompletion(
  client: TranscribeClient,
  jobId: string,
): Promise<string> {
  let jobStatus: TranscriptionJobStatus = TranscriptionJobStatus.IN_PROGRESS
  while (jobStatus === TranscriptionJobStatus.IN_PROGRESS) {
    const response = await client.send(
      new GetTranscriptionJobCommand({ TranscriptionJobName: jobId }),
    )
    jobStatus = response.TranscriptionJob.TranscriptionJobStatus
    if (jobStatus === TranscriptionJobStatus.COMPLETED) {
      return response.TranscriptionJob.Transcript.TranscriptFileUri
    } else if (jobStatus === TranscriptionJobStatus.FAILED) {
      throw new Error(`Transcription job failed: ${response.TranscriptionJob.FailureReason}`)
    }
    await sleep(transcribeJobCheckDelay)
  }
  throw new Error('Transcription job did not complete successfully')
}

async function transcribe(
  Name: string,
  Bucket: string,
  LanguageCode: StartTranscriptionJobRequest['LanguageCode'],
  MultipleLanguages: boolean = false, // ADD TO CONFIG ?
  isPaidUser: boolean = false,
): Promise<string> {
  if (!enabled) {
    console.log('Transcribe disabled')
    return ''
  }
  log('Starting Transcription Job')

  const client = new TranscribeClient({ region: transcribeRegion })
  const transcriptionJobName = `TranscriptionJob-${Date.now()}`

  const IdentifyLanguage = MultipleLanguages
    ? { IdentifyMultipleLanguages: true }
    : { IdentifyLanguage: true }

  const startCommand = new StartTranscriptionJobCommand({
    TranscriptionJobName: transcriptionJobName,
    Media: { MediaFileUri: `s3://${Bucket}/${Name}` },
    Subtitles: { Formats: ['vtt'] },
    Settings: {
      ShowSpeakerLabels: true,
      MaxSpeakerLabels: !isPaidUser ? 3 : 100,
      ChannelIdentification: true,
      ShowAlternatives: true,
      MaxAlternatives: 5,
    },
    ...(LanguageCode ? { LanguageCode } : IdentifyLanguage),
    ...(isPaidUser ? {} : { ToxicityDetection: [{ ToxicityCategories: ['ALL'] }] }),
    ...(isPaidUser
      ? {}
      : {
          ContentRedaction: {
            RedactionType: 'PII',
            RedactionOutput: 'redacted',
            PiiEntityTypes: ['ALL'],
          },
        }),
  })

  await client.send(startCommand)
  const transcriptionFileUri = await waitForTranscriptionJobCompletion(client, transcriptionJobName)

  console.log('Transcription Completed: ', transcriptionFileUri)
  return transcriptionFileUri
}

export async function getTranscript(
  Name: string,
  Bucket: string,
  languageCode: StartTranscriptionJobRequest['LanguageCode'] = undefined,
): Promise<{ fileUri: string; transcript: string }> {
  const fileUri = await transcribe(Name, Bucket, languageCode)
  const transcript = await fetchTranscript(fileUri, Bucket)
  return { fileUri, transcript }
}
