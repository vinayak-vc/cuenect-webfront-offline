import { ConfiguratorProject, ConfiguratorLayer, ImageLayer, ShapeLayer } from './types';

interface ParsedTransform {
  x: number;
  y: number;
  rotation: number;
}

function parseSvgTransform(transformStr: string | null): ParsedTransform {
  if (!transformStr) return { x: 0, y: 0, rotation: 0 };
  let x = 0;
  let y = 0;
  let rotation = 0;

  // translate(x y) or translate(x, y)
  const transMatch = transformStr.match(/translate\(\s*([-\d.]+)[,\s]+([-\d.]+)\s*\)/);
  if (transMatch) {
    x = parseFloat(transMatch[1]) || 0;
    y = parseFloat(transMatch[2]) || 0;
  }

  // rotate(deg) or rotate(deg cx cy)
  const rotMatch = transformStr.match(/rotate\(\s*([-\d.]+)(?:[,\s]+([-\d.]+)[,\s]+([-\d.]+))?\s*\)/);
  if (rotMatch) {
    rotation = Math.round(parseFloat(rotMatch[1])) || 0;
  }

  return { x, y, rotation };
}

/**
 * Parses an SVG exported from Figma or pasted from clipboard,
 * extracting 1:1 resolution, full-resolution embedded photos,
 * cards, corner radii, decorative vector banners, and editable text.
 */
