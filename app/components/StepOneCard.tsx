import type { ChangeEvent } from "react";
import { Box, Button, Card, CardContent, CardHeader, Stack, Typography } from "@mui/material";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import type { ImageMeta } from "../lib/image-masker";
import { ImageDropZone } from "./ImageDropZone";

type StepOneCardProps = {
  sourceUrl: string | null;
  sourceMeta: ImageMeta | null;
  onFile: (file: File) => void | Promise<void>;
};

export function StepOneCard({ sourceUrl, sourceMeta, onFile }: StepOneCardProps) {
  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await onFile(file);
  };

  return (
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
            <input hidden type="file" accept="image/*" onChange={handleUpload} />
          </Button>
          {sourceMeta && (
            <Typography variant="caption" color="text.secondary">
              {sourceMeta.width} × {sourceMeta.height}px
            </Typography>
          )}
        </Stack>
        <Box sx={{ mt: 2 }}>
          <ImageDropZone
            onFile={onFile}
            previewUrl={sourceUrl}
            alt="アップロード画像"
            height={260}
            placeholder="画像をドラッグ＆ドロップ、またはクリックで選択。"
          />
        </Box>
      </CardContent>
    </Card>
  );
}
