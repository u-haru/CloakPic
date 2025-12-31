import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  FormControlLabel,
  Slider,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import type { Settings } from "../hooks/use-image-masker";
import { DEFAULT_MAX_SIZE } from "../lib/image-masker";

type CustomizeCardProps = {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  defaultSettings: Settings;
  resultMeta: { width: number; height: number } | null;
};

export function CustomizeCard({
  settings,
  setSettings,
  defaultSettings,
  resultMeta,
}: CustomizeCardProps) {
  return (
    <Card elevation={2} sx={{ borderRadius: 4 }}>
      <CardHeader title="カスタマイズ設定" subheader="必要なときだけ調整してください。" />
      <CardContent>
        <Accordion elevation={0} sx={{ bgcolor: "transparent" }}>
          <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
            <Typography variant="subtitle2">カスタマイズを開く</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={3}>
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
              <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
                現在の出力: {resultMeta ? `${resultMeta.width} × ${resultMeta.height}px` : "未生成"}
              </Typography>
              {!settings.limitResolution &&
                resultMeta &&
                (resultMeta.width >= DEFAULT_MAX_SIZE ||
                  resultMeta.height >= DEFAULT_MAX_SIZE) && (
                  <Typography variant="caption" sx={{ color: "warning.main", mt: -1 }}>
                    1024px以上の画像はTwitter/X側で再変換されて
                    正しく表示されない可能性があります。
                  </Typography>
                )}

              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle2">マスクのバランス</Typography>
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
                  数値が高いほど白(マスク)の範囲が広がり、低いほど黒(本体)の範囲が広がります。
                </Typography>
                <Stack direction="row" justifyContent="flex-end">
                  <Button
                    variant="text"
                    color="error"
                    size="small"
                    onClick={() =>
                      setSettings((prev) => ({
                        ...defaultSettings,
                        maskDataUrl: prev.maskDataUrl,
                      }))
                    }
                  >
                    設定をデフォルトに戻す
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
}
