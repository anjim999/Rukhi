import { THEME_PRESETS, ANIMATION_TYPES } from '../../../../shared/constants/timeline';

const SOLID_BOX_PRESETS = {
  [THEME_PRESETS.HORMOZI]: '#22C55E',
  [THEME_PRESETS.HORMOZI_YELLOW]: '#EAB308',
  [THEME_PRESETS.HORMOZI_RED]: '#EF4444',
  [THEME_PRESETS.COMIC_YELLOW]: '#EAB308',
  [THEME_PRESETS.FIRE_RED]: '#EF4444',
  [THEME_PRESETS.ELECTRIC_CYAN]: '#06B6D4',
  [THEME_PRESETS.ELECTRIC_LIME]: '#84CC16',
  [THEME_PRESETS.VIOLET_DREAM]: '#8B5CF6',
  [THEME_PRESETS.HOT_PINK]: '#EC4899',
  [THEME_PRESETS.ROYAL_BLUE]: '#2563EB',
  [THEME_PRESETS.TEAL_BREEZE]: '#0D9488',
  [THEME_PRESETS.TANGERINE_POP]: '#F97316',
  [THEME_PRESETS.INDIGO_SKY]: '#4F46E5',
  [THEME_PRESETS.MINT_FRESH]: '#10B981',
  [THEME_PRESETS.CORAL_CRUSH]: '#F43F5E',
  [THEME_PRESETS.SUNSET_BURST]: '#EA580C',
};

const GLOW_PRESETS = {
  [THEME_PRESETS.NEON_GLOW]: '#06B6D4',
  [THEME_PRESETS.CYBER_PURPLE]: '#D946EF',
  [THEME_PRESETS.MATRIX_GREEN]: '#22C55E',
  [THEME_PRESETS.ICE_BLUE]: '#38BDF8',
  [THEME_PRESETS.AMBER_GLOW]: '#F59E0B',
  [THEME_PRESETS.RUBY_GLOW]: '#E11D48',
  [THEME_PRESETS.NEON_LEMON]: '#FACC15',
  [THEME_PRESETS.ROSE_GOLD]: '#FB7185',
  [THEME_PRESETS.NEON_ORANGE]: '#F97316',
  [THEME_PRESETS.NEON_LIME]: '#84CC16',
  [THEME_PRESETS.SUBMAGIC_GLOW]: '#06B6D4',
};

export function renderCanvasSubtitles(ctx, cw, ch, time, segments, timeline) {
  if (!Array.isArray(segments) || segments.length === 0) return;

  const currentSegment = segments.find((s) => time >= s.start && time <= s.end);
  if (!currentSegment) return;

  const style = timeline?.style || {};
  const activeColor = style.highlightColor || '#FACC15';
  const fontFamily = style.fontFamily || 'Montserrat';
  const presetId = style.presetId || THEME_PRESETS.HORMOZI;
  const animType = style.animation || ANIMATION_TYPES.POP;

  const baseFontSize = Math.round(cw * 0.052);
  const words = currentSegment.words || [];
  if (words.length === 0) return;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const posY = ch * ((style.positionY ?? 75) / 100);

  // Group words into lines for clean multi-line canvas rendering
  const maxWordsPerLine = cw < 600 ? 4 : 6;
  const lines = [];
  for (let i = 0; i < words.length; i += maxWordsPerLine) {
    lines.push(words.slice(i, i + maxWordsPerLine));
  }

  const lineHeight = baseFontSize * 1.35;
  const totalHeight = lines.length * lineHeight;
  const startY = posY - totalHeight / 2 + lineHeight / 2;

  lines.forEach((lineWords, lineIdx) => {
    const currentLineY = startY + lineIdx * lineHeight;

    const measuredLine = lineWords.map((w) => {
      const isWordActive = time >= w.start && time <= w.end;
      const isWordPast = time > w.end;
      const wFontSize = isWordActive ? Math.round(baseFontSize * 1.12) : baseFontSize;

      ctx.font = `900 ${wFontSize}px "${fontFamily}", sans-serif`;
      const textToDraw = w.emoji ? `${w.word} ${w.emoji}` : w.word;
      const metrics = ctx.measureText(textToDraw);

      return {
        wordObj: w,
        text: textToDraw,
        rawWidth: metrics.width,
        effectiveWidth: metrics.width,
        wFontSize,
        isActive: isWordActive,
        isPast: isWordPast,
      };
    });

    const wordGap = Math.round(cw * 0.015);
    const totalLineWidth = measuredLine.reduce((acc, curr) => acc + curr.effectiveWidth, 0) + (measuredLine.length - 1) * wordGap;
    let wordX = (cw - totalLineWidth) / 2;

    measuredLine.forEach((w) => {
      ctx.save();
      ctx.translate(wordX + w.effectiveWidth / 2, currentLineY);

      if (w.isActive) {
        if (animType === ANIMATION_TYPES.BOUNCE) {
          ctx.translate(0, -Math.abs(Math.sin((time - w.wordObj.start) * 15)) * 12);
        } else if (animType === ANIMATION_TYPES.SHAKE_RUMBLE) {
          ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
        }
      }

      ctx.font = `900 ${w.wFontSize}px "${fontFamily}", sans-serif`;

      if (SOLID_BOX_PRESETS[presetId]) {
        const padX = Math.round(w.wFontSize * 0.35);
        const padY = Math.round(w.wFontSize * 0.18);
        const boxW = w.rawWidth + padX * 2;
        const boxH = w.wFontSize + padY * 2;
        const boxColor = SOLID_BOX_PRESETS[presetId] || activeColor;

        ctx.shadowColor = boxColor;
        ctx.shadowBlur = 14;
        ctx.fillStyle = boxColor;
        ctx.beginPath();
        ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, 10);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000000';
        ctx.fillText(w.text, 0, 0);

      } else if (GLOW_PRESETS[presetId]) {
        const strokeW = Math.round(w.wFontSize * 0.15);
        ctx.lineWidth = strokeW;
        ctx.strokeStyle = '#000000';
        ctx.lineJoin = 'round';
        ctx.strokeText(w.text, 0, 0);

        if (w.isActive) {
          const glowColor = GLOW_PRESETS[presetId] || activeColor;
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = animType === ANIMATION_TYPES.GLOW_PULSE ? 18 + Math.sin(time * 12) * 12 : 24;
          ctx.fillStyle = glowColor;
        } else {
          ctx.shadowColor = '#000000';
          ctx.shadowBlur = 6;
          ctx.fillStyle = '#FFFFFF';
        }
        ctx.fillText(w.text, 0, 0);

      } else {
        const strokeW = Math.round(w.wFontSize * 0.15);
        ctx.lineWidth = strokeW;
        ctx.strokeStyle = '#000000';
        ctx.lineJoin = 'round';
        ctx.strokeText(w.text, 0, 0);

        if (w.isActive) {
          ctx.shadowColor = activeColor;
          ctx.shadowBlur = 18;
          ctx.fillStyle = activeColor;
        } else {
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = 6;
          ctx.fillStyle = '#FFFFFF';
        }
        ctx.fillText(w.text, 0, 0);
      }

      ctx.restore();
      wordX += w.effectiveWidth + wordGap;
    });
  });

  ctx.restore();
}
