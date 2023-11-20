import * as fs from "fs";

interface SourceModel {
  ts_start: number;
  ts_end: number;
  crop?: { x: number; y: number; w: number; h: number };
  label?: any;
}

interface MainSourceModel {
  video_key: string;
  shots: [SourceModel];
}

interface OutputModel {
  StartTimecode: string;
  EndTimecode: string;
}

const cropData = JSON.parse(
  fs.readFileSync("qlip-crop-model-out.json", "utf-8")
);

const typedCropData: MainSourceModel = cropData as MainSourceModel;

const testTypedCropData = {
  ...typedCropData,
  shots: typedCropData.shots.slice(0, 2),
};

export function convertInputClippings(frameRate): OutputModel[] {
  const output: OutputModel[] = [];
  for (const clip of testTypedCropData.shots) {
    const start = secondsToTimestamp(clip.ts_start, frameRate);
    const end = secondsToTimestamp(clip.ts_end, frameRate);
    output.push({ StartTimecode: start, EndTimecode: end });
  }
  return output;
}

function secondsToTimestamp(totalSeconds, frameRate = 25) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const frames = Math.floor((totalSeconds % 1) * frameRate);
  const formattedTimestamp = `${padToTwo(hours)}:${padToTwo(
    minutes
  )}:${padToTwo(seconds)}:${padToTwo(frames)}`;
  return formattedTimestamp;
}

function padToTwo(number) {
  return number.toString().padStart(2, "0");
}
