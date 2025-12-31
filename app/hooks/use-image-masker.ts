import { useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_MASK_SIZE,
  DEFAULT_MAX_SIZE,
  buildMaskedImage,
  createDefaultMask,
  loadImage,
  toDataUrl,
  type ImageMeta,
  type MaskerSettings,
} from "../lib/image-masker";

const STORAGE_KEY = "cloakpic:settings";

type Settings = MaskerSettings & {
  maskDataUrl: string | null;
};

const defaultSettings: Settings = {
  grayscale: true,
  limitResolution: true,
  maxWidth: DEFAULT_MAX_SIZE,
  maxHeight: DEFAULT_MAX_SIZE,
  maskStrength: 25,
  maskDataUrl: null,
};

export function useImageMasker() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [defaultMaskUrl, setDefaultMaskUrl] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [sourceVersion, setSourceVersion] = useState(0);
  const [sourceMeta, setSourceMeta] = useState<ImageMeta | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultMeta, setResultMeta] = useState<ImageMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastRunKey = useRef<string | null>(null);
  const runIdRef = useRef(0);
  const workerRef = useRef<Worker | null>(null);

  const activeMaskUrl = useMemo(() => {
    return settings.maskDataUrl || defaultMaskUrl;
  }, [settings.maskDataUrl, defaultMaskUrl]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const worker = new Worker(new URL("../lib/masker-worker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<Settings>;
        setSettings({
          ...defaultSettings,
          ...parsed,
        });
      } catch (parseError) {
        console.error(parseError);
      }
    }

    setDefaultMaskUrl(createDefaultMask(DEFAULT_MASK_SIZE, DEFAULT_MASK_SIZE));

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    let cancelled = false;
    if (!sourceUrl) {
      setSourceMeta(null);
      setDefaultMaskUrl(createDefaultMask(DEFAULT_MASK_SIZE, DEFAULT_MASK_SIZE));
      return;
    }
    loadImage(sourceUrl)
      .then((image) => {
        if (cancelled) return;
        const width = image.naturalWidth || image.width;
        const height = image.naturalHeight || image.height;
        setSourceMeta({ width, height });
        const scale = Math.min(1, DEFAULT_MASK_SIZE / Math.max(width, height));
        const maskWidth = Math.max(1, Math.round(width * scale));
        const maskHeight = Math.max(1, Math.round(height * scale));
        setDefaultMaskUrl(createDefaultMask(maskWidth, maskHeight));
      })
      .catch(() => {
        if (cancelled) return;
        setSourceMeta(null);
        setDefaultMaskUrl(createDefaultMask(DEFAULT_MASK_SIZE, DEFAULT_MASK_SIZE));
      });

    return () => {
      cancelled = true;
    };
  }, [sourceUrl]);

  const handleSourceFile = async (file: File) => {
    setError(null);
    setResultUrl(null);
    setResultMeta(null);
    lastRunKey.current = null;
    try {
      const dataUrl = await toDataUrl(file);
      setSourceUrl(dataUrl);
      setSourceVersion((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "読み込みに失敗しました。");
    }
  };

  const handleMaskFile = async (file: File) => {
    setError(null);
    setResultUrl(null);
    setResultMeta(null);
    lastRunKey.current = null;
    try {
      const dataUrl = await toDataUrl(file);
      setSettings((prev) => ({ ...prev, maskDataUrl: dataUrl }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "読み込みに失敗しました。");
    }
  };

  const handleResetMask = () => {
    setSettings((prev) => ({ ...prev, maskDataUrl: null }));
  };

  useEffect(() => {
    if (!sourceUrl || !activeMaskUrl) {
      setResultUrl(null);
      setResultMeta(null);
      lastRunKey.current = null;
      return;
    }

    const { maskDataUrl: _maskDataUrl, ...maskerSettings } = settings;
    const runKey = JSON.stringify({
      sourceUrl,
      sourceVersion,
      activeMaskUrl,
      settings: maskerSettings,
    });
    if (runKey === lastRunKey.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      const runId = ++runIdRef.current;
      setError(null);

      const worker = workerRef.current;
      const runInWorker =
        worker &&
        new Promise<Awaited<ReturnType<typeof buildMaskedImage>>>((resolve, reject) => {
          const handleMessage = (event: MessageEvent) => {
            if (!event.data || event.data.runId !== runId) {
              return;
            }
            cleanup();
            if (event.data.error) {
              reject(new Error(event.data.error));
            } else {
              resolve(event.data.result);
            }
          };
          const handleError = (workerError: ErrorEvent) => {
            cleanup();
            reject(workerError.error ?? new Error(workerError.message));
          };
          const cleanup = () => {
            worker.removeEventListener("message", handleMessage);
            worker.removeEventListener("error", handleError);
          };

          worker.addEventListener("message", handleMessage);
          worker.addEventListener("error", handleError);
          worker.postMessage({
            runId,
            sourceUrl,
            maskUrl: activeMaskUrl,
            settings: maskerSettings,
          });
        });

      (runInWorker ??
        buildMaskedImage({
          sourceUrl,
          maskUrl: activeMaskUrl,
          settings: maskerSettings,
        }))
        .then((result) => {
          if (runId !== runIdRef.current) return;
          lastRunKey.current = runKey;
          setResultUrl(result.dataUrl);
          setResultMeta({ width: result.width, height: result.height });
        })
        .catch((err) => {
          if (runId !== runIdRef.current) return;
          setError(err instanceof Error ? err.message : "変換に失敗しました。");
        });
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [activeMaskUrl, settings, sourceUrl, sourceVersion]);

  return {
    settings,
    setSettings,
    defaultSettings,
    activeMaskUrl,
    sourceMeta,
    sourceUrl,
    resultUrl,
    resultMeta,
    error,
    handleSourceFile,
    handleMaskFile,
    handleResetMask,
  };
}

export type { Settings };
