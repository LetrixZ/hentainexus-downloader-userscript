import { getMetadata } from './data';
import { getImages, startDownload } from './download';
import { downloadIcon } from './icons';
import {
	createDownloadStateStore,
	createLibraryItemDownloadStateManager,
	downloaded
} from './stores';
import { sleep } from './utils';

export type LibararyItem = {
	id: number;
	title: string;
};

const downloadState = createDownloadStateStore();
const libraryItemElements = Array.from(document.querySelectorAll('.column'));
const libraryItemState = createLibraryItemDownloadStateManager(libraryItemElements);

const createHeaderButton = () => {
	const button = document.createElement('button');

	button.innerHTML = 'Download all';
	button.classList.add('button', 'pagination-next', 'download-header');

	downloadState.subscribe((state) => {
		switch (state.kind) {
			case 'idle':
				button.innerHTML = 'Download all';
				button.classList.remove('disabled');
				break;
			case 'processing':
				button.innerHTML = `(${state.progress}/${state.total}) Downloading`;
				button.classList.add('disabled');
				break;
			case 'success':
				button.innerHTML = `(${state.progress}/${state.total}) Download finished`;
				button.classList.add('disabled');
				break;
		}
	});

	return button;
};

const downloadItem = async (item: LibararyItem) => {
	const metadata = await getMetadata(item.id);
	const images = await getImages(item.id);

	libraryItemState.progress(item, 0, images.length);

	await startDownload(metadata, images, (progress) =>
		libraryItemState.progress(item, progress, images.length)
	);
};

const handleLibraryDownload = async () => {
	const libraryItems: LibararyItem[] = libraryItemElements
		.map((element) => ({
			id: Number(element.querySelector('a')!.getAttribute('href')!.split('/').at(-1)),
			title: element.querySelector('.card-header')!.getAttribute('title')!
		}))
		.filter((item) => !downloaded.includes(item.id));

	let progress = 0;

	for (const item of libraryItems) {
		downloadState.processing(progress, libraryItems.length);
		libraryItemState.start(item);

		await downloadItem(item)
			.then(() => {
				progress++;

				downloadState.processing(progress, libraryItems.length);

				libraryItemState.finish(item);
				downloaded.add(item.id);
			})
			.catch((e) => {
				libraryItemState.fail(item, e);
			});
	}

	downloadState.success(progress, libraryItems.length);

	await sleep(2500);

	downloadState.idle();
};

const addHeaderButton = () => {
	const searchTitle = document.querySelector('.search-title');
	const button = createHeaderButton();
	button.addEventListener('click', handleLibraryDownload);

	if (searchTitle) {
		const header = searchTitle.parentElement!;

		header.classList.add('flex', 'space-between');
		header.append(button);
	} else {
		button.classList.add('ms-auto');

		const container = document.createElement('div');
		container.classList.add('container', 'flex', 'mb-6');
		container.append(button);

		const itemsContainer = document.querySelector('.container')!;
		const section = itemsContainer.parentElement!;
		section.insertBefore(container, itemsContainer);
	}
};

const addItemsButton = () => {
	for (const element of libraryItemElements) {
		const id = Number(element.querySelector('a')!.getAttribute('href')!.split('/').at(-1));
		const title = element.querySelector('.card-header')!.getAttribute('title')!;

		const button = document.createElement('button');
		button.id = `download-${id}`;
		button.role = 'download';
		button.title = `Download '${title}'`;
		button.innerHTML = downloadIcon;
		button.classList.add('button', 'grey', 'download-icon');

		if (downloaded.includes(id)) {
			button.classList.add('downloaded');
		}

		button.addEventListener('click', (event) => {
			event.preventDefault();

			const item = { id, title };

			libraryItemState.start(item);

			downloadItem(item)
				.then(() => {
					libraryItemState.finish(item);
					downloaded.add(id);
				})
				.catch((err: Error) => {
					libraryItemState.fail(item, err);
				});
		});

		const progressText = document.createElement('span');
		progressText.classList.add('progress-text');
		progressText.setAttribute('download', id.toString());

		const header = element.querySelector('.card-header')!;
		header.classList.add('flex', 'items-center');
		header.appendChild(progressText);
		header.appendChild(button);
	}
};

export const init = () => {
	addHeaderButton();
	addItemsButton();

	downloaded.subscribe((galleries) => {
		libraryItemElements.forEach((element) => {
			const button = element.querySelector('button[role="download"')!;
			const state = button.getAttribute('state');

			if (state !== 'idle') {
				return;
			}

			const id = Number(button.getAttribute('id')!.replace('download-', ''));

			if (galleries.includes(id)) {
				button.classList.add('downloaded');
			} else {
				button.classList.remove('downloaded');
			}
		});
	});
};
