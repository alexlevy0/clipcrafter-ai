"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const video_1 = require("./video");
const s3_1 = require("./s3");
const getData_1 = require("./getData");
const StatusUploader_1 = require("./StatusUploader");
const types_1 = require("./types");
const utils_1 = require("./utils");
const rekognition_1 = require("./rekognition");
const transcribe_1 = require("./transcribe");
const comprehend_1 = require("./comprehend");
const s3_2 = require("./s3");
const handler = async (event) => {
    const statusUploader = StatusUploader_1.default.getInstance();
    try {
        await statusUploader.setStatus(types_1.EStatus.Init);
        const { tmpPath, outputPath, newKey, key, bucket } = await (0, getData_1.getData)(event);
        await Promise.all([(0, s3_1.download)(bucket, key, tmpPath), (0, s3_2.waitForS3Replication)(bucket, key)]);
        const [{ transcript }, analyzedShots] = await Promise.all([
            (0, transcribe_1.getTranscript)(bucket, key),
            (0, rekognition_1.analyzeVideo)(key, bucket),
        ]);
        console.log({ transcript });
        await (0, comprehend_1.getKeyMoments)(transcript);
        await (0, video_1.processVideo)(tmpPath, outputPath, analyzedShots);
        await (0, s3_1.upload)(outputPath, bucket, newKey);
        await (0, utils_1.cleanTempFiles)(tmpPath, outputPath);
        await statusUploader.setStatus(types_1.EStatus.Succeded);
        return { statusCode: 200 };
    }
    catch (error) {
        await statusUploader.setStatus(types_1.EStatus.Error);
        console.error('Handler error:', error);
        return { statusCode: 500, error };
    }
};
exports.handler = handler;
