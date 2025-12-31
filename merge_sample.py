#!/usr/bin/env python3
import argparse
import sys
import numpy as np
from PIL import Image

def srgb_to_linear(x):
    """Convert sRGB [0,1] to linear-light [0,1]."""
    x = np.clip(x, 0.0, 1.0)
    a = 0.055
    return np.where(x <= 0.04045, x / 12.92, ((x + a) / (1 + a)) ** 2.4)

def linear_to_srgb(x):
    """Convert linear-light [0,1] to sRGB [0,1]."""
    x = np.clip(x, 0.0, 1.0)
    a = 0.055
    return np.where(x <= 0.0031308, 12.92 * x, (1 + a) * np.power(x, 1/2.4) - a)

def load_img(path, quantize=False, thumb_size=None):
    im = Image.open(path)
    if quantize:
        im = im.quantize(colors=256)
    if thumb_size is not None:
        im.thumbnail((thumb_size, thumb_size), Image.Resampling.LANCZOS)
    return im

def get_rgba(rgba, from_linear=False):
    rgb = rgba[..., :3]
    a = rgba[..., 3:4]
    rgb = np.clip(rgb, 0.0, 1.0)
    a = np.clip(a, 0.0, 1.0)

    # If working space is linear, convert back to sRGB for file export.
    if from_linear:
        rgb = linear_to_srgb(rgb)

    out = np.concatenate([rgb, a], axis=-1)
    im = Image.fromarray((out * 255.0 + 0.5).astype(np.uint8), mode="RGBA")
    return im

def solve_rgba(W, B):
    """
    Solve for rgba (single alpha per pixel) from desired composites W (on white) and B (on black).

    Given:
        Cw = rgb * a + (1 - a)
        Cb = rgb * a
    Ideally:
        a = 1 - (Cw - Cb)  (identical in R,G,B)
        rgb = Cb / a

    Because PNG alpha is scalar, but (Cw - Cb) may differ per channel, we choose
    a := 1 - mean(Cw - Cb) across channels, then compute rgb channelwise.

    Returns array with shape (H,W,4).
    """
    # Clamp inputs
    W = np.clip(W, 0.0, 1.0)
    B = np.clip(B, 0.0, 1.0)

    # Estimate alpha per pixel (scalar): a = 1 - mean(W - B)
    diff = W - B  # (H,W,3)
    a = 1.0 - np.mean(diff, axis=-1, keepdims=True)  # (H,W,1)

    # Optional: robustify with median to reduce color fringing when channels disagree a lot
    # a_med = 1.0 - np.median(diff, axis=-1, keepdims=True)
    # a = 0.5 * a + 0.5 * a_med

    # Clamp alpha to [0,1] and avoid near-zero to prevent division blowups.
    eps = 1e-6
    a_safe = np.maximum(a, eps)

    # Solve rgb = B / a (per-channel), then clip.
    rgb = B / a_safe
    rgb = np.clip(rgb, 0.0, 1.0)

    # Where alpha is ~0 (fully transparent), rgb is irrelevant; pick something stable.
    # We can set rgb to W there (any value is fine; this reduces edge halos after filtering).
    mask_transparent = (a < 1e-3)
    if np.any(mask_transparent):
        rgb[mask_transparent.repeat(3, axis=-1)] = W[mask_transparent.repeat(3, axis=-1)]

    return np.concatenate([rgb, a], axis=-1)

def recomposite_error(rgba, W_ref, B_ref):
    """Compute L2 errors when composited on white and black (diagnostics)."""
    rgb = rgba[..., :3]
    a = rgba[..., 3:4]
    comp_white = rgb * a + (1.0 - a)
    comp_black = rgb * a
    eW = np.mean((comp_white - W_ref) ** 2)
    eB = np.mean((comp_black - B_ref) ** 2)
    return eW, eB

def map_interval(x, src_lo, src_hi, dst_lo, dst_hi, eps=1e-6):
    scale = (dst_hi - dst_lo) / max(src_hi - src_lo, eps)
    return np.clip((x - src_lo) * scale + dst_lo, dst_lo, dst_hi)

def main():
    ap = argparse.ArgumentParser(description="Generate transparent PNG that shows different images on white vs black."
                                             "Inputs should be the intended final looks on each background.")
    ap.add_argument("--white", "-w", required=True, help="Image as it should appear on WHITE background (W).")
    ap.add_argument("--black", "-b", required=True, help="Image as it should appear on BLACK background (B).")
    ap.add_argument("-o", "--out", required=True, help="Output RGBA PNG path.")
    ap.add_argument("-l", "--linear", action="store_true", help="Work in linear-light (convert inputs from sRGB->linear, output back to sRGB).")
    ap.add_argument("-g", "--greyscale", action="store_true", help="Compute in greyscale (average channels) instead of color.")
    ap.add_argument("-q", "--quantize", action="store_true", help="Quantize output to 256 colors (to reduce file size).")
    ap.add_argument("-m", "--margin", type=float, default=0.0, help="Margin to avoid extreme alpha values (0.0-0.5). E.g. 0.05 maps alpha to [0.55, 1.0] and [0.0, 0.45].")
    ap.add_argument("--thumb_size", type=int, default=900, help="If given, downscale inputs to fit within this size for faster processing.")
    args = ap.parse_args()

    W_img = load_img(args.white, quantize=args.quantize, thumb_size=args.thumb_size)
    B_img = load_img(args.black, quantize=args.quantize, thumb_size=args.thumb_size)

    W = np.asarray(W_img.convert("RGB"), dtype=np.float32) / 255.0
    B = np.asarray(B_img.convert("RGB"), dtype=np.float32) / 255.0

    if W.shape != B.shape:
        print(f"Error: shape mismatch: W{W.shape} vs B{B.shape}", file=sys.stderr)
        sys.exit(2)

    # W/B 読み込み直後（可能なら --linear 時に）
    W_min = float(W.min())
    W_max = float(W.max())
    B_min = float(B.min())
    B_max = float(B.max())

    # W: 最小→0.5, 最大→1.0
    W = map_interval(W, W_min, W_max, 0.5 + args.margin, 1.0)
    # B: 最小→0.0, 最大→0.5
    B = map_interval(B, B_min, B_max, 0.0, 0.5 - args.margin)

    if args.linear:
        W = srgb_to_linear(W)
        B = srgb_to_linear(B)

    if args.greyscale:
        W = np.mean(W, axis=-1, keepdims=True).repeat(3, axis=-1)
        B = np.mean(B, axis=-1, keepdims=True).repeat(3, axis=-1)

    rgba = solve_rgba(W, B)

    eW, eB = recomposite_error(rgba, W, B)
    print(f"Diagnostics MSE  white={eW:.6f}  black={eB:.6f}", file=sys.stderr)

    im = get_rgba(rgba, from_linear=args.linear)

    if args.quantize:
        im = im.quantize(colors=256)
    # if args.greyscale:
    #     im = im.convert("LA")

    im.save(args.out, compress_level=9)
    print(f"Saved: {args.out}")

if __name__ == "__main__":
    main()