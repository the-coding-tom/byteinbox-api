import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { config } from '../config/config';

const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId!,
    secretAccessKey: config.aws.secretAccessKey!,
  },
});

export async function uploadToS3(params: {
  bucket: string;
  key: string;
  body: Buffer;
  contentType: string;
}): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: params.bucket,
    Key: params.key,
    Body: params.body,
    ContentType: params.contentType,
  });

  await s3Client.send(command);

  return `https://${params.bucket}.s3.${config.aws.region}.amazonaws.com/${params.key}`;
}