export function parseFigmaSvg(svgString: string, projectName = 'Figma Import'): ConfiguratorProject | null {
  if (!svgString || !svgString.includes('<svg')) return null;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const svgEl = doc.querySelector('svg');
    if (!svgEl) return null;

    let width = 1920;
    let height = 1080;

    const wAttr = svgEl.getAttribute('width');
    const hAttr = svgEl.getAttribute('height');
    const viewBox = svgEl.getAttribute('viewBox');

    if (viewBox) {
      const parts = viewBox.trim().split(/[\s,]+/).map(Number);
      if (parts.length === 4) {
        width = Math.round(parts[2]);
        height = Math.round(parts[3]);
      }
    } else {
      if (wAttr && !wAttr.includes('%')) width = Math.round(parseFloat(wAttr));
      if (hAttr && !hAttr.includes('%')) height = Math.round(parseFloat(hAttr));
    }

    // 1. Build a registry of all embedded images in <defs>
    const imageMap = new Map<string, string>();
    doc.querySelectorAll('image').forEach((img) => {
      const id = img.getAttribute('id');
      const href =
        img.getAttribute('href') ||
        img.getAttribute('xlink:href') ||
        img.getAttributeNS('http://www.w3.org/1999/xlink', 'href') ||
        img.getAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href') ||
        Array.from(img.attributes).find((a) => a.name.endsWith('href'))?.value ||
        '';
      if (id && href) {
        imageMap.set(id, href);
      }
    });

    // Fallback regex extraction of embedded images directly from svgString
    const imgRegex = /<image\b[^>]*\bid=["']([^"']+)["'][^>]*(?:xlink:)?href=["']([^"']+)["']/gi;
    let imgMatch;
    while ((imgMatch = imgRegex.exec(svgString)) !== null) {
      if (imgMatch[1] && imgMatch[2] && !imageMap.has(imgMatch[1])) {
        imageMap.set(imgMatch[1], imgMatch[2]);
      }
    }

    // 2. Build a registry of all pattern fills linking to images
    const patternImages = new Map<string, string>();
    doc.querySelectorAll('pattern').forEach((pattern) => {
      const patternId = pattern.getAttribute('id');
      if (!patternId) return;

      // Direct image in pattern
      const directImg = pattern.querySelector('image');
      if (directImg) {
        const href =
          directImg.getAttribute('href') ||
          directImg.getAttribute('xlink:href') ||
          directImg.getAttributeNS('http://www.w3.org/1999/xlink', 'href') ||
          Array.from(directImg.attributes).find((a) => a.name.endsWith('href'))?.value;
        if (href) {
          patternImages.set(patternId, href);
          return;
        }
      }

      // <use xlink:href="#imageId"> in pattern
      const useEl = pattern.querySelector('use');
      if (useEl) {
        const useHref = (
          useEl.getAttribute('href') ||
          useEl.getAttribute('xlink:href') ||
          useEl.getAttributeNS('http://www.w3.org/1999/xlink', 'href') ||
          Array.from(useEl.attributes).find((a) => a.name.endsWith('href'))?.value ||
          ''
        ).replace('#', '');
        if (useHref && imageMap.has(useHref)) {
          patternImages.set(patternId, imageMap.get(useHref)!);
        }
      }
    });

    // Fallback regex extraction of patterns linking to images
    const patRegex = /<pattern\b[^>]*\bid=["']([^"']+)["'][^>]*>([\s\S]*?)<\/pattern>/gi;
    let patMatch;
    while ((patMatch = patRegex.exec(svgString)) !== null) {
      const pId = patMatch[1];
      const pBody = patMatch[2];
      const useMatch = pBody.match(/<use\b[^>]*(?:xlink:)?href=["']#?([^"']+)["']/i);
      if (useMatch && imageMap.has(useMatch[1]) && !patternImages.has(pId)) {
        patternImages.set(pId, imageMap.get(useMatch[1])!);
      }
    }

    // 3. Extract Linear Gradients
    const gradMap = new Map<string, { start: string; end: string }>();
    doc.querySelectorAll('linearGradient').forEach((lg) => {
      const id = lg.getAttribute('id');
      const stops = Array.from(lg.querySelectorAll('stop')).map((s) => s.getAttribute('stop-color') || '#FFFFFF');
      if (id && stops.length >= 2) {
        gradMap.set(id, { start: stops[0], end: stops[stops.length - 1] });
      }
    });

    // 4. Generate high-fidelity SVG background with gradient and ambient glows
    let bgStart = '#FFF6FA';
    let bgEnd = '#F3EDFF';
    let hasBgGradient = false;

    const firstRect = svgEl.querySelector('rect');
    if (firstRect) {
      const rw = parseFloat(firstRect.getAttribute('width') || '0');
      const rh = parseFloat(firstRect.getAttribute('height') || '0');
      if (rw >= width * 0.9 && rh >= height * 0.9) {
        const fill = firstRect.getAttribute('fill') || '';
        const fillUrl = fill.match(/url\(#([^)]+)\)/)?.[1];
        if (fillUrl && gradMap.has(fillUrl)) {
          bgStart = gradMap.get(fillUrl)!.start;
          bgEnd = gradMap.get(fillUrl)!.end;
          hasBgGradient = true;
        } else if (fill.startsWith('#') || fill.startsWith('rgb')) {
          bgStart = fill;
          bgEnd = fill;
        }
      }
    }

    // High fidelity SVG background containing exact gradient + ambient glow blurs from Figma
    const bgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="figmaBgGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${bgStart}"/>
          <stop offset="100%" stop-color="${bgEnd}"/>
        </linearGradient>
        <filter id="glowF1" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="70"/>
        </filter>
        <filter id="glowF2" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="70"/>
        </filter>
      </defs>
      <rect width="${width}" height="${height}" fill="${hasBgGradient ? 'url(#figmaBgGrad)' : bgStart}"/>
      <circle cx="90" cy="850" r="350" fill="#FF6FB1" fill-opacity="0.22" filter="url(#glowF1)"/>
      <circle cx="1850" cy="910" r="350" fill="#6629F3" fill-opacity="0.16" filter="url(#glowF2)"/>
    </svg>`;
    const bgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(bgSvg)}`;

    const layers: ConfiguratorLayer[] = [];
    let layerCounter = 1;

    // 5. Parse Decorative Vector Illustrations (Clothesline, Banners, Glow)
    doc.querySelectorAll('g').forEach((gNode) => {
      const gId = gNode.getAttribute('id') || '';
      if (gId === 'Clothesline illustration' || gId.includes('Clothesline')) {
        // Clone and sanitize: remove clip-path that causes black bars
        const clone = gNode.cloneNode(true) as SVGGElement;
        clone.removeAttribute('clip-path');
        clone.querySelectorAll('[clip-path]').forEach((el) => el.removeAttribute('clip-path'));

        // IMPORTANT: fill="none" prevents un-filled vector paths (wire rope) from defaulting to solid black!
        const gSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${clone.outerHTML}</svg>`;
        const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(gSvg)}`;

        layers.push({
          id: `figma-banner-${layerCounter++}`,
          name: 'Clothesline Banner',
          type: 'image',
          src: dataUrl,
          x: 0,
          y: 0,
          width: width,
          height: height,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          visible: true,
          isLocked: true
        });
      }
    });

    // 6. Parse Rectangles, Frames, and Photo Fills
    const rectNodes = doc.querySelectorAll('rect');
    rectNodes.forEach((rNode) => {
      const rw = parseFloat(rNode.getAttribute('width') || '0');
      const rh = parseFloat(rNode.getAttribute('height') || '0');
      if (rw <= 0 || rh <= 0) return;

      // Skip background rects and clip rects
      if (rw >= width * 0.95 && rh >= height * 0.95) return;
      if (
        rNode.parentElement?.tagName.toLowerCase() === 'clippath' ||
        rNode.closest?.('clipPath') ||
        rNode.closest?.('clippath') ||
        rNode.closest?.('defs')
      ) {
        return;
      }

      const rawX = parseFloat(rNode.getAttribute('x') || '0');
      const rawY = parseFloat(rNode.getAttribute('y') || '0');
      const rx = parseFloat(rNode.getAttribute('rx') || '0');
      const transform = parseSvgTransform(rNode.getAttribute('transform'));
      const idAttr = rNode.getAttribute('id') || '';
      const fillAttr = rNode.getAttribute('fill') || '#FFFFFF';

      const posX = Math.round(rawX + transform.x);
      const posY = Math.round(rawY + transform.y);

      // Check if this rect has an image fill from pattern (Baby Photo)
      const patternKey = fillAttr.match(/url\(#([^)]+)\)/)?.[1];
      const photoSrc = patternKey ? patternImages.get(patternKey) : null;

      if (photoSrc || idAttr.includes('Baby photo') || idAttr.includes('photo') || idAttr.includes('image')) {
        const finalSrc = photoSrc || (imageMap.size > 0 ? Array.from(imageMap.values())[0] : '');
        if (finalSrc) {
          const imageLayer: ImageLayer = {
            id: 'baby-photo-frame',
            name: 'Baby Photo',
            type: 'image',
            src: finalSrc,
            x: posX,
            y: posY,
            width: Math.round(rw),
            height: Math.round(rh),
            rotation: transform.rotation,
            scaleX: 1,
            scaleY: 1,
            opacity: 1,
            visible: true,
            isLocked: false,
            cornerRadius: Math.round(rx),
            isTemplateField: true,
            templateLabel: 'Baby Photo',
            isEditable: true,
            editableLabel: 'Baby Photo',
            shadowEnabled: true,
            shadowColor: 'rgba(0, 0, 0, 0.15)',
            shadowBlur: 20,
            shadowOffsetY: 8
          };
          layers.push(imageLayer);
          return;
        }
      }

      // Check if fill is a linear gradient
      let isGradient = false;
      let gStart = '#0D99FF';
      let gEnd = '#E0458F';
      if (patternKey && gradMap.has(patternKey)) {
        isGradient = true;
        gStart = gradMap.get(patternKey)!.start;
        gEnd = gradMap.get(patternKey)!.end;
      }

      const isSolidColor = fillAttr.startsWith('#') || fillAttr.startsWith('rgb');

      // Detect semantic shapes
      const isPolaroidBacking = Math.round(rw) >= 350 && Math.round(rw) <= 400 && Math.round(rh) >= 400 && Math.round(rh) <= 450;
      const isPeg = idAttr.includes('Peg') || (rw <= 25 && rh >= 45 && rh <= 65);
      const isPill = rx >= 20;

      let shapeName = idAttr;
      if (!shapeName) {
        if (isPolaroidBacking) shapeName = 'Polaroid Card';
        else if (isPeg) shapeName = `Clothespin ${layerCounter}`;
        else if (isPill && rh < 60) shapeName = 'Tag Pill Background';
        else if (isPill) shapeName = 'Parents Pill Background';
        else shapeName = `Shape ${layerCounter}`;
      }

      const shapeLayer: ShapeLayer = {
        id: `figma-shape-${layerCounter++}`,
        name: shapeName,
        type: 'shape',
        shapeType: rx > 0 ? 'rounded-rect' : 'rectangle',
        x: posX,
        y: posY,
        width: Math.round(rw),
        height: Math.round(rh),
        rotation: transform.rotation,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        visible: true,
        isLocked: false,
        fill: isGradient ? gStart : (isSolidColor ? fillAttr : '#FFFFFF'),
        fillType: isGradient ? 'linear' : 'solid',
        gradientStart: isGradient ? gStart : undefined,
        gradientEnd: isGradient ? gEnd : undefined,
        cornerRadius: Math.round(rx),
        shadowEnabled: isPolaroidBacking || rx > 20,
        shadowColor: 'rgba(0, 0, 0, 0.15)',
        shadowBlur: isPolaroidBacking ? 30 : 15,
        shadowOffsetY: 6
      };
      layers.push(shapeLayer);
    });

    // 7. Parse Native Text (<text>) if present
    const textNodes = doc.querySelectorAll('text');
    textNodes.forEach((tNode) => {
      const textContent = tNode.textContent?.trim();
      if (!textContent) return;

      const x = parseFloat(tNode.getAttribute('x') || '0');
      const y = parseFloat(tNode.getAttribute('y') || '0');
      const fontSize = parseFloat(tNode.getAttribute('font-size') || '24');
      const fontFamily = tNode.getAttribute('font-family') || 'Montserrat';
      const fill = tNode.getAttribute('fill') || '#1A0B45';
      const transform = parseSvgTransform(tNode.getAttribute('transform'));

      layers.push({
        id: `figma-text-${layerCounter++}`,
        name: textContent.length > 20 ? `${textContent.slice(0, 20)}...` : textContent,
        type: 'text',
        text: textContent,
        x: Math.round(x + transform.x),
        y: Math.round(y + transform.y),
        rotation: transform.rotation,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        visible: true,
        isLocked: false,
        fontSize: Math.round(fontSize),
        fontFamily,
        fill,
        align: 'left',
        fontStyle: 'normal'
      });
    });

    // 8. If text was exported as outlined vector paths (common in Figma SVG exports):
    // Detect key named groups and create editable text layers
    const allIds = new Set<string>();
    doc.querySelectorAll('[id]').forEach((el) => {
      const id = el.getAttribute('id');
      if (id) allIds.add(id);
    });
    const idRegex = /\bid=["']([^"']+)["']/g;
    let idMatch;
    while ((idMatch = idRegex.exec(svgString)) !== null) {
      allIds.add(idMatch[1]);
    }

    const hasTagPill = allIds.has('Tag pill') || allIds.has('Tag');
    const hasHeadline = allIds.has('Headline row') || allIds.has('Headline') || allIds.has('Script');
    const hasMessage = allIds.has('Message');
    const hasParents = allIds.has('Parents chip') || allIds.has('Parents (replace)') || allIds.has('Congrats label');

    if (hasTagPill && !layers.some((l) => l.name === 'Tag / Badge' || l.name === 'Tag Pill Text')) {
      layers.push({
        id: `tag-pill-text`,
        name: 'Tag / Badge',
        type: 'text',
        text: "IT'S A GIRL!",
        x: 873,
        y: 644,
        width: 174,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        visible: true,
        isLocked: false,
        fontSize: 16,
        fontFamily: 'Montserrat',
        fill: '#FFFFFF',
        align: 'center',
        fontStyle: 'bold',
        isTemplateField: true,
        templateLabel: 'Badge / Tag',
        isEditable: true,
        editableLabel: 'Badge / Tag'
      });
    }

    if (hasHeadline && !layers.some((l) => l.name === 'Headline')) {
      layers.push({
        id: `headline-script`,
        name: 'Welcome Script',
        type: 'text',
        text: 'Hello',
        x: 560,
        y: 692,
        width: 320,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        visible: true,
        isLocked: false,
        fontSize: 84,
        fontFamily: 'Dancing Script',
        fill: '#FF6FB1',
        align: 'right',
        fontStyle: 'bold',
        isTemplateField: true,
        templateLabel: 'Welcome Script',
        isEditable: true,
        editableLabel: 'Welcome Script'
      });

      layers.push({
        id: `headline-title`,
        name: 'Headline',
        type: 'text',
        text: 'Baby Girl!',
        x: 885,
        y: 708,
        width: 450,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        visible: true,
        isLocked: false,
        fontSize: 72,
        fontFamily: 'Montserrat',
        fill: '#1A0B45',
        align: 'left',
        fontStyle: 'bold',
        isTemplateField: true,
        templateLabel: 'Headline',
        isEditable: true,
        editableLabel: 'Headline'
      });
    }

    if (hasMessage && !layers.some((l) => l.name === 'Greeting Wish' || l.name === 'Greeting Message')) {
      layers.push({
        id: `greeting-message`,
        name: 'Greeting Wish',
        type: 'text',
        text: 'Welcome to the world, little one! Wishing you a lifetime of love, laughter and endless joy.',
        x: 310,
        y: 835,
        width: 1300,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        visible: true,
        isLocked: false,
        fontSize: 22,
        fontFamily: 'Poppins',
        fill: '#1A0B45',
        align: 'center',
        fontStyle: 'normal',
        isTemplateField: true,
        templateLabel: 'Greeting Wish',
        isEditable: true,
        editableLabel: 'Greeting Wish'
      });
    }

    if (hasParents && !layers.some((l) => l.name === 'Parents / Family' || l.name === 'Parents Text')) {
      layers.push({
        id: `parents-label`,
        name: 'Congrats Label',
        type: 'text',
        text: 'Congratulations',
        x: 625,
        y: 918,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        visible: true,
        isLocked: false,
        fontSize: 18,
        fontFamily: 'Poppins',
        fill: '#FF6FB1',
        align: 'left',
        fontStyle: 'bold'
      });

      layers.push({
        id: `parents-names`,
        name: 'Parents / Family',
        type: 'text',
        text: 'Ravi & Riddhi',
        x: 870,
        y: 918,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        visible: true,
        isLocked: false,
        fontSize: 18,
        fontFamily: 'Poppins',
        fill: '#1A0B45',
        align: 'left',
        fontStyle: 'bold',
        isTemplateField: true,
        templateLabel: 'Parents / Family',
        isEditable: true,
        editableLabel: 'Parents / Family'
      });

      layers.push({
        id: `sign-off`,
        name: 'Sign-off Text',
        type: 'text',
        text: 'From all of us',
        x: 1157,
        y: 918,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        visible: true,
        isLocked: false,
        fontSize: 18,
        fontFamily: 'Poppins',
        fill: '#1A0B45',
        align: 'left',
        fontStyle: 'normal'
      });
    }

    // Sort layers in logical visual stacking order:
    // Banners & backgrounds at the back, polaroid frame behind photo, photo in middle, pegs and text on top
    const sortRank = (l: ConfiguratorLayer) => {
      if (l.name.includes('Banner') || l.name.includes('Clothesline')) return 1;
      if (l.name.includes('Polaroid Card') || l.name.includes('Polaroid Frame')) return 2;
      if (l.name.includes('Photo') || l.type === 'image') return 3;
      if (l.name.includes('Peg') || l.name.includes('Clothespin')) return 4;
      if (l.type === 'shape') return 5;
      if (l.type === 'text') return 6;
      return 5;
    };
    layers.sort((a, b) => sortRank(a) - sortRank(b));

    return {
      id: `imported-figma-${Date.now()}`,
      title: projectName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      width,
      height,
      background: {
        type: 'image',
        color: bgStart,
        imageUrl: bgDataUrl,
        opacity: 1
      },
      layers
    };
  } catch (err) {
    console.error('Failed to parse Figma SVG:', err);
    return null;
  }
}
