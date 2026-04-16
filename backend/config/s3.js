import { S3Client } from "@aws-sdk/client-s3";

let s3Instance = null;

export function getS3Client() {
  if (s3Instance) return s3Instance;

  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
  let secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
  const region = process.env.AWS_REGION?.trim();

  if (secretAccessKey && (secretAccessKey.startsWith('"') || secretAccessKey.startsWith("'"))) {
    secretAccessKey = secretAccessKey.slice(1, -1);
  }

  if (!accessKeyId || !secretAccessKey || !region) {
    throw new Error(
      `Missing AWS credentials: ${[
        !accessKeyId && "AWS_ACCESS_KEY_ID",
        !secretAccessKey && "AWS_SECRET_ACCESS_KEY",
        !region && "AWS_REGION",
      ]
        .filter(Boolean)
        .join(", ")}`
    );
  }

  s3Instance = new S3Client({
    region: region,
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
    },
    requestHandler: {
      connectionTimeout: 30000,
      socketTimeout: 30000,
    },
    maxAttempts: 3,
  });

  return s3Instance;
}

export default getS3Client;