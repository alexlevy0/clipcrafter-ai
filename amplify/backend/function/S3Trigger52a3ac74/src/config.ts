const JOB_QUEUE_ARN = `arn:aws:mediaconvert:eu-west-3:327852390890:queues/Default`;

// const IAM_ROLE_ARN = `arn:aws:iam::327852390890:role/service-role/MediaConvert_Default_Role`;
// const IAM_ROLE_ARN = `arn:aws:iam::327852390890:role/eu-west-3_9vRaOgMOT_Full-access`;
// const IAM_ROLE_ARN = `arn:aws:iam::327852390890:role/role_name_lambda_compute_frame_rate`;
const IAM_ROLE_ARN = `arn:aws:iam::327852390890:user/alex:role/role_name_lambda_compute_frame_rate`;

const OUTPUT_BUCKET_NAME = `s3://qlip-destination/`;
const OUTPUT_BUCKET_NAME_META = `s3://qlip-destination/metadata/`;
const INPUT_BUCKET_KEY = `qlip-source/5_YOUTUBERS_para_MEJORAR_tu_ESPANOL___Mis_favoritos-(1080p).mp4`;
const INPUT_BUCKET_AND_FILENAME = `s3://qlip-source/5_YOUTUBERS_para_MEJORAR_tu_ESPANOL___Mis_favoritos-(1080p).mp4`;
const ENDPOINT_UNIQUE_STRING: string = `xpxxifqxa`;
const LAMBDA_FRAME_RATE_ARN: string = `arn:aws:iam::327852390890:role/service-role/qlip-converter-function-role-btpi8eee`;
// const LAMBDA_FRAME_RATE_ARN: string = `arn:aws:iam::327852390890:user/alex:lambda:eu-west-3:327852390890:layer:ffmpeg:1`;

export const config = {
  region: "eu-west-3",
  // ffmpegLayerArn: ["arn:aws:lambda:eu-west-3:175033217214:layer:ffmpeg:21"],
  ffmpegLayerArn: ["arn:aws:lambda:eu-west-3:327852390890:layer:ffmpeg:1"],
  jobQueueArn: JOB_QUEUE_ARN,
  iamRoleArn: IAM_ROLE_ARN,
  outputBucketName: OUTPUT_BUCKET_NAME,
  outputBucketNameMeta: OUTPUT_BUCKET_NAME_META,
  inputBucketAndFilename: INPUT_BUCKET_AND_FILENAME,
  inputBucketKey: INPUT_BUCKET_KEY,
  endpointUniqueString: ENDPOINT_UNIQUE_STRING,
  lambdaFrameRateArn: LAMBDA_FRAME_RATE_ARN,
  lambdaFrameRateName: "computeFrameRateLambda6",
};
