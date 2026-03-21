"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadScreenshot = exports.toPublicAssetUrl = exports.getS3Client = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const screenshot_model_1 = __importDefault(require("./screenshot.model"));
const config_1 = __importDefault(require("@src/config/config"));
// import config from '../../config/config'; // Config doesn't have AWS keys in types, using process.env directly akin to user snippet
const getS3Client = (s3ForcePathStyle = false) => {
    return new client_s3_1.S3Client({
        endpoint: process.env['AWS_S3_BASE_URL'],
        credentials: {
            accessKeyId: config_1.default.aws.accessKey,
            secretAccessKey: config_1.default.aws.accessSecret,
        },
        region: config_1.default.aws.region,
        // 's3ForcePathStyle' is only truly necessary for local development/minio,
        // but included here for consistency with your original 'delete' function.
        forcePathStyle: s3ForcePathStyle,
    });
};
exports.getS3Client = getS3Client;
const toPublicAssetUrl = (bucket, key) => {
    // Replace [PROJECT_REF] with your actual project ID (ymhcmfgtvkaoqbrhpbma)
    const projectRef = 'ymhcmfgtvkaoqbrhpbma';
    return `https://${projectRef}.supabase.co/storage/v1/object/public/${bucket}/${key}`;
};
exports.toPublicAssetUrl = toPublicAssetUrl;
const uploadScreenshot = async (sessionUuid, fileString, fileExt, projectId, timestamp, userId) => {
    // Step 1: Parse Base64
    const base64Data = fileString.replace(/^data:image\/\w+;base64,/, "");
    const dataType = fileString.match(/data:(.*?);base64,/);
    const mimeType = dataType ? dataType[1] : "image/" + fileExt;
    const buffer = Buffer.from(base64Data, "base64");
    const filename = `${projectId}/${userId}_${timestamp}.${fileExt}`;
    const bucket = process.env['AWS_BUCKET_NAME'] || "";
    const s3Client = (0, exports.getS3Client)(true);
    const upload = new lib_storage_1.Upload({
        client: s3Client,
        params: {
            Bucket: bucket,
            Key: filename,
            Body: buffer,
            ContentType: mimeType,
            // ACL: 'public-read', // Optional: Depends on bucket policy
        },
    });
    // The 'done()' method now returns the data object, which includes Location.
    await upload.done();
    // V3 response structure is different, but Location should still be present.
    // We assume the type assertion to string is safe based on your original code.
    const url = (0, exports.toPublicAssetUrl)(bucket, filename);
    // Step 3: Save to DB
    const screenshot = await screenshot_model_1.default.create({
        sessionUuid,
        url,
        s3Key: filename,
        projectId,
        timestamp,
        userId
    });
    return screenshot;
};
exports.uploadScreenshot = uploadScreenshot;
//# sourceMappingURL=screenshot.service.js.map