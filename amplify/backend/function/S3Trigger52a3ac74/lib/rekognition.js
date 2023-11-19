var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { RekognitionClient, StartFaceDetectionCommand, GetFaceDetectionCommand, } from "@aws-sdk/client-rekognition";
import { CloudWatchClient, PutMetricDataCommand, } from "@aws-sdk/client-cloudwatch";
import { CloudWatchLogsClient, PutLogEventsCommand, DescribeLogStreamsCommand, } from "@aws-sdk/client-cloudwatch-logs";
import { fromIni } from "@aws-sdk/credential-provider-ini";
var delay = function (ms) { return new Promise(function (resolve) { return setTimeout(resolve, ms); }); };
var config = {
    videoUri: 'TODO',
    awsProfile: "AddProfilAWS",
    awsRegion: "eu-west-4",
    videoWidth: 1920,
    videoHeight: 1080,
    cloudWatchLogGroupName: "LogGroup",
    cloudWatchLogStreamName: "LogStream",
    highConfidenceThreshold: 90.0,
    paddingFactorBase: 0.25,
    significantMovementThreshold: 0.1,
    jobCheckDelay: 5000,
};
function waitForJobCompletion(client, jobId) {
    return __awaiter(this, void 0, void 0, function () {
        var jobStatus, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    jobStatus = "IN_PROGRESS";
                    _a.label = 1;
                case 1:
                    if (!(jobStatus === "IN_PROGRESS")) return [3 /*break*/, 4];
                    return [4 /*yield*/, client.send(new GetFaceDetectionCommand({ JobId: jobId }))];
                case 2:
                    response = _a.sent();
                    jobStatus = response.JobStatus || "FAILED";
                    if (jobStatus === "SUCCEEDED") {
                        return [2 /*return*/, response];
                    }
                    else if (jobStatus === "FAILED") {
                        throw new Error("Job failed");
                    }
                    return [4 /*yield*/, delay(config.jobCheckDelay)];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 1];
                case 4: throw new Error("Job did not complete successfully");
            }
        });
    });
}
var lastFacePosition = null;
function calculateCropCoordinates(box, videoWidth, videoHeight, lastFacePosition) {
    var paddingFactor = config.paddingFactorBase;
    if (lastFacePosition) {
        var movementX = Math.abs(box.Left - lastFacePosition.Left);
        var movementY = Math.abs(box.Top - lastFacePosition.Top);
        if (movementX > config.significantMovementThreshold ||
            movementY > config.significantMovementThreshold) {
            paddingFactor = paddingFactor + 0.1;
        }
    }
    lastFacePosition = box;
    var faceWidth = box.Width * videoWidth;
    var faceHeight = box.Height * videoHeight;
    var faceCenterX = box.Left * videoWidth + faceWidth / 2;
    var faceCenterY = box.Top * videoHeight + faceHeight / 2;
    var cropWidth = Math.min(faceWidth * (1 + paddingFactor), videoWidth);
    var cropHeight = Math.min(faceHeight * (1 + paddingFactor), videoHeight);
    var x = Math.max(faceCenterX - cropWidth / 2, 0);
    var y = Math.max(faceCenterY - cropHeight / 2, 0);
    if (x + cropWidth > videoWidth) {
        x = videoWidth - cropWidth;
    }
    if (y + cropHeight > videoHeight) {
        y = videoHeight - cropHeight;
    }
    return {
        x: Math.round(x),
        y: Math.round(y),
        w: Math.round(cropWidth),
        h: Math.round(cropHeight),
    };
}
function isSignificantEmotionChange(prevEmotions, newEmotions, highConfidenceThreshold) {
    if (highConfidenceThreshold === void 0) { highConfidenceThreshold = config.highConfidenceThreshold; }
    if (!prevEmotions ||
        !newEmotions ||
        prevEmotions.length === 0 ||
        newEmotions.length === 0) {
        return false;
    }
    var prevPrimaryEmotion = prevEmotions.reduce(function (prev, current) { return (prev.Confidence > current.Confidence ? prev : current); }, prevEmotions[0]);
    var newPrimaryEmotion = newEmotions.reduce(function (prev, current) { return (prev.Confidence > current.Confidence ? prev : current); }, newEmotions[0]);
    var isPrevEmotionHighConfidence = prevPrimaryEmotion.Confidence >= highConfidenceThreshold;
    var isNewEmotionHighConfidence = newPrimaryEmotion.Confidence >= highConfidenceThreshold;
    return (isPrevEmotionHighConfidence &&
        isNewEmotionHighConfidence &&
        prevPrimaryEmotion.Type !== newPrimaryEmotion.Type);
}
function analyzeVideo(videoUri, videoWidth, videoHeight, cloudWatchClient) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var client, startCommand, startResponse, getResponse, shots, currentShot, lastFacePosition, prevEmotions, metricData;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    client = new RekognitionClient({
                        credentials: fromIni({ profile: config.awsProfile }),
                        region: config.awsRegion,
                    });
                    startCommand = new StartFaceDetectionCommand({
                        Video: {
                            S3Object: {
                                Bucket: "nom-de-votre-bucket",
                                Name: videoUri,
                            },
                        },
                        FaceAttributes: "ALL",
                    });
                    return [4 /*yield*/, client.send(startCommand)];
                case 1:
                    startResponse = _b.sent();
                    if (!startResponse.JobId) {
                        throw new Error("Échec de démarrage de l'analyse de la vidéo");
                    }
                    return [4 /*yield*/, waitForJobCompletion(client, startResponse.JobId)];
                case 2:
                    getResponse = _b.sent();
                    shots = [];
                    currentShot = null;
                    lastFacePosition = null;
                    prevEmotions = [];
                    (_a = getResponse.Faces) === null || _a === void 0 ? void 0 : _a.forEach(function (faceDetection) {
                        var _a, _b, _c;
                        var face = faceDetection.Face;
                        var timestamp = faceDetection.Timestamp;
                        if (face) {
                            var crop = calculateCropCoordinates(face.BoundingBox, videoWidth, videoHeight, lastFacePosition);
                            if (((_a = face.MouthOpen) === null || _a === void 0 ? void 0 : _a.Value) || ((_b = face.Smile) === null || _b === void 0 ? void 0 : _b.Value)) {
                                if (!currentShot) {
                                    currentShot = {
                                        ts_start: timestamp,
                                        ts_end: timestamp,
                                        crop: crop,
                                        label: "Speaking/Smiling",
                                    };
                                }
                                else {
                                    currentShot.ts_end = timestamp;
                                }
                            }
                            else if (isSignificantEmotionChange(prevEmotions, face.Emotions)) {
                                if (currentShot) {
                                    shots.push(currentShot);
                                }
                                currentShot = {
                                    ts_start: timestamp,
                                    ts_end: timestamp,
                                    crop: crop,
                                    label: "Emotion Change",
                                };
                            }
                            prevEmotions = face.Emotions;
                            lastFacePosition = face.BoundingBox;
                        }
                        if (!((_c = face.MouthOpen) === null || _c === void 0 ? void 0 : _c.Value) && currentShot) {
                            shots.push(currentShot);
                            currentShot = null;
                        }
                    });
                    if (currentShot) {
                        shots.push(currentShot);
                    }
                    metricData = {
                        MetricData: [
                            {
                                MetricName: "VideoAnalysisShots",
                                Dimensions: [{ Name: "VideoUri", Value: videoUri }],
                                Unit: "Count",
                                Value: shots.length,
                            },
                        ],
                        Namespace: "VideoAnalysis",
                    };
                    // @ts-ignore
                    return [4 /*yield*/, cloudWatchClient.send(new PutMetricDataCommand(metricData))];
                case 3:
                    // @ts-ignore
                    _b.sent();
                    return [2 /*return*/, shots];
            }
        });
    });
}
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var cloudWatchLogsClient, cloudWatchClient, shots, error_1, describeLogStreamsResponse, logStream, sequenceToken, logEvents, logError_1;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                cloudWatchLogsClient = new CloudWatchLogsClient({
                    region: config.awsRegion,
                });
                cloudWatchClient = new CloudWatchClient({ region: config.awsRegion });
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 9]);
                return [4 /*yield*/, analyzeVideo(config.videoUri, config.videoWidth, config.videoHeight, cloudWatchClient)];
            case 2:
                shots = _b.sent();
                console.log("Shots:", shots);
                return [3 /*break*/, 9];
            case 3:
                error_1 = _b.sent();
                console.error("Erreur:", error_1);
                _b.label = 4;
            case 4:
                _b.trys.push([4, 7, , 8]);
                return [4 /*yield*/, cloudWatchLogsClient.send(new DescribeLogStreamsCommand({
                        logGroupName: config.cloudWatchLogGroupName,
                        logStreamNamePrefix: config.cloudWatchLogStreamName,
                    }))];
            case 5:
                describeLogStreamsResponse = _b.sent();
                logStream = (_a = describeLogStreamsResponse.logStreams) === null || _a === void 0 ? void 0 : _a.find(function (stream) { return stream.logStreamName === config.cloudWatchLogStreamName; });
                sequenceToken = logStream === null || logStream === void 0 ? void 0 : logStream.uploadSequenceToken;
                logEvents = [
                    {
                        message: JSON.stringify({ error: error_1.message, stack: error_1.stack }),
                        timestamp: new Date().getTime(),
                    },
                ];
                return [4 /*yield*/, cloudWatchLogsClient.send(new PutLogEventsCommand({
                        logGroupName: config.cloudWatchLogGroupName,
                        logStreamName: config.cloudWatchLogStreamName,
                        logEvents: logEvents,
                        sequenceToken: sequenceToken,
                    }))];
            case 6:
                _b.sent();
                return [3 /*break*/, 8];
            case 7:
                logError_1 = _b.sent();
                console.error("Erreur lors de l'enregistrement des logs:", logError_1);
                return [3 /*break*/, 8];
            case 8: return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); })();
