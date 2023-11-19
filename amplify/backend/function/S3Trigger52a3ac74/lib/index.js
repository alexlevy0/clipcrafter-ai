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
import * as AWS from "aws-sdk";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
var execPromise = promisify(exec);
// Configuration modulable pour AWS
var awsConfig = {
    region: "eu-west-3",
    functionName: "MyLambdaFunction", // Remplacez par le nom de votre fonction Lambda
};
var s3 = new AWS.S3(awsConfig);
var cloudwatch = new AWS.CloudWatch(awsConfig);
function downloadObject(bucketName, objectKey, filePath) {
    return __awaiter(this, void 0, void 0, function () {
        var startTime, objectData, fileSize, duration, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    startTime = Date.now();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 7, , 10]);
                    console.log("->fs", fs);
                    console.log("->fs.writeFile", fs.writeFile);
                    console.log("Downloading '".concat(objectKey, "' from bucket '").concat(bucketName, "'"));
                    return [4 /*yield*/, s3
                            .getObject({ Bucket: bucketName, Key: objectKey })
                            .promise()];
                case 2:
                    objectData = _a.sent();
                    return [4 /*yield*/, fs.writeFile(filePath, objectData.Body)];
                case 3:
                    _a.sent();
                    fileSize = objectData.ContentLength;
                    duration = Date.now() - startTime;
                    if (!(fileSize !== undefined)) return [3 /*break*/, 5];
                    return [4 /*yield*/, publishMetric("FileSize", fileSize)];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5: return [4 /*yield*/, publishMetric("DownloadDuration", duration)];
                case 6:
                    _a.sent();
                    return [3 /*break*/, 10];
                case 7:
                    error_1 = _a.sent();
                    if (!(error_1 instanceof Error)) return [3 /*break*/, 9];
                    console.error("Error downloading object: ".concat(error_1.message));
                    return [4 /*yield*/, publishMetric("DownloadError", 1)];
                case 8:
                    _a.sent();
                    _a.label = 9;
                case 9: throw error_1;
                case 10: return [2 /*return*/];
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
                    if (!isValidPath(filePath)) {
                        throw new Error("Invalid file path");
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 6]);
                    console.log("Extracting frame rate for '".concat(filePath, "'"));
                    ffprobeCommand = "ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of default=noprint_wrappers=1:nokey=1 \"".concat(filePath, "\"");
                    return [4 /*yield*/, execPromise(ffprobeCommand)];
                case 2:
                    stdout = (_a.sent()).stdout;
                    return [2 /*return*/, stdout.trim()];
                case 3:
                    error_2 = _a.sent();
                    if (!(error_2 instanceof Error)) return [3 /*break*/, 5];
                    console.error("Error extracting frame rate: ".concat(error_2.message));
                    return [4 /*yield*/, publishMetric("FrameRateExtractionError", 1)];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5: throw error_2;
                case 6: return [2 /*return*/];
            }
        });
    });
}
function isValidPath(filePath) {
    // @ts-ignore
    return path.isAbsolute(filePath) && fs.existsSync(filePath);
}
function publishMetric(name, value) {
    return __awaiter(this, void 0, void 0, function () {
        var params, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    params = {
                        MetricData: [
                            {
                                MetricName: name,
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
                        Namespace: "MyApplication",
                    };
                    return [4 /*yield*/, cloudwatch.putMetricData(params).promise()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_3 = _a.sent();
                    console.error("Error publishing metric: ".concat(error_3.message));
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
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
export var handler = function (event, context) { return __awaiter(void 0, void 0, void 0, function () {
    var bucket, key, inputBucketKey, tmpFilePath, _a, bucketName, objectKey, fileName, frameRate, error_4, err_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!(!event || !event.Records)) return [3 /*break*/, 2];
                console.error("Missing Records in event");
                return [4 /*yield*/, publishMetric("InputValidationError", 1)];
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
                _b.trys.push([3, 8, 10, 16]);
                _a = validateInput(inputBucketKey), bucketName = _a.bucketName, objectKey = _a.objectKey;
                console.log({ bucketName: bucketName, objectKey: objectKey });
                fileName = objectKey.split("/").pop();
                console.log({ fileName: fileName });
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
                console.log("Frame rate: ".concat(frameRate));
                return [4 /*yield*/, publishMetric("FrameRateExtracted", 1)];
            case 7:
                _b.sent();
                return [2 /*return*/, { statusCode: 200, body: JSON.stringify({ frameRate: frameRate }) }];
            case 8:
                error_4 = _b.sent();
                console.error("Error in handler: ".concat(error_4.message));
                return [4 /*yield*/, publishMetric("HandlerError", 1)];
            case 9:
                _b.sent();
                return [2 /*return*/, { statusCode: 500, body: JSON.stringify({ error: error_4.message }) }];
            case 10:
                if (!tmpFilePath) return [3 /*break*/, 15];
                console.log("Cleaning up temporary files");
                _b.label = 11;
            case 11:
                _b.trys.push([11, 13, , 15]);
                return [4 /*yield*/, fs.unlink(tmpFilePath)];
            case 12:
                _b.sent();
                return [3 /*break*/, 15];
            case 13:
                err_1 = _b.sent();
                console.error("Error deleting tmp file: ".concat(err_1.message));
                return [4 /*yield*/, publishMetric("FileCleanupError", 1)];
            case 14:
                _b.sent();
                return [3 /*break*/, 15];
            case 15: return [7 /*endfinally*/];
            case 16: return [2 /*return*/];
        }
    });
}); };
