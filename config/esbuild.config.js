const esbuild = require('esbuild');


esbuild.build({
    entryPoints: ['src/core.js'],
    bundle: true,
    minify: true,
    format: 'esm',
    outfile: 'dist/lancelot-cdn.min.js'
});