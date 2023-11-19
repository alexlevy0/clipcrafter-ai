// import cropData from "../lib/qlip-crop-model-out.json" assert { type: "json" };

// interface SourceModel {
//   ts_start: number;
//   ts_end: number;
//   crop?: { x: number; y: number; w: number; h: number };
//   label?: any;
// }

// interface MainSourceModel {
//   video_key: string;
//   shots: [SourceModel];
// }

// interface OutputModel {
//   StartTimecode: string;
//   EndTimecode: string;
// }

// const repairedCropData: MainSourceModel = cropData as MainSourceModel;

// export function convertInputClippings(frameRate): OutputModel[] {
//   const output: OutputModel[] = [];
//   for (const clip of repairedCropData.shots) {
//     const start = secondsToTimestamp(clip.ts_start, frameRate);
//     const end = secondsToTimestamp(clip.ts_end, frameRate);
//     output.push({ StartTimecode: start, EndTimecode: end });
//   }
//   return output;
// }

// function secondsToTimestamp(totalSeconds, frameRate = 25) {
//   const hours = Math.floor(totalSeconds / 3600);
//   const minutes = Math.floor((totalSeconds % 3600) / 60);
//   const seconds = Math.floor(totalSeconds % 60);
//   const frames = Math.floor((totalSeconds % 1) * frameRate);
//   const formattedTimestamp = `${padToTwo(hours)}:${padToTwo(
//     minutes
//   )}:${padToTwo(seconds)}:${padToTwo(frames)}`;
//   return formattedTimestamp;
// }

// function padToTwo(number) {
//   return number.toString().padStart(2, "0");
// }
