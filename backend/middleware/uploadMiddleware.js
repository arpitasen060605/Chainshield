import multer from 'multer';
import path from 'path';

// Configurable maximum file size (default: 100MB)
const maxFileSize = parseInt(process.env.MAX_EVIDENCE_FILE_SIZE, 10) || 100 * 1024 * 1024;

// Dangerous file extensions to reject
const DISALLOWED_EXTENSIONS = [
  '.exe',
  '.bat',
  '.cmd',
  '.ps1',
  '.sh',
  '.com',
  '.scr',
  '.vbs',
  '.dll',
  '.msi',
  '.vbe',
  '.jse',
  '.wsf',
  '.wsh',
  '.pif',
  '.application',
  '.gadget',
  '.hta',
  '.cpl',
  '.msc',
  '.jar',
];

// Dangerous MIME types to reject
const DISALLOWED_MIME_TYPES = [
  'application/x-msdownload',
  'application/x-executable',
  'application/x-sh',
  'application/x-bat',
  'application/x-msdos-program',
  'application/x-dosexec',
];

// Secure Memory Storage (Buffer in memory, direct upload to Cloudinary)
const storage = multer.memoryStorage();

// Strict file validation filter
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  if (DISALLOWED_EXTENSIONS.includes(ext) || DISALLOWED_MIME_TYPES.includes(mime)) {
    const error = new Error(
      `File type rejected: ${ext} files are classified as potentially dangerous scripts/executables.`
    );
    error.statusCode = 400;
    return cb(error, false);
  }

  cb(null, true);
};

export const uploadEvidenceFile = multer({
  storage,
  limits: {
    fileSize: maxFileSize,
  },
  fileFilter,
}).single('file');

export { maxFileSize };
