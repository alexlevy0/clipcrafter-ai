import React from 'react'
import { Text, Flex, Heading, Divider, ScrollView } from '@aws-amplify/ui-react'

const Txt = ({ children }: { children: React.ReactNode }) => {
  return (
    <Text
      variation="primary"
      as="p"
      lineHeight="1.5em"
      fontWeight={400}
      fontSize="1em"
      fontStyle="normal"
      textDecoration="none"
    >
      {children}
    </Text>
  )
}

export const Features = () => {
  return (
    <ScrollView
      // height="80%"
      height="75vh"
      width="100%"
      flex={0}
      // overflow="auto"
    >
      <Flex
        // alignSelf="center"
        // overflow="auto"
        direction="column"
        flex={0}
      >
        <Heading level={6}>1. 🎥 **AI-Driven Video Generation and Editing:**</Heading>
        <Txt>- Automatically generate and edit videos for short-form content.</Txt>
        <Txt>
          - Transform long-form videos into engaging short clips for platforms like TikTok,
          Instagram Reels, and YouTube Shorts.
        </Txt>
        <Divider orientation="horizontal" />
        <Heading level={6}>2. 🔍 **AI-Powered Clip Extraction:**</Heading>

        <Txt>
          - Identify and extract compelling segments or punchlines from longer videos using AI.
        </Txt>
        <Txt>- Continual improvement through an AI feedback loop for better clip selection.</Txt>
        <Divider orientation="horizontal" />
        <Heading level={6}>3. 🧔 **Facial Tracking and Center Stage Focus:**</Heading>

        <Txt>
          - Develop precise facial tracking to keep subjects in focus, ideal for content with
          speakers or influencers.
        </Txt>
        <Divider orientation="horizontal" />
        <Heading level={6}>4. 📝 **Automated Subtitles and Captions:**</Heading>

        <Txt>
          - Offer automated and possibly animated subtitles and captions to enhance accessibility
          and engagement.
        </Txt>
        <Divider orientation="horizontal" />
        <Heading level={6}>5. 🎧 **Advanced Audio and Video Editing Features:**</Heading>

        <Txt>- Features for advanced audio editing and synchronization with video.</Txt>
        <Txt>- Easy video trimming, clipping, and editing with an intuitive interface.</Txt>
        <Divider orientation="horizontal" />
        <Heading level={6}>6. 💬 **Dynamic Captions and AI-Relayout:**</Heading>

        <Txt>- Implement dynamic captions responsive to video content.</Txt>
        <Txt>- AI-relayout for optimal viewing on different platforms and devices.</Txt>
        <Divider orientation="horizontal" />
        <Heading level={6}>7. 🔄 **Multi-Platform Compatibility and Sharing:**</Heading>

        <Txt>- Ensure videos are easily shareable across various social media platforms.</Txt>
        <Txt>- Support for multiple formats and aspect ratios.</Txt>
        <Divider orientation="horizontal" />
        <Heading level={6}>8. 📝 **Transcription and Repurposing Tools:**</Heading>

        <Txt>- Tools for transcribing video content and repurposing it in different formats.</Txt>
        <Divider orientation="horizontal" />
        <Heading level={6}>9. 🌟 **High-Quality Exports Without Limitation:**</Heading>
        <Txt>
          - Allow users to export videos in high quality with no limits on the number of exports.
        </Txt>
      </Flex>
    </ScrollView>
  )
}
