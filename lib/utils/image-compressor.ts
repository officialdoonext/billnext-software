/**
 * Compress an image file to strictly under targetSizeKB (default: 60KB)
 * without sacrificing noticeable visual quality.
 */
export async function compressImageTo60KB(
  file: File,
  targetSizeKB: number = 60
): Promise<{
  blob: Blob;
  base64: string;
  sizeKB: number;
  originalSizeKB: number;
}> {
  const originalSizeKB = Math.round((file.size / 1024) * 10) / 10;

  // If already under target size, return directly
  if (file.size <= targetSizeKB * 1024) {
    const base64 = await fileToBase64(file);
    return {
      blob: file,
      base64,
      sizeKB: originalSizeKB,
      originalSizeKB,
    };
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onerror = (error) => reject(error);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Max initial dimensions for product icons/thumbnails
        const MAX_DIM = 900;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = width;
        canvas.height = height;

        if (!ctx) {
          reject(new Error("Unable to create canvas context"));
          return;
        }

        // Draw image on canvas with high-quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Binary step-down to reach <= 60KB
        let minQuality = 0.2;
        let maxQuality = 0.88;
        let bestDataUrl = "";
        let bestBlob: Blob | null = null;
        let iterations = 0;

        const tryCompress = (quality: number) => {
          iterations++;
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Compression failed"));
                return;
              }

              const sizeKB = blob.size / 1024;

              if (sizeKB <= targetSizeKB || iterations >= 7) {
                bestBlob = blob;
                const blobReader = new FileReader();
                blobReader.readAsDataURL(blob);
                blobReader.onloadend = () => {
                  resolve({
                    blob: bestBlob || blob,
                    base64: blobReader.result as string,
                    sizeKB: Math.round((blob.size / 1024) * 10) / 10,
                    originalSizeKB,
                  });
                };
              } else {
                // If still above 60KB, reduce quality and dimensions
                if (sizeKB > targetSizeKB) {
                  maxQuality = quality;
                  canvas.width = Math.round(canvas.width * 0.88);
                  canvas.height = Math.round(canvas.height * 0.88);
                  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                } else {
                  minQuality = quality;
                }
                const nextQuality = Math.max(0.2, (minQuality + maxQuality) / 2);
                tryCompress(nextQuality);
              }
            },
            "image/webp",
            quality
          );
        };

        tryCompress(0.78);
      };
    };
  });
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

