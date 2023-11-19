import cropData from "./qlip-crop-model-out.json" assert { type: "json" };
var repairedCropData = cropData;
export function convertInputClippings(frameRate) {
    var output = [];
    for (var _i = 0, _a = repairedCropData.shots; _i < _a.length; _i++) {
        var clip = _a[_i];
        var start = secondsToTimestamp(clip.ts_start, frameRate);
        var end = secondsToTimestamp(clip.ts_end, frameRate);
        output.push({ StartTimecode: start, EndTimecode: end });
    }
    return output;
}
function secondsToTimestamp(totalSeconds, frameRate) {
    if (frameRate === void 0) { frameRate = 25; }
    var hours = Math.floor(totalSeconds / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = Math.floor(totalSeconds % 60);
    var frames = Math.floor((totalSeconds % 1) * frameRate);
    var formattedTimestamp = "".concat(padToTwo(hours), ":").concat(padToTwo(minutes), ":").concat(padToTwo(seconds), ":").concat(padToTwo(frames));
    return formattedTimestamp;
}
function padToTwo(number) {
    return number.toString().padStart(2, "0");
}
