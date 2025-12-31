import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import jpeg from "jpeg-js";
import {
  applyMaskToImageData,
  fitIntoBox,
  type ImageDataLike,
} from "../app/lib/image-masker";

const testDataDir = join(process.cwd(), "test_data");

function loadJpeg(path: string): ImageDataLike {
  const buffer = readFileSync(path);
  const decoded = jpeg.decode(buffer, { useTArray: true });
  return {
    width: decoded.width,
    height: decoded.height,
    data: new Uint8ClampedArray(decoded.data.buffer),
  };
}

function fitImageIntoCanvas(
  source: ImageDataLike,
  targetWidth: number,
  targetHeight: number,
): ImageDataLike {
  const output = new Uint8ClampedArray(targetWidth * targetHeight * 4);
  const fit = fitIntoBox(
    source.width,
    source.height,
    targetWidth,
    targetHeight,
  );

  for (let y = 0; y < fit.height; y += 1) {
    const srcY = Math.min(
      source.height - 1,
      Math.round(((y + 0.5) / fit.height) * source.height - 0.5),
    );
    for (let x = 0; x < fit.width; x += 1) {
      const srcX = Math.min(
        source.width - 1,
        Math.round(((x + 0.5) / fit.width) * source.width - 0.5),
      );
      const srcIndex = (srcY * source.width + srcX) * 4;
      const destX = x + fit.x;
      const destY = y + fit.y;
      const destIndex = (destY * targetWidth + destX) * 4;
      output[destIndex] = source.data[srcIndex];
      output[destIndex + 1] = source.data[srcIndex + 1];
      output[destIndex + 2] = source.data[srcIndex + 2];
      output[destIndex + 3] = source.data[srcIndex + 3];
    }
  }

  return {
    width: targetWidth,
    height: targetHeight,
    data: output,
  };
}

function averageAlpha(data: Uint8ClampedArray) {
  let sum = 0;
  let count = 0;
  for (let i = 3; i < data.length; i += 4) {
    sum += data[i];
    count += 1;
  }
  return count === 0 ? 0 : sum / count;
}

const sourceImage = loadJpeg(join(testDataDir, "img_sample.jpg"));
const maskImage = loadJpeg(join(testDataDir, "mask_sample.jpg"));
const fittedSource = fitImageIntoCanvas(
  sourceImage,
  maskImage.width,
  maskImage.height,
);

describe("image-masker core", () => {
  it("fitIntoBox keeps aspect ratio inside the mask", () => {
    const fit = fitIntoBox(
      sourceImage.width,
      sourceImage.height,
      maskImage.width,
      maskImage.height,
    );
    expect(fit.width).toBeLessThanOrEqual(maskImage.width);
    expect(fit.height).toBeLessThanOrEqual(maskImage.height);
    const sourceRatio = sourceImage.width / sourceImage.height;
    const fitRatio = fit.width / fit.height;
    expect(fitRatio).toBeCloseTo(sourceRatio, 2);
  });

  it("grayscale option keeps RGB channels aligned", () => {
    const output = applyMaskToImageData(fittedSource, maskImage, {
      grayscale: true,
      maskStrength: 85,
    });

    let checked = 0;
    let mismatch = false;
    for (let i = 0; i < output.data.length; i += 4) {
      if (output.data[i + 3] === 0) {
        continue;
      }
      checked += 1;
      if (
        output.data[i] !== output.data[i + 1] ||
        output.data[i + 1] !== output.data[i + 2]
      ) {
        mismatch = true;
        break;
      }
      if (checked > 5000) {
        break;
      }
    }

    expect(checked).toBeGreaterThan(0);
    expect(mismatch).toBe(false);
  });

  it("maskStrength controls alpha intensity", () => {
    const lowStrength = applyMaskToImageData(fittedSource, maskImage, {
      grayscale: true,
      maskStrength: 60,
    });
    const highStrength = applyMaskToImageData(fittedSource, maskImage, {
      grayscale: true,
      maskStrength: 100,
    });

    const lowAvg = averageAlpha(lowStrength.data);
    const highAvg = averageAlpha(highStrength.data);

    expect(highAvg).toBeGreaterThanOrEqual(lowAvg);
  });
});
