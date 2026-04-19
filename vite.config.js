import { defineConfig } from 'vite';

export default defineConfig({
    root: 'src',
    base: '/projets/Workshop-G09/',
    publicDir: '../public',
    build: {
        outDir: '../dist',
        emptyOutDir: true
    },
    server: {
        open: true
    }
});