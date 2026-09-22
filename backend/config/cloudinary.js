import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env file from backend root directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * Configure and return Cloudinary instance using current process.env values
 */
export const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
};

// Initial configuration
configureCloudinary();

/**
 * Upload in-memory buffer directly to Cloudinary using upload_stream
 * @param {Buffer} buffer - In-memory file buffer
 * @param {string} originalFileName - Original filename
 * @param {object} customOptions - Extra upload options
 * @returns {Promise<import('cloudinary').UploadApiResponse>}
 */
export const uploadBufferToCloudinary = async (buffer, originalFileName, customOptions = {}) => {
  configureCloudinary();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'chainshield/evidence',
        resource_type: 'auto',
        use_filename: true,
        unique_filename: true,
        ...customOptions,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(buffer);
  });
};

/**
 * Upload local file to Cloudinary in chainshield/evidence folder
 * @param {string} filePath - Path to local file on disk
 * @param {object} customOptions - Extra upload options
 * @returns {Promise<import('cloudinary').UploadApiResponse>}
 */
export const uploadToCloudinary = async (filePath, customOptions = {}) => {
  // Dynamically re-apply config to use the latest process.env credentials
  configureCloudinary();

  return await cloudinary.uploader.upload(filePath, {
    folder: 'chainshield/evidence',
    resource_type: 'auto',
    use_filename: true,
    unique_filename: true,
    ...customOptions,
  });
};

export default cloudinary;
