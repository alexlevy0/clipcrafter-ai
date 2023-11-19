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
// import * as AWS from "aws-sdk";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
// import { S3 } from "@aws-sdk/client-s3";
import * as ClientS3 from "@aws-sdk/client-s3";
import { Readable } from "stream";
var execPromise = promisify(exec);
var awsConfig = {
    region: "eu-west-3",
    functionName: "MyLambdaFunction",
    namespace: "qlip-space",
};
var s3 = new ClientS3.S3(awsConfig);
// const cloudwatch = new AWS.CloudWatch(awsConfig);
function downloadObject(bucketName, objectKey, filePath) {
    return __awaiter(this, void 0, void 0, function () {
        var startTime, _a, Body_1, ContentLength, duration, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    startTime = Date.now();
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 10, , 13]);
                    return [4 /*yield*/, publishMetric("Downloading '".concat(objectKey, "' from bucket '").concat(bucketName, "'"), 1)];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, s3.getObject({
                            Bucket: bucketName,
                            Key: objectKey,
                        })];
                case 3:
                    _a = _b.sent(), Body_1 = _a.Body, ContentLength = _a.ContentLength;
                    if (!(Body_1 instanceof Readable)) return [3 /*break*/, 5];
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            var writeStream = fsSync.createWriteStream(filePath);
                            Body_1.pipe(writeStream);
                            Body_1.on("error", reject);
                            writeStream.on("finish", resolve);
                        })];
                case 4:
                    _b.sent();
                    return [3 /*break*/, 6];
                case 5: throw new Error("Received data is not a stream");
                case 6:
                    duration = Date.now() - startTime;
                    if (!(ContentLength !== undefined)) return [3 /*break*/, 8];
                    return [4 /*yield*/, publishMetric("FileSize", ContentLength)];
                case 7:
                    _b.sent();
                    _b.label = 8;
                case 8: return [4 /*yield*/, publishMetric("DownloadDuration", duration)];
                case 9:
                    _b.sent();
                    return [3 /*break*/, 13];
                case 10:
                    error_1 = _b.sent();
                    if (!(error_1 instanceof Error)) return [3 /*break*/, 12];
                    return [4 /*yield*/, publishMetric("DownloadError : Error downloading object: ".concat(error_1.message), 1, true)];
                case 11:
                    _b.sent();
                    _b.label = 12;
                case 12: throw error_1;
                case 13: return [2 /*return*/];
            }
        });
    });
}
function getFrameRate(filePath) {
    return __awaiter(this, void 0, void 0, function () {
        var ffprobeCommand, stdout, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 7]);
                    return [4 /*yield*/, isValidPath(filePath)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, publishMetric("Extracting frame rate for '".concat(filePath, "'"), 1)];
                case 2:
                    _a.sent();
                    ffprobeCommand = "ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of default=noprint_wrappers=1:nokey=1 \"".concat(filePath, "\"");
                    return [4 /*yield*/, execPromise(ffprobeCommand)];
                case 3:
                    stdout = (_a.sent()).stdout;
                    return [2 /*return*/, stdout.trim()];
                case 4:
                    error_2 = _a.sent();
                    if (!(error_2 instanceof Error)) return [3 /*break*/, 6];
                    return [4 /*yield*/, publishMetric("FrameRateExtractionError : Error extracting frame rate: ".concat(error_2.message), 1, true)];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6: throw error_2;
                case 7: return [2 /*return*/];
            }
        });
    });
}
function isValidPath(filePath) {
    return __awaiter(this, void 0, void 0, function () {
        var error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!path.isAbsolute(filePath)) {
                        throw new Error("File path isnt absolute");
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fs.readFile(filePath)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, true];
                case 3:
                    error_3 = _a.sent();
                    throw new Error("Invalid file path ".concat(error_3.message));
                case 4: return [2 /*return*/];
            }
        });
    });
}
function publishMetric(metricName, value, isError) {
    if (isError === void 0) { isError = false; }
    return __awaiter(this, void 0, void 0, function () {
        var params, log;
        return __generator(this, function (_a) {
            try {
                params = {
                    MetricData: [
                        {
                            MetricName: metricName,
                            Dimensions: [
                                {
                                    Name: "FunctionName",
                                    Value: awsConfig.functionName,
                                },
                            ],
                            Timestamp: new Date(),
                            Unit: "Count",
                            Value: value,
                        },
                    ],
                    Namespace: awsConfig.namespace,
                };
                log = JSON.stringify(params, null, 2);
                if (isError) {
                    console.error(log);
                }
                else
                    console.log(log);
                // await cloudwatch.putMetricData(params).promise();
            }
            catch (error) {
                console.error("Error publishing metric: ".concat(error.message));
            }
            return [2 /*return*/];
        });
    });
}
function validateInput(input) {
    var oK = input.objectKey, bN = input.bucketName;
    if (!oK || !bN) {
        throw new Error("Invalid input");
    }
    return { bucketName: bN, objectKey: oK };
}
function calculateFrameRate(frameRateString) {
    var parts = frameRateString.split("/");
    if (parts.length !== 2) {
        throw new Error("Invalid frame rate format");
    }
    var numerator = parseInt(parts[0], 10);
    var denominator = parseInt(parts[1], 10);
    if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
        throw new Error("Invalid frame rate numbers");
    }
    return numerator / denominator;
}
export var handler = function (event, context) { return __awaiter(void 0, void 0, void 0, function () {
    var bucket, key, inputBucketKey, tmpFilePath, _a, bucketName, objectKey, fileName, frameRate, calculatedFrameRate, error_4, err_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!(!event || !event.Records)) return [3 /*break*/, 2];
                return [4 /*yield*/, publishMetric("InputValidationError : Missing Records in event", 1, true)];
            case 1:
                _b.sent();
                return [2 /*return*/, {
                        statusCode: 400,
                        body: JSON.stringify({ error: "Records is required in event" }),
                    }];
            case 2:
                bucket = event.Records[0].s3.bucket.name;
                key = event.Records[0].s3.object.key;
                inputBucketKey = {
                    bucketName: bucket,
                    objectKey: key,
                };
                _b.label = 3;
            case 3:
                _b.trys.push([3, 8, 10, 17]);
                _a = validateInput(inputBucketKey), bucketName = _a.bucketName, objectKey = _a.objectKey;
                fileName = objectKey.split("/").pop();
                if (!fileName)
                    throw new Error("Failed to extract file name from objectKey");
                tmpFilePath = "/tmp/".concat(fileName);
                return [4 /*yield*/, downloadObject(bucketName, objectKey, tmpFilePath)];
            case 4:
                _b.sent();
                return [4 /*yield*/, fs.access(tmpFilePath, fs.constants.R_OK | fs.constants.W_OK)];
            case 5:
                _b.sent();
                return [4 /*yield*/, getFrameRate(tmpFilePath)];
            case 6:
                frameRate = _b.sent();
                calculatedFrameRate = calculateFrameRate(frameRate);
                return [4 /*yield*/, publishMetric("FrameRateExtracted : Frame rate: ".concat(calculatedFrameRate), 1)];
            case 7:
                _b.sent();
                return [2 /*return*/, {
                        statusCode: 200,
                        body: JSON.stringify({ frameRate: calculatedFrameRate }),
                    }];
            case 8:
                error_4 = _b.sent();
                return [4 /*yield*/, publishMetric("HandlerError : Error in handler: ".concat(error_4.message), 1, true)];
            case 9:
                _b.sent();
                return [2 /*return*/, { statusCode: 500, body: JSON.stringify({ error: error_4.message }) }];
            case 10:
                if (!tmpFilePath) return [3 /*break*/, 16];
                return [4 /*yield*/, publishMetric("Cleaning up temporary files", 1)];
            case 11:
                _b.sent();
                _b.label = 12;
            case 12:
                _b.trys.push([12, 14, , 16]);
                return [4 /*yield*/, fs.unlink(tmpFilePath)];
            case 13:
                _b.sent();
                return [3 /*break*/, 16];
            case 14:
                err_1 = _b.sent();
                return [4 /*yield*/, publishMetric("FileCleanupError : Error deleting tmp file: ".concat(err_1.message), 1, true)];
            case 15:
                _b.sent();
                return [3 /*break*/, 16];
            case 16: return [7 /*endfinally*/];
            case 17: return [2 /*return*/];
        }
    });
}); };
