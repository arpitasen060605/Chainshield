import crypto from 'crypto';
import fs from 'fs';
import http from 'http';
import https from 'https';

/**
 * Calculates SHA-256 hash of a local file path or remote HTTP/HTTPS URL
 * @param {string} fileSource - Local file path or remote HTTP/HTTPS URL
 * @returns {Promise<string>} Hexadecimal SHA-256 hash string
 */
export const hashFile = (fileSource) => {
  return new Promise((resolve, reject) => {
    if (!fileSource || typeof fileSource !== 'string') {
      return reject(new Error('Invalid file source provided for hashing'));
    }

    const isRemote = /^https?:\/\//i.test(fileSource);
    const hash = crypto.createHash('sha256');

    if (isRemote) {
      const getStream = (urlStr, maxRedirects = 5) => {
        if (maxRedirects <= 0) {
          return reject(new Error('Too many redirects while fetching remote evidence file'));
        }

        const client = urlStr.startsWith('https') ? https : http;
        client
          .get(urlStr, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
              return getStream(res.headers.location, maxRedirects - 1);
            }

            if (res.statusCode !== 200) {
              return reject(
                new Error(`Failed to fetch evidence file from Cloudinary (HTTP ${res.statusCode})`)
              );
            }

            res.on('data', (chunk) => {
              hash.update(chunk);
            });

            res.on('end', () => {
              resolve(hash.digest('hex'));
            });

            res.on('error', (err) => {
              reject(err);
            });
          })
          .on('error', (err) => {
            reject(err);
          });
      };

      getStream(fileSource);
    } else {
      if (!fs.existsSync(fileSource)) {
        return reject(new Error(`File not found at path: ${fileSource}`));
      }

      const stream = fs.createReadStream(fileSource);

      stream.on('data', (chunk) => {
        hash.update(chunk);
      });

      stream.on('end', () => {
        resolve(hash.digest('hex'));
      });

      stream.on('error', (err) => {
        reject(err);
      });
    }
  });
};

export default hashFile;
