import { ConfiguratorProject, TextLayer, ImageLayer, ShapeLayer } from './types';

export const generateProjectSVG = (project: ConfiguratorProject, responsive: boolean = true): string => {
  const { width, height, background, layers } = project;

  let defs = '';
  let elements = '';

  // Generate unique gradient defs
  layers.forEach((layer) => {
    if ((layer.type === 'text' || layer.type === 'shape') && layer.fillType === 'linear') {
      const gradId = `grad_${layer.id}`;
      const startColor = layer.gradientStart || layer.fill || '#0D99FF';
      const endColor = layer.gradientEnd || '#E0458F';
      const angle = layer.gradientAngle || 0;

      let x1 = '0%', y1 = '0%', x2 = '100%', y2 = '0%';
      if (angle === 90) {
        x1 = '0%'; y1 = '0%'; x2 = '0%'; y2 = '100%';
      } else if (angle === 45) {
        x1 = '0%'; y1 = '0%'; x2 = '100%'; y2 = '100%';
      }

      defs += `
    <linearGradient id="${gradId}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
      <stop offset="0%" stop-color="${startColor}" />
      <stop offset="100%" stop-color="${endColor}" />
    </linearGradient>`;
    }
  });

  // Background
  elements += `  <rect width="100%" height="100%" fill="${background.color || '#FFFFFF'}" />\n`;
  if (background.imageUrl) {
    const safeBgUrl = escapeXml(background.imageUrl);
    elements += `  <image href="${safeBgUrl}" xlink:href="${safeBgUrl}" width="${width}" height="${height}" opacity="${background.opacity ?? 1}" preserveAspectRatio="xMidYMid slice" />\n`;
  }

  // Layers
  layers.forEach((layer) => {
    if (!layer.visible) return;

    const rot = layer.rotation || 0;
    const opacity = layer.opacity ?? 1;
    const transform = rot !== 0 ? ` transform="rotate(${rot} ${layer.x} ${layer.y})"` : '';

    if (layer.type === 'text') {
      const tl = layer as TextLayer;
      const fill = tl.fillType === 'linear' ? `url(#grad_${tl.id})` : tl.fill;
      const fontWeight = tl.fontStyle.includes('bold') ? 'bold' : 'normal';
      const fontStyle = tl.fontStyle.includes('italic') ? 'italic' : 'normal';
      const effectiveW = (tl.width || 0) * (tl.scaleX || 1);
      let textX = tl.x;
      let textAnchor = 'start';

      if (tl.align === 'center') {
        if (effectiveW > 0) {
          textX = tl.x + effectiveW / 2;
          textAnchor = 'middle';
        } else {
          textAnchor = 'start';
        }
      } else if (tl.align === 'right') {
        if (effectiveW > 0) {
          textX = tl.x + effectiveW;
          textAnchor = 'end';
        }
      }

      const rawText = tl.text || '';
      if (rawText.includes('\n')) {
        const lines = rawText.split('\n');
        const tspans = lines
          .map((line, idx) => `<tspan x="${textX}" dy="${idx === 0 ? 0 : '1.2em'}">${escapeXml(line)}</tspan>`)
          .join('');
        elements += `  <text x="${textX}" y="${tl.y + tl.fontSize}" font-family="${tl.fontFamily}, sans-serif" font-size="${tl.fontSize}px" font-weight="${fontWeight}" font-style="${fontStyle}" fill="${fill}" text-anchor="${textAnchor}" opacity="${opacity}"${transform}>${tspans}</text>\n`;
      } else {
        elements += `  <text x="${textX}" y="${tl.y + tl.fontSize}" font-family="${tl.fontFamily}, sans-serif" font-size="${tl.fontSize}px" font-weight="${fontWeight}" font-style="${fontStyle}" fill="${fill}" text-anchor="${textAnchor}" opacity="${opacity}"${transform}>${escapeXml(rawText)}</text>\n`;
      }
    } else if (layer.type === 'image') {
      const il = layer as ImageLayer;
      const bw = il.borderWidth || 0;
      if (bw > 0) {
        elements += `  <rect x="${il.x - bw}" y="${il.y - bw}" width="${il.width * (il.scaleX || 1) + bw * 2}" height="${il.height * (il.scaleY || 1) + bw * 2}" fill="${il.borderColor || '#FFFFFF'}" rx="4"${transform} />\n`;
      }
      const safeSrc = escapeXml(il.src || '');
      elements += `  <image href="${safeSrc}" xlink:href="${safeSrc}" x="${il.x}" y="${il.y}" width="${il.width * (il.scaleX || 1)}" height="${il.height * (il.scaleY || 1)}" opacity="${opacity}"${transform} preserveAspectRatio="none" />\n`;
    } else if (layer.type === 'shape') {
      const sl = layer as ShapeLayer;
      const fill = sl.fillType === 'linear' ? `url(#grad_${sl.id})` : sl.fill;
      const sw = sl.width * (sl.scaleX || 1);
      const sh = sl.height * (sl.scaleY || 1);
      const strokeAttr = sl.strokeWidth ? ` stroke="${sl.stroke || '#FFFFFF'}" stroke-width="${sl.strokeWidth}"` : '';

      if (sl.shapeType === 'circle') {
        elements += `  <ellipse cx="${sl.x + sw / 2}" cy="${sl.y + sh / 2}" rx="${sw / 2}" ry="${sh / 2}" fill="${fill}" opacity="${opacity}"${strokeAttr}${transform} />\n`;
      } else if (sl.shapeType === 'rounded-rect') {
        elements += `  <rect x="${sl.x}" y="${sl.y}" width="${sw}" height="${sh}" rx="${sl.cornerRadius || 20}" fill="${fill}" opacity="${opacity}"${strokeAttr}${transform} />\n`;
      } else if (sl.shapeType === 'heart') {
        elements += `  <g transform="translate(${sl.x}, ${sl.y}) scale(${sw / 24}, ${sh / 24})"${transform}>\n`;
        elements += `    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="${fill}" opacity="${opacity}"${strokeAttr} />\n`;
        elements += `  </g>\n`;
      } else if (sl.shapeType === 'star') {
        elements += `  <g transform="translate(${sl.x}, ${sl.y}) scale(${sw / 100}, ${sh / 100})"${transform}>\n`;
        elements += `    <polygon points="50,5 64,36 98,36 70,57 81,91 50,70 19,91 30,57 2,36 36,36" fill="${fill}" opacity="${opacity}"${strokeAttr} />\n`;
        elements += `  </g>\n`;
      } else if (sl.shapeType === 'ribbon') {
        elements += `  <g transform="translate(${sl.x}, ${sl.y}) scale(${sw / 100}, ${sh / 40})"${transform}>\n`;
        elements += `    <polygon points="0,0 100,0 88,20 100,40 0,40 12,20" fill="${fill}" opacity="${opacity}"${strokeAttr} />\n`;
        elements += `  </g>\n`;
      } else if (sl.shapeType === 'badge') {
        elements += `  <g transform="translate(${sl.x}, ${sl.y}) scale(${sw / 100}, ${sh / 100})"${transform}>\n`;
        elements += `    <polygon points="50,0 62,10 78,6 85,21 100,25 98,41 109,53 98,65 100,81 85,85 78,100 62,96 50,106 38,96 22,100 15,85 0,81 2,65 -9,53 2,41 0,25 15,21 22,6 38,10" fill="${fill}" opacity="${opacity}"${strokeAttr} />\n`;
        elements += `  </g>\n`;
      } else {
        // Default rectangle
        const cr = sl.cornerRadius || 0;
        const rxAttr = cr > 0 ? ` rx="${cr}"` : '';
        elements += `  <rect x="${sl.x}" y="${sl.y}" width="${sw}" height="${sh}"${rxAttr} fill="${fill}" opacity="${opacity}"${strokeAttr}${transform} />\n`;
      }
    }
  });

  const widthAttr = responsive ? 'width="100%"' : `width="${width}"`;
  const heightAttr = responsive ? 'height="100%"' : `height="${height}"`;
  const styleAttr = responsive ? ' style="width: 100%; height: 100%; display: block;"' : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" ${widthAttr} ${heightAttr}${styleAttr} preserveAspectRatio="xMidYMid meet">
  <defs>${defs}
  </defs>
${elements}</svg>`;
};

const escapeXml = (unsafe: string): string => {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
};
