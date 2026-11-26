import { ConfiguratorProject, TextLayer, ImageLayer, ShapeLayer } from './types';
import { generateProjectSVG } from './svgExporter';

/**
 * Direct Canvas Fallback Renderer: Draws project layers directly onto an HTML5 canvas.
 */
export const renderProjectDirectCanvas = async (project: ConfiguratorProject): Promise<string> => {
  const canvas = document.createElement('canvas');
  canvas.width = project.width || 1920;
  canvas.height = project.height || 1080;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2d canvas context');

  // Background
  if (project.background.color) {
    ctx.fillStyle = project.background.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Load and draw background image if any
  if (project.background.imageUrl) {
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.globalAlpha = project.background.opacity ?? 1;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
        resolve();
      };
      img.onerror = () => resolve();
      img.src = project.background.imageUrl!;
    });
  }

  // Layers
  for (const layer of project.layers) {
    if (layer.visible === false) continue;
    ctx.save();
    ctx.globalAlpha = layer.opacity ?? 1;

    // Apply rotation
    if (layer.rotation) {
      const cx = layer.x + ((layer as any).width || 0) / 2;
      const cy = layer.y + ((layer as any).height || 0) / 2;
      ctx.translate(cx, cy);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.translate(-cx, -cy);
    }

    if (layer.type === 'text') {
      const tl = layer as TextLayer;
      const fontStyle = tl.fontStyle || 'normal';
      const isBold = fontStyle.includes('bold');
      const isItalic = fontStyle.includes('italic');
      ctx.font = `${isItalic ? 'italic ' : ''}${isBold ? 'bold ' : ''}${tl.fontSize}px "${tl.fontFamily || 'Poppins'}", system-ui, sans-serif`;
      ctx.textAlign = tl.align || 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = tl.fill || '#FFFFFF';
      ctx.fillText(tl.text || '', tl.x, tl.y);
    } else if (layer.type === 'image') {
      const il = layer as ImageLayer;
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const w = il.width * (il.scaleX || 1);
          const h = il.height * (il.scaleY || 1);
          const bw = il.borderWidth || 0;
          if (bw > 0) {
            ctx.fillStyle = il.borderColor || '#FFFFFF';
            ctx.fillRect(il.x - bw, il.y - bw, w + bw * 2, h + bw * 2);
          }
          ctx.drawImage(img, il.x, il.y, w, h);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = il.src;
      });
    } else if (layer.type === 'shape') {
      const sl = layer as ShapeLayer;
      const w = sl.width * (sl.scaleX || 1);
      const h = sl.height * (sl.scaleY || 1);
      ctx.fillStyle = sl.fill || '#0D99FF';
      if (sl.shapeType === 'circle') {
        ctx.beginPath();
        ctx.ellipse(sl.x + w / 2, sl.y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(sl.x, sl.y, w, h);
      }
    }
    ctx.restore();
  }

  return canvas.toDataURL('image/png');
};

/**
 * Render any ConfiguratorProject to a high-resolution PNG data URL.
 * Uses SVG rasterization with automated fallback to canvas rendering.
 */
export const renderProjectToDataUrl = async (project: ConfiguratorProject): Promise<string> => {
  try {
    const svgString = generateProjectSVG(project);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = project.width || 1920;
        canvas.height = project.height || 1080;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('No context'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };
      img.src = url;
    });
    return dataUrl;
  } catch (err) {
    return renderProjectDirectCanvas(project);
  }
};
