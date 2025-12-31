export const DEFAULT_MAX_SIZE = 920;
export const DEFAULT_MASK_SIZE = 920;

export type MaskerSettings = {
  grayscale: boolean;
  limitResolution: boolean;
  maxWidth: number;
  maxHeight: number;
  maskStrength: number;
};

export type ImageMeta = {
  width: number;
  height: number;
};

export type ImageDataLike = {
  data: Uint8ClampedArray;
  width: number;
  height: number;
};

export type MaskedImageResult = {
  dataUrl: string;
  width: number;
  height: number;
  maskMeta: ImageMeta;
  fittedMeta: ImageMeta;
};

export function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function computeLuminance(r: number, g: number, b: number) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function maskValue(original: number, strength: number) {
  const adjusted = 1 - (1 - original) * (strength / 100);
  return clamp(adjusted, 0, 1);
}

export function fitIntoBox(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
) {
  const scale = Math.min(
    targetWidth / sourceWidth,
    targetHeight / sourceHeight,
  );
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const x = Math.round((targetWidth - width) / 2);
  const y = Math.round((targetHeight - height) / 2);
  return { width, height, x, y };
}

export function coverIntoBox(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
) {
  const scale = Math.max(
    targetWidth / sourceWidth,
    targetHeight / sourceHeight,
  );
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const x = Math.round((targetWidth - width) / 2);
  const y = Math.round((targetHeight - height) / 2);
  return { width, height, x, y };
}

export function applyMaskToImageData(
  baseData: ImageDataLike,
  maskData: ImageDataLike,
  options: Pick<MaskerSettings, "grayscale" | "maskStrength">,
) {
  if (
    baseData.width !== maskData.width ||
    baseData.height !== maskData.height
  ) {
    throw new Error("画像サイズが一致していません。");
  }

  const mapInterval = (
    value: number,
    srcMin: number,
    srcMax: number,
    dstMin: number,
    dstMax: number,
  ) => {
    const scale =
      srcMax - srcMin === 0 ? 0 : (dstMax - dstMin) / (srcMax - srcMin);
    return clamp((value - srcMin) * scale + dstMin, dstMin, dstMax);
  };

  let maskMin = 1;
  let maskMax = 0;
  let baseMin = 1;
  let baseMax = 0;
  for (let i = 0; i < baseData.data.length; i += 4) {
    const r = baseData.data[i] / 255;
    const g = baseData.data[i + 1] / 255;
    const b = baseData.data[i + 2] / 255;
    const maskR = maskData.data[i] / 255;
    const maskG = maskData.data[i + 1] / 255;
    const maskB = maskData.data[i + 2] / 255;

    baseMin = Math.min(baseMin, r, g, b);
    baseMax = Math.max(baseMax, r, g, b);
    maskMin = Math.min(maskMin, maskR, maskG, maskB);
    maskMax = Math.max(maskMax, maskR, maskG, maskB);
  }

  const output = new Uint8ClampedArray(baseData.data.length);
  for (let i = 0; i < baseData.data.length; i += 4) {
    const r = baseData.data[i] / 255;
    const g = baseData.data[i + 1] / 255;
    const b = baseData.data[i + 2] / 255;
    const maskR = maskData.data[i] / 255;
    const maskG = maskData.data[i + 1] / 255;
    const maskB = maskData.data[i + 2] / 255;
    const balance = clamp(1 - options.maskStrength / 100, 0, 1);
    let wR = mapInterval(maskR, maskMin, maskMax, balance, 1);
    let wG = mapInterval(maskG, maskMin, maskMax, balance, 1);
    let wB = mapInterval(maskB, maskMin, maskMax, balance, 1);
    let bR = mapInterval(r, baseMin, baseMax, 0, balance);
    let bG = mapInterval(g, baseMin, baseMax, 0, balance);
    let bB = mapInterval(b, baseMin, baseMax, 0, balance);

    if (options.grayscale) {
      const wMean = (wR + wG + wB) / 3;
      const bMean = (bR + bG + bB) / 3;
      wR = wMean;
      wG = wMean;
      wB = wMean;
      bR = bMean;
      bG = bMean;
      bB = bMean;
    }

    const diff = (wR - bR + wG - bG + wB - bB) / 3;
    const alpha = clamp(1 - diff, 0, 1);
    const alphaSafe = Math.max(alpha, 1e-6);

    let outR = bR / alphaSafe;
    let outG = bG / alphaSafe;
    let outB = bB / alphaSafe;

    if (alpha < 1e-3) {
      outR = wR;
      outG = wG;
      outB = wB;
    }

    output[i] = Math.round(clamp(outR, 0, 1) * 255);
    output[i + 1] = Math.round(clamp(outG, 0, 1) * 255);
    output[i + 2] = Math.round(clamp(outB, 0, 1) * 255);
    output[i + 3] = Math.round(alpha * 255);
  }

  return {
    data: output,
    width: baseData.width,
    height: baseData.height,
  } satisfies ImageDataLike;
}

