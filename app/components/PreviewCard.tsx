import { Box, Button, Card, CardContent, CardHeader, Stack, Typography } from "@mui/material";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";

type PreviewCardProps = {
  resultUrl: string | null;
};

export function PreviewCard({ resultUrl }: PreviewCardProps) {
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
  );
}
