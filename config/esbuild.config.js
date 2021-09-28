const esbuild = require('esbuild');


esbuild.build({
    entryPoints: ['src/asdf.js'],
    bundle: true,
    minify: true,
    format: 'esm',
    outfile: 'dist/asdf-cdn-module.min.js'
});

esbuild.build({
    entryPoints: ['src/asdf.js'],
    bundle: true,
    minify: false,
    format: 'esm',
    outfile: 'dist/asdf-cdn-module.js'
});

esbuild.build({
    entryPoints: ['src/asdf.js'],
    bundle: true,
    minify: true,
    format: 'iife',
    outfile: 'dist/asdf-cdn-nomodule.min.js'
});

esbuild.build({
    entryPoints: ['src/asdf.js'],
    bundle: true,
    minify: false,
    format: 'iife',
    outfile: 'dist/asdf-cdn-nomodule.js'
});