export async function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("画像の読み込みに失敗しました。"));
    image.src = dataUrl;
  });
}

export function resizeCanvas(
  source: HTMLCanvasElement,
  maxWidth: number,
  maxHeight: number,
) {
  const scale = Math.min(
    1,
    maxWidth / source.width,
    maxHeight / source.height,
  );
  if (scale >= 1) {
    return source;
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return source;
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export async function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("ファイルの読み込みに失敗しました。"));
      }
    };
    reader.onerror = () => reject(new Error("ファイルの読み込みに失敗しました。"));
    reader.readAsDataURL(file);
  });
}

export function createDefaultMask(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return "";
  }

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#fbfbf5");
  gradient.addColorStop(1, "#f6efe4");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = "#d3c7b8";
  ctx.lineWidth = 2;
  const step = Math.max(40, Math.floor(Math.min(width, height) / 18));
  for (let x = -width; x < width * 2; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x - height, height);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = "#f2e9dc";
  const inset = Math.max(8, Math.round(width * 0.08));
  const innerWidth = Math.max(1, width - inset * 2);
  const innerHeight = Math.max(1, height - inset * 2);
  ctx.fillRect(inset, inset, innerWidth, innerHeight);

  ctx.fillStyle = "#201a14";
  ctx.font = `700 ${Math.floor(Math.min(width, height) / 11)}px "Space Grotesk", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
  ctx.shadowBlur = Math.max(4, Math.floor(Math.min(width, height) / 90));
  ctx.shadowOffsetY = Math.max(2, Math.floor(Math.min(width, height) / 120));
  ctx.fillText("TAP TO REVEAL", width / 2, height / 2 - height * 0.06);

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.font = `600 ${Math.floor(Math.min(width, height) / 11)}px "Space Grotesk", sans-serif`;
  ctx.fillStyle = "#3b2f24";
  ctx.fillText("タップして表示", width / 2, height / 2 + height * 0.08);

  return canvas.toDataURL("image/png");
}

export async function buildMaskedImage(options: {
  sourceUrl: string;
  maskUrl: string;
  settings: MaskerSettings;
}): Promise<MaskedImageResult> {
  const [sourceImage, maskImage] = await Promise.all([
    loadImage(options.sourceUrl),
    loadImage(options.maskUrl),
  ]);

  const sourceWidth = sourceImage.naturalWidth || sourceImage.width;
  const sourceHeight = sourceImage.naturalHeight || sourceImage.height;
  const maskWidth = maskImage.naturalWidth || maskImage.width;
  const maskHeight = maskImage.naturalHeight || maskImage.height;

  const baseCanvas = document.createElement("canvas");
  baseCanvas.width = sourceWidth;
  baseCanvas.height = sourceHeight;
  const baseCtx = baseCanvas.getContext("2d");
  if (!baseCtx) {
    throw new Error("キャンバスの初期化に失敗しました。");
  }

  baseCtx.clearRect(0, 0, sourceWidth, sourceHeight);
  baseCtx.drawImage(sourceImage, 0, 0, sourceWidth, sourceHeight);

  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = sourceWidth;
  maskCanvas.height = sourceHeight;
  const maskCtx = maskCanvas.getContext("2d");
  if (!maskCtx) {
    throw new Error("キャンバスの初期化に失敗しました。");
  }
  const maskCover = coverIntoBox(maskWidth, maskHeight, sourceWidth, sourceHeight);
  maskCtx.drawImage(
    maskImage,
    maskCover.x,
    maskCover.y,
    maskCover.width,
    maskCover.height,
  );

  const baseData = baseCtx.getImageData(0, 0, sourceWidth, sourceHeight);
  const maskData = maskCtx.getImageData(0, 0, sourceWidth, sourceHeight);
  const output = applyMaskToImageData(
    { data: baseData.data, width: sourceWidth, height: sourceHeight },
    { data: maskData.data, width: sourceWidth, height: sourceHeight },
    {
      grayscale: options.settings.grayscale,
      maskStrength: options.settings.maskStrength,
    },
  );

  const outputImageData = baseCtx.createImageData(sourceWidth, sourceHeight);
  outputImageData.data.set(output.data);
  baseCtx.putImageData(outputImageData, 0, 0);

  const finalCanvas = options.settings.limitResolution
    ? resizeCanvas(
        baseCanvas,
        options.settings.maxWidth,
        options.settings.maxHeight,
      )
    : baseCanvas;

  return {
    dataUrl: finalCanvas.toDataURL("image/png"),
    width: finalCanvas.width,
    height: finalCanvas.height,
    maskMeta: { width: maskWidth, height: maskHeight },
    fittedMeta: { width: sourceWidth, height: sourceHeight },
  };
}
