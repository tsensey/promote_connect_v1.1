import imageCompression from 'browser-image-compression';

type CompressionOptions = {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  fileType?: string;
};

const defaultOptions: CompressionOptions = {
  maxSizeMB: 1,
  maxWidthOrHeight: 2048,
  useWebWorker: true,
};

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  if (file.type === 'image/gif') return file;

  try {
    const compressed = await imageCompression(file, {
      ...defaultOptions,
      ...options,
    });

    if (compressed.size >= file.size) return file;

    return compressed;
  } catch {
    return file;
  }
}

export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> {
  return Promise.all(files.map((f) => compressImage(f, options)));
}
