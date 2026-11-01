/**
 * Read an image file and return a downscaled JPEG data URL.
 * Phone photos are several MB; that overflows localStorage (~5 MB total) and a
 * Firestore document (1 MiB), so photos are resized before being stored.
 */
const MAX_SIDE = 1080;
const QUALITY = 0.8;

export function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Файл не похож на изображение'));
      img.onload = () => {
        const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', QUALITY));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
