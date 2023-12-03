# 🎬 ClipCrafter AI 🌟

🚀 Elevate Your Content with ClipCrafter AI 🎥 - Unleash creativity and AI power in every clip! 🌟

## Introduction

👋 Welcome to 🎬 ClipCrafter AI 🌟, where cutting-edge technology 💻 meets creativity 🎨 in video editing. Our AI-driven platform 🤖 is designed to revolutionize the way you create and share content. With ClipCrafter AI, transform long videos into captivating, short-form masterpieces 📹 with just a few clicks. Whether you're a content creator 👩‍🎤, marketer 📊, or social media enthusiast 📱, our intuitive tools make it easy to craft viral-worthy clips, perfect for platforms like TikTok, Instagram Reels, and YouTube Shorts.

Unleash the power of AI to detect and highlight the most engaging parts of your videos, ensuring every clip starts with a punch 🥊. Our advanced facial tracking technology 👀 keeps your subjects in sharp focus, while our automated subtitles and captions 🗨️ add a new layer of engagement to your content. With ClipCrafter AI, tedious editing tasks are a thing of the past. Dive into a world where video creation is not only simple but also a delightful experience 🌈. It's time to craft, clip, and captivate with ClipCrafter AI!

<details>
<summary>

## Features

</summary>

1. 🎥 **AI-Driven Video Generation and Editing:**

   - Automatically generate and edit videos for short-form content.
   - Transform long-form videos into engaging short clips for platforms like TikTok, Instagram Reels, and YouTube Shorts.

2. 🔍 **AI-Powered Clip Extraction:**

   - Identify and extract compelling segments or punchlines from longer videos using AI.
   - Continual improvement through an AI feedback loop for better clip selection.

3. 🧔 **Facial Tracking and Center Stage Focus:**

   - Develop precise facial tracking to keep subjects in focus, ideal for content with speakers or influencers.

4. 📝 **Automated Subtitles and Captions:**

   - Offer automated and possibly animated subtitles and captions to enhance accessibility and engagement.

5. 🎧 **Advanced Audio and Video Editing Features:**

   - Features for advanced audio editing and synchronization with video.
   - Easy video trimming, clipping, and editing with an intuitive interface.

6. 💬 **Dynamic Captions and AI-Relayout:**

   - Implement dynamic captions responsive to video content.
   - AI-relayout for optimal viewing on different platforms and devices.

7. 🔄 **Multi-Platform Compatibility and Sharing:**

   - Ensure videos are easily shareable across various social media platforms.
   - Support for multiple formats and aspect ratios.

8. 📝 **Transcription and Repurposing Tools:**

   - Tools for transcribing video content and repurposing it in different formats.

9. 🌟 **High-Quality Exports Without Limitation:**
   - Allow users to export videos in high quality with no limits on the number of exports.

</details>

<details>
<summary>

## Todo List

</summary>

1. **Initial Setup and Development Tools**

   - [x] Set up the Next.js environment for front-end development.
   - [x] Configure TypeScript for Lambda code.
   - [x] Set up ESLint for code analysis.
   - [x] Establish GitHub workflows for code quality checks.

2. **AWS Amplify and Infrastructure**

   - [x] Initial configuration of AWS Amplify for the project.
   - [x] Configure backend resources with Amplify (API, Auth, Storage).
   - [x] Set up automatic multi-region S3 bucket replication to handle the London region for Rekognition.

3. **Lambda Development and S3 Integration**

   - [x] Implement automatic Lambda trigger on S3 file upload.
   - [x] Develop the `download` function in S3 with progress information.
   - [x] Create FFmpeg commands with batch processing for optimization.
   - [x] Utilize `ffmpeg concatList.txt` for video concatenation.
   - [x] Implement `StatusUploader` for managing operation statuses.
   - [x] Configure AWS SAM for running Lambda locally with Docker during development.

4. **Front-End Development**

   - [x] Develop the main application structure (`Main.tsx`, `layout.tsx`, `page.tsx`).
   - [x] Implement global styles (`globals.css`).
   - [x] Develop feature components (`Features.tsx`).
   - [x] Use Amplify UI React library for user interface.

