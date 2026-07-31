import toast from 'react-hot-toast';

export function copyIgPost(socialData, setCopiedIg) {
  if (!socialData?.instagram) return;
  const text = `${socialData.instagram.caption}\n\n${socialData.instagram.hashtags.join(' ')}`;
  navigator.clipboard.writeText(text);
  setCopiedIg(true);
  toast.success('Instagram Reel post copied to clipboard!', { id: 'copy-toast' });
  setTimeout(() => setCopiedIg(false), 2000);
}

export function copyYtPost(socialData, setCopiedYt) {
  if (!socialData?.youtubeShorts) return;
  const text = `${socialData.youtubeShorts.title}\n\n${socialData.youtubeShorts.description}\n\n${socialData.youtubeShorts.hashtags.join(' ')}`;
  navigator.clipboard.writeText(text);
  setCopiedYt(true);
  setTimeout(() => setCopiedYt(false), 2500);
}

export function copyAllSocialPosts(socialData) {
  if (!socialData) return;
  const igText = socialData.instagram ? `📸 INSTAGRAM REEL:\n${socialData.instagram.caption}\n\n${socialData.instagram.hashtags?.join(' ')}` : '';
  const ytText = socialData.youtubeShorts ? `🎬 YOUTUBE SHORTS:\n${socialData.youtubeShorts.title}\n\n${socialData.youtubeShorts.description}\n\n${socialData.youtubeShorts.hashtags?.join(' ')}` : '';
  const fullContent = `${igText}\n\n====================\n\n${ytText}`;
  navigator.clipboard.writeText(fullContent);
  toast.success('🔥 Copied complete Instagram + YouTube Viral Pack!', { id: 'copy-all-toast', duration: 3000 });
}
