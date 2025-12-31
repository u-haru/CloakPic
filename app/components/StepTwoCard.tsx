import type { ChangeEvent } from "react";
import { Box, Button, Card, CardContent, CardHeader, IconButton, Stack, Typography } from "@mui/material";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import { ImageDropZone } from "./ImageDropZone";

type StepTwoCardProps = {
  activeMaskUrl: string | null;
  error: string | null;
  onFile: (file: File) => void | Promise<void>;
  onResetMask: () => void;
};

export function StepTwoCard({ activeMaskUrl, error, onFile, onResetMask }: StepTwoCardProps) {
  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await onFile(file);
  };

  return (
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
                <input hidden type="file" accept="image/*" onChange={handleUpload} />
              </Button>
              <IconButton color="primary" onClick={onResetMask}>
                <RestartAltRoundedIcon />
              </IconButton>
            </Stack>
          </Stack>
          <ImageDropZone
            onFile={onFile}
            previewUrl={activeMaskUrl}
            alt="マスク画像"
            height={180}
            placeholder="マスク画像をドラッグ＆ドロップ、またはクリックで選択。"
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
