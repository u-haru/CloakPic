import type { Route } from "./+types/home";
import { Box, Card, CardContent, Container, Link, Stack, Typography } from "@mui/material";
import { CustomizeCard } from "../components/CustomizeCard";
import { PreviewCard } from "../components/PreviewCard";
import { StepOneCard } from "../components/StepOneCard";
import { StepTwoCard } from "../components/StepTwoCard";
import { useImageMasker } from "../hooks/use-image-masker";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "CloakPic" },
    {
      name: "description",
      content:
        "Twitter/Xなどで、白背景と黒背景で見え方が変わる画像を作るローカルツール。",
    },
  ];
}

export default function Home() {
  const {
    settings,
    setSettings,
    defaultSettings,
    activeMaskUrl,
    sourceUrl,
    sourceMeta,
    resultUrl,
    resultMeta,
    error,
    handleSourceFile,
    handleMaskFile,
    handleResetMask,
  } = useImageMasker();

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
                    CloakPic
                  </Typography>
                  <Typography variant="h3">Tap to reveal image maker</Typography>
                </Box>
              </Stack>
              <Typography variant="body2" color="text.secondary">
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
              <Stack spacing={4} flex={0.9}>
                <StepOneCard
                  sourceUrl={sourceUrl}
                  sourceMeta={sourceMeta}
                  onFile={handleSourceFile}
                />
                <StepTwoCard
                  activeMaskUrl={activeMaskUrl}
                  error={error}
                  onFile={handleMaskFile}
                  onResetMask={handleResetMask}
                />
              </Stack>

              <Stack spacing={4} flex={1.1}>
                <PreviewCard resultUrl={resultUrl} />
                <CustomizeCard
                  settings={settings}
                  setSettings={setSettings}
                  defaultSettings={defaultSettings}
                  resultMeta={resultMeta}
                />
                <Card elevation={1} sx={{ borderRadius: 4 }}>
                  <CardContent>
                    <Typography variant="subtitle2">Tips</Typography>
                    <Stack spacing={1} mt={1}>
                      <Typography variant="caption" color="text.secondary" children="・縦横比が違う場合、画像はマスク内に収まるよう縮小されます。" />
                      <Typography variant="caption" color="text.secondary" children="・出力はPNGです。保存後にそのままTwitter/Xへアップロードできます。" />
                      <Typography variant="caption" color="text.secondary" children="・マスクや設定はローカルストレージに保存され、外部には送信されません。" />
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            </Stack>

            <Box component="footer" sx={{ textAlign: "center", pt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                GitHub:{" "}
                <Link
                  href="https://github.com/u-haru/CloakPic"
                  target="_blank"
                  rel="noreferrer"
                  color="inherit"
                  underline="hover"
                >
                  https://github.com/u-haru/CloakPic
                </Link>
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
