import { defineConfig } from 'vite';

export default defineConfig({
    root: 'src',
    base: '/projets/TFE/',
    publicDir: '../public',
    build: {
        outDir: '../dist',
        emptyOutDir: true
    },
    server: {
        open: true
    }
});