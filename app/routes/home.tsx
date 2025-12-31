import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import type { Route } from "./+types/home";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  FormControlLabel,
  IconButton,
  Slider,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
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

const STORAGE_KEY = "tw-img-masker:settings";

type Settings = MaskerSettings & {
  maskDataUrl: string | null;
};

const defaultSettings: Settings = {
  grayscale: true,
  limitResolution: true,
  maxWidth: DEFAULT_MAX_SIZE,
  maxHeight: DEFAULT_MAX_SIZE,
  maskStrength: 30,
  maskDataUrl: null,
};

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Tw Img Masker" },
    {
      name: "description",
      content:
        "Twitter/X向けに、白背景と黒背景で見え方が変わる画像を作るローカルツール。",
    },
  ];
}

export default function Home() {
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
  const sourceDropInputRef = useRef<HTMLInputElement | null>(null);
  const maskDropInputRef = useRef<HTMLInputElement | null>(null);

  const activeMaskUrl = useMemo(() => {
    return settings.maskDataUrl || defaultMaskUrl;
  }, [settings.maskDataUrl, defaultMaskUrl]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

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
        const scale = Math.min(
          1,
          DEFAULT_MASK_SIZE / Math.max(width, height),
        );
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

  const handleSourceUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await handleSourceFile(file);
  };

  const handleMaskUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await handleMaskFile(file);
  };

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
      buildMaskedImage({
        sourceUrl,
        maskUrl: activeMaskUrl,
        settings: maskerSettings,
      })
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

  const handleSourceDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    await handleSourceFile(file);
  };

  const handleMaskDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    await handleMaskFile(file);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        py: { xs: 4, md: 6 },
        background:
          "radial-gradient(circle at top, rgba(250, 204, 21, 0.2), transparent 60%), radial-gradient(circle at 15% 60%, rgba(14, 116, 144, 0.2), transparent 55%), linear-gradient(140deg, #f8fafc 0%, #fef3c7 55%, #e0f2fe 100%)",
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={4}>
          <Card elevation={6} sx={{ borderRadius: 4 }}>
            <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                alignItems={{ xs: "flex-start", md: "center" }}
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Tw Img Masker
                  </Typography>
                  <Typography variant="h3">Tap to reveal image maker</Typography>
                </Box>
                <Box
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: 999,
                    bgcolor: "rgba(15, 23, 42, 0.08)",
                    color: "text.primary",
                    fontWeight: 600,
                    fontSize: 12,
                    letterSpacing: 0.6,
                  }}
                >
                  Client-only / Local storage
                </Box>
              </Stack>
              <Typography variant="body2" color="text.secondary" maxWidth={720}>
                白背景と黒背景の見え方の差を使って、タイムラインではマスクだけ、画像ビューアでは本体が見えるPNGを作ります。
                処理はすべてブラウザ内で完結します。
              </Typography>
            </CardContent>
          </Card>

          <Stack spacing={4}>
            <Stack
              direction={{ xs: "column", lg: "row" }}
              spacing={4}
              sx={{ alignItems: "stretch" }}
            >
              <Stack spacing={4} flex={0.9} sx={{ order: { xs: 1, lg: 1 } }}>
                <Card elevation={4} sx={{ borderRadius: 4 }}>
                  <CardHeader title="Step 1" subheader="マスクしたい画像を選択します。PNG/JPGに対応しています。" />
                  <CardContent>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<UploadFileRoundedIcon />}
                        component="label"
                        sx={{ borderRadius: 999 }}
                      >
                        画像をアップロード
                        <input hidden type="file" accept="image/*" onChange={handleSourceUpload} />
                      </Button>
                      {sourceMeta && (
                        <Typography variant="caption" color="text.secondary">
                          {sourceMeta.width} × {sourceMeta.height}px
                        </Typography>
                      )}
                    </Stack>
                    <Box
                      onDrop={handleSourceDrop}
                      onDragOver={(event) => event.preventDefault()}
                      onClick={() => sourceDropInputRef.current?.click()}
                      sx={{
                        mt: 2,
                        borderRadius: 3,
                        border: "1px dashed",
                        borderColor: "divider",
                        bgcolor: "rgba(148, 163, 184, 0.08)",
                        height: 260,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        ref={sourceDropInputRef}
                        hidden
                        type="file"
                        accept="image/*"
                        onChange={handleSourceUpload}
                      />
                      {sourceUrl ? (
                        <Box
                          component="img"
                          src={sourceUrl}
                          alt="アップロード画像"
                          sx={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
                        />
                      ) : (
                        <Stack spacing={1} alignItems="center" color="text.secondary">
                          <ImageRoundedIcon />
                          <Typography variant="body2">
                            画像をドラッグ＆ドロップ、またはクリックで選択。
                          </Typography>
                        </Stack>
                      )}
                    </Box>
                  </CardContent>
                </Card>

                <Card elevation={4} sx={{ borderRadius: 4 }}>
                  <CardHeader title="Step 2" subheader="マスク画像を設定する。" />
                  <CardContent>
                    {error && (
                      <Box
                        sx={{
                          mt: 2,
                          p: 2,
                          borderRadius: 2,
                          bgcolor: "rgba(239, 68, 68, 0.1)",
                          color: "#b91c1c",
                          fontSize: 14,
                        }}
                      >
                        {error}
                      </Box>
                    )}
                    <Stack spacing={2}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2}
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Typography variant="caption" color="text.secondary">
                          設定しなければデフォルトのマスクが使用されます。
                          <br />
                          明るいマスクほど、白背景での隠れ方が強くなります。
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Button
                            variant="outlined"
                            size="small"
                            component="label"
                            startIcon={<UploadFileRoundedIcon />}
                            sx={{ borderRadius: 999 }}
                          >
                            変更
                            <input hidden type="file" accept="image/*" onChange={handleMaskUpload} />
                          </Button>
                          <IconButton color="primary" onClick={handleResetMask}>
                            <RestartAltRoundedIcon />
                          </IconButton>
                        </Stack>
                      </Stack>
                      <Box
                        onDrop={handleMaskDrop}
                        onDragOver={(event) => event.preventDefault()}
                        onClick={() => maskDropInputRef.current?.click()}
                        sx={{
                          borderRadius: 3,
                          border: "1px dashed",
                          borderColor: "divider",
                          bgcolor: "rgba(148, 163, 184, 0.08)",
                          height: 180,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          ref={maskDropInputRef}
                          hidden
                          type="file"
                          accept="image/*"
                          onChange={handleMaskUpload}
                        />
                        {activeMaskUrl ? (
                          <Box
                            component="img"
                            src={activeMaskUrl}
                            alt="マスク画像"
                            sx={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            マスク画像を準備中です。
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>

              </Stack>

              <Stack spacing={4} flex={1.1} sx={{ order: { xs: 2, lg: 2 } }}>
                <Card elevation={4} sx={{ borderRadius: 4 }}>
                  <CardHeader title="Preview" />
                  <CardContent>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                      <Box
                        sx={{
                          flex: 1,
                          borderRadius: 3,
                          border: "1px solid",
                          borderColor: "divider",
                          bgcolor: "#fff",
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          sx={{
                            px: 2,
                            py: 1,
                            borderBottom: "1px solid",
                            borderColor: "divider",
                            fontSize: 12,
                            fontWeight: 600,
                            color: "text.secondary",
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span>White</span>
                          <span>Timeline</span>
                        </Box>
                        <Box
                          sx={{
                            height: 240,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {resultUrl ? (
                            <Box
                              component="img"
                              src={resultUrl}
                              alt="白背景プレビュー"
                              sx={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
                            />
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              変換後に表示されます。
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <Box
                        sx={{
                          flex: 1,
                          borderRadius: 3,
                          border: "1px solid",
                          borderColor: "#0f172a",
                          bgcolor: "#0f172a",
                          color: "#e2e8f0",
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          sx={{
                            px: 2,
                            py: 1,
                            borderBottom: "1px solid",
                            borderColor: "rgba(148, 163, 184, 0.3)",
                            fontSize: 12,
                            fontWeight: 600,
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span>Black</span>
                          <span>Viewer</span>
                        </Box>
                        <Box
                          sx={{
                            height: 240,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {resultUrl ? (
                            <Box
                              component="img"
                              src={resultUrl}
                              alt="黒背景プレビュー"
                              sx={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
                            />
                          ) : (
                            <Typography variant="caption" color="rgba(226, 232, 240, 0.6)">
                              変換後に表示されます。
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Stack>
                    <Box
                      sx={{
                        mt: 2,
                        borderRadius: 3,
                        border: "1px solid",
                        borderColor: "divider",
                        bgcolor: "rgba(148, 163, 184, 0.08)",
                        p: 2,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        マスク画像より明るい画素は自動で抑えられます。明るいマスクを使うとタイムラインでの非表示効果が安定します。
                      </Typography>
                    </Box>
                    {resultUrl && (
                      <Stack direction="row" justifyContent="flex-end" mt={2}>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<DownloadRoundedIcon />}
                          component="a"
                          href={resultUrl}
                          download="masked-image.png"
                          sx={{ borderRadius: 999 }}
                        >
                          保存
                        </Button>
                      </Stack>
                    )}
                  </CardContent>
                </Card>

                <Card elevation={2} sx={{ borderRadius: 4 }}>
                  <CardHeader title="カスタマイズ設定" subheader="必要なときだけ調整してください。" />
                  <CardContent>
                    <Accordion elevation={0} sx={{ bgcolor: "transparent" }}>
                      <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                        <Typography variant="subtitle2">カスタマイズを開く</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack spacing={3}>
                          <Stack direction="row" justifyContent="flex-end">
                            <Button
                              variant="text"
                              size="small"
                              onClick={() => setSettings(defaultSettings)}
                            >
                              設定をデフォルトに戻す
                            </Button>
                          </Stack>
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={settings.grayscale}
                                  onChange={(event) =>
                                    setSettings((prev) => ({
                                      ...prev,
                                      grayscale: event.target.checked,
                                    }))
                                  }
                                />
                              }
                              label="グレイスケール変換"
                            />
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={settings.limitResolution}
                                  onChange={(event) =>
                                    setSettings((prev) => ({
                                      ...prev,
                                      limitResolution: event.target.checked,
                                    }))
                                  }
                                />
                              }
                              label="解像度制限"
                            />
                          </Stack>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
                            現在の出力: {resultMeta ? `${resultMeta.width} × ${resultMeta.height}px` : "未生成"}
                          </Typography>

                          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                            <TextField
                              label="最大幅 (px)"
                              type="number"
                              value={settings.maxWidth}
                              onChange={(event) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  maxWidth: Number(event.target.value) || DEFAULT_MAX_SIZE,
                                }))
                              }
                              disabled={!settings.limitResolution}
                              inputProps={{ min: 128, max: 4096 }}
                              fullWidth
                            />
                            <TextField
                              label="最大高さ (px)"
                              type="number"
                              value={settings.maxHeight}
                              onChange={(event) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  maxHeight: Number(event.target.value) || DEFAULT_MAX_SIZE,
                                }))
                              }
                              disabled={!settings.limitResolution}
                              inputProps={{ min: 128, max: 4096 }}
                              fullWidth
                            />
                          </Stack>

                          <Box>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle2">マスク強度</Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="caption" color="text.secondary">
                                {settings.maskStrength}%
                              </Typography>
                              <Button
                                size="small"
                                variant="text"
                                onClick={() =>
                                  setSettings((prev) => ({
                                    ...prev,
                                    maskStrength: defaultSettings.maskStrength,
                                  }))
                                }
                              >
                                リセット
                              </Button>
                            </Stack>
                          </Stack>
                            <Slider
                              value={settings.maskStrength}
                              min={0}
                              max={100}
                              onChange={(_event, value) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  maskStrength: Number(value),
                                }))
                              }
                              color="secondary"
                            />
                            <Typography variant="caption" color="text.secondary">
                              低いほど白背景で薄く、高いほどマスクがくっきり出ます。
                            </Typography>
                          </Box>
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  </CardContent>
                </Card>

                <Card elevation={1} sx={{ borderRadius: 4 }}>
                  <CardContent>
                    <Typography variant="subtitle2">Tips</Typography>
                    <Stack spacing={1} mt={1}>
                      <Typography variant="caption" color="text.secondary">
                        ・縦横比が違う場合、画像はマスク内に収まるよう縮小されます。
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ・出力はPNGです。保存後にそのままTwitter/Xへアップロードしてください。
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ・マスクや設定はローカルストレージに保存され、外部には送信されません。
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            </Stack>

          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
