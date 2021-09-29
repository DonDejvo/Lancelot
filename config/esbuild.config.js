const esbuild = require('esbuild');


esbuild.build({
    entryPoints: ['src/Lancelot.js'],
    bundle: true,
    minify: false,
    format: 'esm',
    outfile: 'dist/lancelot-cdn-module.js'
});