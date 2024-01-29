import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		svelte(),
		monkey({
			entry: 'src/main.ts',
			userscript: {
				match: ['https://hentainexus.com/*'],
				description: "Allows users to download a gallery from HentaiNexus with it's metadata"
			}
		})
	]
});
