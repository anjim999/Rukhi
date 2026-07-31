/**
 * Canvas Video Player Utilities & Frame Drawing Helpers
 */

export function getSanitizedFilename(title, fallback = 'reel', ext = 'mp4') {
  if (!title || !title.trim()) return `${fallback}_${Date.now()}.${ext}`;
  let clean = title.trim();
  clean = clean.replace(/\.(mp4|mov|webm|m4v|avi|mkv)$/i, '');
  clean = clean.replace(/[^\w\s\-\.]/g, '').trim().replace(/\s+/g, '_');
  if (!clean) return `${fallback}_${Date.now()}.${ext}`;
  return `${clean}.${ext}`;
}

export function drawCover(ctx, imgOrVideo, dstW, dstH) {
  try {
    const srcW = imgOrVideo.videoWidth || imgOrVideo.naturalWidth || imgOrVideo.width || dstW;
    const srcH = imgOrVideo.videoHeight || imgOrVideo.naturalHeight || imgOrVideo.height || dstH;
    
    if (!srcW || !srcH) {
      ctx.drawImage(imgOrVideo, 0, 0, dstW, dstH);
      return;
    }

    const srcAspect = srcW / srcH;
    const dstAspect = dstW / dstH;

    let sX = 0, sY = 0, sW = srcW, sH = srcH;
    if (srcAspect > dstAspect) {
      sW = srcH * dstAspect;
      sX = (srcW - sW) / 2;
    } else {
      sH = srcW / dstAspect;
      sY = (srcH - sH) / 2;
    }

    ctx.drawImage(imgOrVideo, sX, sY, sW, sH, 0, 0, dstW, dstH);
  } catch (_e) {
    try {
      ctx.drawImage(imgOrVideo, 0, 0, dstW, dstH);
    } catch (_e2) {}
  }
}
