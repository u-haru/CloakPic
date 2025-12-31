import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import ZoomInRoundedIcon from "@mui/icons-material/ZoomInRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

type PreviewCardProps = {
  resultUrl: string | null;
};

export function PreviewCard({ resultUrl }: PreviewCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [darkBackground, setDarkBackground] = useState(true);

  return (
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
              bgcolor: "#000000",
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
          <Stack direction="row" justifyContent="flex-end" mt={2} spacing={1}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<ZoomInRoundedIcon />}
              onClick={() => setDialogOpen(true)}
              sx={{ borderRadius: 999 }}
            >
              拡大表示
            </Button>
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
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="subtitle1">拡大プレビュー</Typography>
          <FormControlLabel
            sx={{ ml: "auto" }}
            control={
              <Switch
                checked={darkBackground}
                onChange={(event) => setDarkBackground(event.target.checked)}
              />
            }
            label={darkBackground ? "黒背景" : "白背景"}
          />
          <IconButton onClick={() => setDialogOpen(false)}>
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              borderRadius: 3,
              border: "1px solid",
              borderColor: darkBackground ? "rgba(148, 163, 184, 0.4)" : "divider",
              bgcolor: darkBackground ? "#000000" : "#ffffff",
              color: darkBackground ? "#e2e8f0" : "#0f172a",
              height: { xs: "60vh", md: "70vh" },
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 2,
            }}
          >
            {resultUrl ? (
              <Box
                component="img"
                src={resultUrl}
                alt={darkBackground ? "黒背景拡大プレビュー" : "白背景拡大プレビュー"}
                sx={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
              />
            ) : (
              <Typography variant="caption" color="text.secondary">
                変換後に表示されます。
              </Typography>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
