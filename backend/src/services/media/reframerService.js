/**
 * AI Face-Tracking Auto-Reframer Service ($0 cost open-source integration)
 * Computes optimal X-axis crop center to keep the speaker centered in 9:16 portrait video exports.
 */
export function calculateFaceCenteredCropX({ nativeWidth = 1920, nativeHeight = 1080, faceDetections = [] }) {
  const targetWidth = Math.round(nativeHeight * (9 / 16));

  if (!Array.isArray(faceDetections) || faceDetections.length === 0) {
    // Default to center crop if no face detected
    const defaultX = Math.round((nativeWidth - targetWidth) / 2);
    return Math.max(0, Math.min(nativeWidth - targetWidth, defaultX));
  }

  // Calculate average face center X coordinate
  const totalX = faceDetections.reduce((sum, face) => sum + (face.x || nativeWidth / 2), 0);
  const avgFaceX = totalX / faceDetections.length;

  const optimalCropX = Math.round(avgFaceX - targetWidth / 2);
  return Math.max(0, Math.min(nativeWidth - targetWidth, optimalCropX));
}
