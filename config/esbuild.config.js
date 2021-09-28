const esbuild = require('esbuild');


esbuild.build({
    entryPoints: ['src/asdf.js'],
    bundle: true,
    minify: true,
    format: 'esm',
    outfile: 'dist/lancelot-cdn-module.min.js'
});

esbuild.build({
    entryPoints: ['src/asdf.js'],
    bundle: true,
    minify: true,
    format: 'iife',
    outfile: 'dist/lancelot-cdn-nomodule.min.js'
});
