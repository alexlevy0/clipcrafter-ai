import {
  ComprehendClient,
  DetectEntitiesCommand,
  DetectSentimentCommand,
  DetectKeyPhrasesCommand,
  DetectToxicContentCommand,
} from '@aws-sdk/client-comprehend'
import OpenAI from 'openai'
import { conf } from './config'

const comprehendClient = new ComprehendClient({ region: conf.comprehendConf.region })
const openai = new OpenAI({ apiKey: conf.openAIConf.apiKey })

const chatGPTPrompt =
  'Analyze the following transcript segment and identify the key points or moments. Highlight any significant events, emotional expressions, decisions made, or changes in the topic. Provide a concise summary of why these points are important in the context of the overall content:'

export async function getKeyMoments(transcriptText: string): Promise<any[]> {
  const segments = segmentText(transcriptText)
  const keyMoments = []

  for (const segment of segments) {
    const entitiesCommand = new DetectEntitiesCommand({ Text: segment, LanguageCode: 'en' })
    const sentimentCommand = new DetectSentimentCommand({ Text: segment, LanguageCode: 'en' })
    const keyPhrasesCommand = new DetectKeyPhrasesCommand({ Text: segment, LanguageCode: 'en' })

    const [entitiesResponse, sentimentResponse, keyPhrasesResponse] = await Promise.all([
      comprehendClient.send(entitiesCommand),
      comprehendClient.send(sentimentCommand),
      comprehendClient.send(keyPhrasesCommand),
    ])

    const entities = entitiesResponse.Entities
    const sentiment = sentimentResponse.Sentiment
    const keyPhrases = keyPhrasesResponse.KeyPhrases

    const chatGPTResponse = await analyzeWithChatGPT(segment)

    keyMoments.push(
      ...processSegment({ segment, entities, sentiment, keyPhrases, chatGPTResponse }),
    )
  }

  return keyMoments
}

function segmentText(text: string): string[] {
  // Basic segmentation by phrases
  return text.split('.').filter(t => t.trim().length > 0)
}

function isImportantEntity(entity) {
  // Define logic to determine if an entity is considered important
  const importantEntityTypes = ['PERSON', 'ORGANIZATION', 'LOCATION', 'EVENT']
  const importantSpecificEntities = ['John Doe', 'Eiffel Tower']

  return (
    importantEntityTypes.includes(entity.Type) || importantSpecificEntities.includes(entity.Text)
  )
}

function isImportantKeyPhrase(phrase) {
  // Define logic to determine if a key phrase is considered important
  const importantPhrases = [
    'breaking news',
    'exclusive interview',
    'launch event',
    'critical update',
  ]
  return importantPhrases.some(importantPhrase => phrase.toLowerCase().includes(importantPhrase))
}

function isKeyMoment(segmentInfo): boolean {
  // Implement your own logic to identify key moments
  // Basic example: a strong positive or negative feeling indicates a key moment
  const hasStrongSentiment = ['POSITIVE', 'NEGATIVE'].includes(segmentInfo.sentiment)
  const hasImportantEntities = segmentInfo.entities.some(entity => isImportantEntity(entity))
  const hasImportantKeyPhrases = segmentInfo.keyPhrases.some(phrase => isImportantKeyPhrase(phrase))

  return hasStrongSentiment || hasImportantEntities || hasImportantKeyPhrases
}

async function analyzeWithChatGPT(text) {
  try {
    const completion = await await openai.chat.completions.create({
      messages: [{ role: 'user', content: `${chatGPTPrompt}\n\n${text}` }],
      model: conf.openAIConf.model,
      max_tokens: conf.openAIConf.maxTokens,
    })
    return completion.choices[0]?.message?.content
  } catch (error) {
    console.error('Error calling ChatGPT API:', error)
    return ''
  }
}

function processSegment({ segment, entities, sentiment, keyPhrases, chatGPTResponse }): any[] {
  // Associate entities, sentiment, and key phrases with the text segment
  const segmentInfo = {
    segment,
    entities: entities.map(e => e.Text),
    sentiment,
    keyPhrases: keyPhrases.map(kp => kp.Text),
  }
  const chatGPTAnalysis = chatGPTResponse // Add analysis from ChatGPT to your segment info

  // Determine whether this segment is a key moment according to your business logic
  // For example, you may consider a segment to be key if the sentiment is very positive or negative
  // or if certain key entities or phrases are detected
  if (isKeyMoment(segmentInfo) || chatGPTAnalysis.includes('important')) {
    return [{ ...segmentInfo, chatGPTAnalysis }]
  }

  return []
}
