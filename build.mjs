import esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/index.js'],
  outfile: 'dist/octra-sdk.js',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  sourcemap: true
});

await esbuild.build({
  entryPoints: ['src/index.js'],
  outfile: 'dist/octra-sdk.cjs',
  bundle: true,
  format: 'cjs',
  platform: 'node',
  sourcemap: true
});

await esbuild.build({
  entryPoints: ['src/index.js'],
  outfile: 'dist/octra-sdk.min.js',
  bundle: true,
  minify: true,
  format: 'iife',
  globalName: 'octra',
  platform: 'browser',
  sourcemap: true
});

console.log('Build complete');