import { writable } from 'svelte/store';
import type { DownloadState } from './download';
import { downloadIcon, spinnerIcon, xMarkIcon } from './icons';
import type { LibararyItem } from './library';

const createDownloadedStore = () => {
	const downloaded: number[] = JSON.parse(localStorage.getItem('downloads') || '[]');

	const { set, subscribe } = writable(downloaded);

	const get = () => downloaded;

	const add = (id: number) => {
		if (!downloaded.includes(id)) {
			downloaded.push(id);
		}

		set(downloaded);

		localStorage.setItem('downloads', JSON.stringify(downloaded));
	};

	const includes = (id: number) => downloaded.includes(id);

	return {
		get,
		add,
		includes,
		subscribe
	};
};

export const downloaded = createDownloadedStore();

const getIdFromElement = (element: Element) =>
	Number(element.querySelector('a')!.getAttribute('href')!.split('/').at(-1));

export const createLibraryItemDownloadStateManager = (elements: Element[]) => {
	const start = ({ id, title }: LibararyItem) => {
		const element = elements.find((element) => id === getIdFromElement(element));

		if (element) {
			const button = element.querySelector('button[role="download"]')!;
			button.setAttribute('state', 'processing');
			button.classList.add('disabled');
			button.classList.remove('downloaded', 'failed');
			button.innerHTML = spinnerIcon;

			console.log(`Started download for (${id}) '${title}'`);
		}
	};

	const progress = ({ id }: LibararyItem, progress: number, total: number) => {
		const element = elements.find((element) => id === getIdFromElement(element));

		if (element) {
			const progressText = element.querySelector(`span[download="${id}"]`)!;
			progressText.innerHTML = `${progress}/${total}`;
		}
	};

	const finish = ({ id, title }: LibararyItem) => {
		const element = elements.find((element) => id === getIdFromElement(element));

		if (element) {
			const button = element.querySelector('button[role="download"]')!;
			button.innerHTML = downloadIcon;

			console.log(`Finished download for (${id}) '${title}'`);

			finalize(id);
		}
	};

	const fail = ({ id, title }: LibararyItem, err: Error) => {
		const element = elements.find((element) => id === getIdFromElement(element));

		if (element) {
			const button = element.querySelector('button[role="download"]')!;
			button.classList.add('failed');
			button.innerHTML = xMarkIcon;

			console.error(`Failed download for (${id}) '${title}'`, err);

			finalize(id);
		}
	};

	const finalize = (id: number) => {
		const element = elements.find((element) => id === getIdFromElement(element))!;

		const button = element.querySelector('button[role="download"]')!;
		button.setAttribute('state', 'idle');
		button.classList.remove('disabled');

		const progressText = element.querySelector(`span[download="${id}"]`)!;
		progressText.innerHTML = '';
	};

	return {
		start,
		progress,
		finish,
		fail
	};
};

export const createDownloadStateStore = () => {
	const { update, subscribe } = writable<DownloadState>({ kind: 'idle' });

	const idle = () => {
		update((state) => ({ ...state, kind: 'idle' }));
	};

	const starting = () => {
		update((state) => ({ ...state, kind: 'starting' }));
	};

	const processing = (progress: number, total: number) => {
		update((state) => ({ ...state, kind: 'processing', progress, total }));
	};

	const success = (progress: number, total: number) => {
		update((state) => ({ ...state, kind: 'success', progress, total }));
	};

	const fail = () => {
		update((state) => ({ ...state, kind: 'failed' }));
	};

	return {
		idle,
		starting,
		processing,
		success,
		fail,
		subscribe
	};
};
