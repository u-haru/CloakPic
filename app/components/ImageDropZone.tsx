import { useRef, type ChangeEvent, type DragEvent } from "react";
import { Box, Stack, Typography } from "@mui/material";

type ImageDropZoneProps = {
  onFile: (file: File) => void | Promise<void>;
  previewUrl?: string | null;
  alt: string;
  height: number;
  placeholder: string;
  accept?: string;
};

export function ImageDropZone({
  onFile,
  previewUrl,
  alt,
  height,
  placeholder,
  accept = "image/*",
}: ImageDropZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    await onFile(file);
  };

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await onFile(file);
  };

  return (
    <Box
      onDrop={handleDrop}
      onDragOver={(event) => event.preventDefault()}
      onClick={() => inputRef.current?.click()}
      sx={{
        borderRadius: 3,
        border: "1px dashed",
        borderColor: "divider",
        bgcolor: "rgba(148, 163, 184, 0.08)",
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        px: 2,
      }}
    >
      <input
        ref={inputRef}
        hidden
        type="file"
        accept={accept}
        onChange={handleChange}
      />
      {previewUrl ? (
        <Box
          component="img"
          src={previewUrl}
          alt={alt}
          sx={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
        />
      ) : (
        <Stack spacing={1} alignItems="center" color="text.secondary">
          <Typography variant="body2">{placeholder}</Typography>
        </Stack>
      )}
    </Box>
  );
}
