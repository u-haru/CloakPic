declare module "jpeg-js" {
  export type DecodeOptions = {
    useTArray?: boolean;
  };

  export type DecodeResult = {
    width: number;
    height: number;
    data: Uint8Array;
  };

  const jpeg: {
    decode: (data: Uint8Array, options?: DecodeOptions) => DecodeResult;
  };

  export default jpeg;
}
