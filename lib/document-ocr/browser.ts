/** Optional local OCR through the browser's native Shape Detection API.
 * Never uploads images, invokes a remote OCR service, or triggers payments.
 * Not all browsers implement TextDetector; callers must offer manual entry.
 */
type Detection = Readonly<{ rawValue?: string }>;
type NativeTextDetector = new () => { detect(image: ImageBitmap): Promise<Detection[]> };

export async function readImageTextLocally(file: File): Promise<string> {
  if (!(file instanceof File) || !['image/jpeg','image/png'].includes(file.type) ||
      file.size < 1 || file.size > 10_000_000) throw new Error('invalid_image_input');
  const Detector = (globalThis as typeof globalThis & { TextDetector?: NativeTextDetector }).TextDetector;
  if (!Detector || typeof createImageBitmap !== 'function') {
    throw new Error('On-device OCR is not supported in this browser. Paste text or enter receipt details manually.');
  }
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width < 1 || bitmap.height < 1 || bitmap.width * bitmap.height > 24_000_000) {
      throw new Error('image_dimensions_out_of_range');
    }
    const results = await new Detector().detect(bitmap);
    if (!Array.isArray(results) || results.length > 500) throw new Error('ocr_output_limit');
    return results.map(item => typeof item?.rawValue === 'string' ? item.rawValue : '')
      .join('\n').slice(0, 5000);
  } finally {
    bitmap.close();
  }
}