5. **AWS Services Integration**

   - [x] Integrate AWS Rekognition for video analysis.
   - [x] Use `ffmpeg getCmd` with blurred background for video processing.

6. **Specific Feature Development**

   - [ ] Set up AWS Transcribe for automatic transcription.
   - [ ] Use AWS Comprehend to analyze transcribed text.
   - [ ] Transition from Lambda FFmpeg Layer to AWS MediaConvert Jobs.
   - [ ] Embed generated subtitles into the video using AWS MediaConvert.
   - [ ] Design an AWS Step Functions workflow to automate the process.

7. **🎥 AI-Driven Video Generation and Editing**

   - [ ] Develop AI algorithms for automatic video generation and editing.
   - [ ] Create functionality to transform long-form videos into short clips for social media platforms.

8. **🔍 AI-Powered Clip Extraction**

   - [ ] Implement AI techniques for identifying and extracting key segments from longer videos.
   - [ ] Set up an AI feedback loop for improved clip selection.

9. **🧔 Facial Tracking and Center Stage Focus**

   - [ ] Develop facial tracking technology for content focusing on speakers or influencers.

10. **📝 Automated Subtitles and Captions**

    - [ ] Integrate automated and animated subtitles and captions.

11. **🎧 Advanced Audio and Video Editing Features**

    - [ ] Implement advanced audio editing and synchronization features.
    - [ ] Develop an intuitive interface for video trimming, clipping, and editing.

12. **💬 Dynamic Captions and AI-Relayout**

    - [ ] Create dynamic captions responsive to video content.
    - [ ] Implement AI-relayout for optimal viewing on different platforms.

13. **🔄 Multi-Platform Compatibility and Sharing**

    - [ ] Ensure easy sharing of videos across various social media platforms.
    - [ ] Support multiple video formats and aspect ratios.

14. **📝 Transcription and Repurposing Tools**

    - [ ] Develop tools for video content transcription and repurposing.

15. **Testing, Deployment, and Monitoring**

    - [ ] Conduct comprehensive testing of the entire pipeline.
    - [ ] Adjust configurations based on test results for optimal performance.
    - [ ] Deploy the solution in a production environment.
    - [ ] Set up system performance monitoring and alerts.

16. **Improvements and Maintenance**

    - [ ] Implement analytics to measure the effectiveness of video processing.
    - [ ] Continuously improve the system based on user feedback and analytics data.

17. **Ongoing and Upcoming Developments**
    - [ ] (In progress) Integrate Stripe for payments.
    - [ ] (To do) Create documentation for the system and its components.
    - [ ] (To do) Train team members or end-users on how to use the system effectively.

This list includes the tasks necessary to develop the new AI-driven video editing features, ensuring a comprehensive approach to building a versatile and user-friendly video editing platform.

</details>

<details>
<summary>
  
## Lambda TODO

</summary>

1. 📤 **StatusUploader.ts**

   - [x] Implement basic structure of `StatusUploader` class.
   - [ ] Review and optimize error handling in `StatusUploader` class.
   - [ ] Add unit tests for different scenarios (e.g., successful upload, failed upload).
   - [ ] Consider implementing a retry mechanism for failed S3 operations.
   - [ ] Document the class methods for better maintainability.

2. ⚙️ **config.ts**

   - [x] Define basic configuration structure.
   - [ ] Validate configuration values (e.g., check for valid region, thresholds).
   - [ ] Consider using environment variables for sensitive data.
   - [ ] Add comments to explain each configuration option.

3. 📄 **event.json**

   - [x] Create a basic event JSON structure for testing.
   - [ ] Create additional test event JSON files for different scenarios.
   - [ ] Validate the structure of the event in your Lambda function to handle malformed events.

4. 📊 **getData.ts**

   - [x] Extract data from Lambda S3 event.
   - [ ] Implement more robust error handling and logging.
   - [ ] Optimize the data extraction logic for efficiency.
   - [ ] Add comments to clarify the purpose of each step in the data extraction process.

