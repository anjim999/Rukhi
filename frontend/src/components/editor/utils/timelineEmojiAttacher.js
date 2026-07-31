export function attachClientSideEmojis(segments) {
  const PALETTE_EMOJIS = ['⚡', '💸', '🚀', '🔥', '🤖', '💡', '👑', '❤️', '🎯', '✨', '🚨', '🎬', '🎵', '🇮🇳'];
  let appliedCount = 0;

  const updatedSegments = segments.map((seg, sIdx) => ({
    ...seg,
    words: (seg.words || []).map((w, wIdx) => {
      let text = w.word || '';
      let emoji = w.emoji;
      if (!emoji) {
        const lower = text.toLowerCase();
        if (lower.includes('money') || lower.includes('cash') || lower.includes('rich') || lower.includes('earn') || lower.includes('rupee')) emoji = '💸';
        else if (lower.includes('fire') || lower.includes('hot') || lower.includes('viral') || lower.includes('trend')) emoji = '🔥';
        else if (lower.includes('fast') || lower.includes('quick') || lower.includes('speed') || lower.includes('power')) emoji = '⚡';
        else if (lower.includes('launch') || lower.includes('grow') || lower.includes('rocket') || lower.includes('start')) emoji = '🚀';
        else if (lower.includes('ai') || lower.includes('bot') || lower.includes('tech') || lower.includes('code')) emoji = '🤖';
        else if (lower.includes('idea') || lower.includes('truth') || lower.includes('mind') || lower.includes('secret')) emoji = '💡';
        else if (lower.includes('king') || lower.includes('win') || lower.includes('top') || lower.includes('boss')) emoji = '👑';
        else if (lower.includes('love') || lower.includes('heart') || lower.includes('feel')) emoji = '❤️';
        else if (lower.includes('target') || lower.includes('goal') || lower.includes('focus')) emoji = '🎯';
        else if (lower.includes('magic') || lower.includes('star') || lower.includes('best')) emoji = '✨';
        else if (lower.includes('stop') || lower.includes('warn') || lower.includes('alert')) emoji = '🚨';
        else if (lower.includes('movie') || lower.includes('film') || lower.includes('cinema') || lower.includes('trailer') || lower.includes('raja saab')) emoji = '🎬';
        else if (lower.includes('song') || lower.includes('music') || lower.includes('dance') || lower.includes('lulu')) emoji = '🎵';
        else if (lower.includes('hyderabad') || lower.includes('telugu') || lower.includes('hindi') || lower.includes('india')) emoji = '🇮🇳';
        else if ((sIdx * 3 + wIdx) % 7 === 0) {
          emoji = PALETTE_EMOJIS[(sIdx + wIdx) % PALETTE_EMOJIS.length];
        }
      }
      if (emoji) appliedCount++;
      return {
        ...w,
        emoji,
        isHighlighted: w.isHighlighted || !!emoji,
        highlightColor: w.highlightColor || (emoji ? '#FACC15' : w.highlightColor),
      };
    }),
  }));

  return { updatedSegments, appliedCount };
}
