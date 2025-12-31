/// <reference lib="webworker" />
import { applyMaskToImageData, coverIntoBox, type MaskerSettings } from "./image-masker";

type WorkerRequest = {
  runId: number;
  sourceUrl: string;
  maskUrl: string;
  settings: MaskerSettings;
};

type WorkerResponse =
  | {
      runId: number;
      result: {
        dataUrl: string;
        width: number;
        height: number;
        maskMeta: { width: number; height: number };
        fittedMeta: { width: number; height: number };
      };
    }
  | { runId: number; error: string };

async function loadBitmap(dataUrl: string) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return createImageBitmap(blob);
}

function resizeCanvas(
  source: OffscreenCanvas,
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
  const canvas = new OffscreenCanvas(
    Math.max(1, Math.round(source.width * scale)),
    Math.max(1, Math.round(source.height * scale)),
  );
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return source;
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

async function toDataUrl(canvas: OffscreenCanvas) {
  const blob = await canvas.convertToBlob({ type: "image/png" });
  const reader = new FileReaderSync();
  return reader.readAsDataURL(blob);
}

const worker = self as DedicatedWorkerGlobalScope;

worker.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { runId, sourceUrl, maskUrl, settings } = event.data;

  try {
    const [sourceImage, maskImage] = await Promise.all([
      loadBitmap(sourceUrl),
      loadBitmap(maskUrl),
    ]);

    const sourceWidth = sourceImage.width;
    const sourceHeight = sourceImage.height;
    const maskWidth = maskImage.width;
    const maskHeight = maskImage.height;

    const baseCanvas = new OffscreenCanvas(sourceWidth, sourceHeight);
    const baseCtx = baseCanvas.getContext("2d");
    if (!baseCtx) {
      throw new Error("キャンバスの初期化に失敗しました。");
    }
    baseCtx.clearRect(0, 0, sourceWidth, sourceHeight);
    baseCtx.drawImage(sourceImage, 0, 0, sourceWidth, sourceHeight);

    const maskCanvas = new OffscreenCanvas(sourceWidth, sourceHeight);
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
        grayscale: settings.grayscale,
        maskStrength: settings.maskStrength,
      },
    );

    const outputImageData = baseCtx.createImageData(sourceWidth, sourceHeight);
    outputImageData.data.set(output.data);
    baseCtx.putImageData(outputImageData, 0, 0);

    const finalCanvas = settings.limitResolution
      ? resizeCanvas(baseCanvas, settings.maxWidth, settings.maxHeight)
      : baseCanvas;

    const dataUrl = await toDataUrl(finalCanvas);

    sourceImage.close();
    maskImage.close();

    const response: WorkerResponse = {
      runId,
      result: {
        dataUrl,
        width: finalCanvas.width,
        height: finalCanvas.height,
        maskMeta: { width: maskWidth, height: maskHeight },
        fittedMeta: { width: sourceWidth, height: sourceHeight },
      },
    };
    worker.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      runId,
      error: error instanceof Error ? error.message : "変換に失敗しました。",
    };
    worker.postMessage(response);
  }
};