5. 🚀 **index.ts**

   - [x] Set up the main Lambda handler function.
   - [ ] Refactor the handler for better readability and maintainability.
   - [ ] Implement more detailed logging for each step of the process.
   - [ ] Add error handling for each external call (e.g., S3, Rekognition).

6. 📝 **logger.ts**

   - [x] Create a basic logging function.
   - [ ] Extend the logger functionality to support different log levels (e.g., info, warn, error).
   - [ ] Implement a mechanism to toggle logging on/off based on environment variables.

7. 📈 **qlip-crop-model-out.json**

   - [x] Provide a sample output model JSON.
   - [ ] Validate the JSON structure to ensure it meets your application's requirements.
   - [ ] Consider moving model output data to a more secure storage if it contains sensitive information.

8. 👁️ **rekognition.ts**

   - [x] (Assuming) Basic AWS Rekognition integration.
   - [ ] Implement error handling and logging for AWS Rekognition calls.
   - [ ] Optimize Rekognition interactions for performance and cost.
   - [ ] Add unit tests for the Rekognition integration.

9. 🌐 **s3.ts**

   - [x] Implement basic S3 upload and download functions.
   - [ ] Implement more comprehensive error handling for S3 operations.
   - [ ] Optimize file upload/download methods for large files.
   - [ ] Add functionality to handle different S3 event types.

10. ✅ **getData.test.ts**

    - [x] Basic unit tests for `getData` function.
    - [ ] Add more test cases covering edge cases and error scenarios.
    - [ ] Implement mock objects for S3 to test without AWS dependencies.
    - [ ] Review and improve the assertions for better test coverage.

11. 🎥 **video.test.ts**

    - [x] (Assuming) Basic structure for video processing tests.
    - [ ] Write unit tests for video processing logic.
    - [ ] Mock external dependencies (e.g., file system, AWS services) in tests.
    - [ ] Ensure tests cover both successful and failure scenarios.

12. 🧩 **types.ts**, **utils.ts**, **video.ts**
    - [x] Basic types, utility functions, and video processing logic.
    - [ ] For `types.ts`: Document each type/interface for clarity.
    - [ ] For `utils.ts`: Add error handling in utility functions.
    - [ ] For `video.ts`: Optimize video processing functions for performance.
    - [ ] Add unit tests for utility functions and video processing logic.

</details>

<details>
<summary>
  
## AWS Free Tier Info

</summary>

AWS Transcribe : 60 min / monthly
... TODO

</details>

## Contact

For any inquiries or feedback, please contact [Alex Lévy](mailto:alexlevy0@gmail.com).

Thank you for checking out ClipCrafter AI!

<details>
<summary>
  
## Alternatives

</summary>

### Klap.app

- **AI-driven Video Generation:** Creates engaging snippets from videos, potentially viral
- **AI-powered Video Editing:** Automatically generates TikToks, Reels, and Shorts from long-form YouTube content
- **YouTube Link Conversion:** Converts YouTube videos into short-form videos for social platforms

### Qlip.ai

- **Punchline Score:** AI detects compelling punchlines within the video
- **AI Feedback Loop:** Improves highlight recommendations over time
- **AI-Powered Clipping:** Extracts short clips from long videos

### Vizard.ai

- **Transcription and Editing:** Streamlines video content creation and repurposing
- **Automated Video Editing:** Simplifies the video editing process
- **Audio Editing and Sync:** Advanced audio editing features and seamless syncing with visuals

### 2short.ai

- **Captivating Facial Tracking:** Keeps the subject at the center with facial tracking
- **Effortless Animated Subtitles:** Adds animated subtitles to videos
- **Automated Clip Generation:** Extracts engaging segments from longer videos

### Opus.pro

- **Generative AI for Video Repurposing:** Converts long videos into shorts
- **Dynamic Captions and AI-Relayout:** Offers features like dynamic captions for enhanced viewer engagement
- **Multi-Platform Streaming:** Facilitates streaming to various platforms with custom branding and audience participation

</details>

## License

This project is licensed under the [MIT License](LINK_TO_LICENSE).
