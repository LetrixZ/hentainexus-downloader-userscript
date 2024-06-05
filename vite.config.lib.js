import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

// https://vitejs.dev/config/
export default defineConfig({
	build: {
		emptyOutDir: false,
		lib: {
			entry: resolve(__dirname, 'src/main.ts'),
			name: 'HentaiNexus Downloader',
			formats: ['umd'],
			fileName: 'hndl-lib'
		},
		rollupOptions: {
			output: {
				manualChunks: null
			}
		}
	},
	plugins: [svelte(), cssInjectedByJsPlugin()]
});
