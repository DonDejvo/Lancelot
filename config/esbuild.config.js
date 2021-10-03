const esbuild = require('esbuild');


esbuild.build({
    entryPoints: ['src/Lancelot.js'],
    bundle: true,
    minify: false,
    format: 'esm',
    outfile: 'dist/lancelot-cdn-module.js'
});

esbuild.build({
    entryPoints: ['src/Lancelot.js'],
    bundle: true,
    minify: true,
    format: 'esm',
    outfile: 'dist/lancelot-cdn-module.min.js'
});

esbuild.build({
    entryPoints: ['src/Lancelot.js'],
    bundle: true,
    minify: false,
    format: 'iife',
    outfile: 'dist/lancelot-cdn-nomodule.js'
});

esbuild.build({
    entryPoints: ['src/Lancelot.js'],
    bundle: true,
    minify: true,
    format: 'iife',
    outfile: 'dist/lancelot-cdn-nomodule.min.js'
});