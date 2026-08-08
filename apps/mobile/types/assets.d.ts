// Metro resolves `.glb` to an asset module id (see metro.config.js); TypeScript
// needs telling, since expo/tsconfig.base only covers the image/font extensions.
declare module '*.glb' {
  const asset: number;
  export default asset;
}
