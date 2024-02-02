import { getData } from './data';
import { getImages, startDownload } from './download';
import { downloadIcon, spinnerIcon, xMarkIcon } from './icons';
import { createDownloadStateStore, downloaded } from './stores';
import { sleep } from './utils';

const downloadState = createDownloadStateStore();
const metadata = getData(document);

const handleDownload = async (event: MouseEvent) => {
	event.preventDefault();

	try {
		downloadState.starting();

		const images = await getImages(metadata.id);

		downloadState.processing(0, images.length);

		let currentProgress = 0;

		await startDownload(metadata, images, (progress) => {
			currentProgress = progress;
			downloadState.processing(progress, images.length);
		});

		downloadState.success(currentProgress, images.length);
	} catch (e) {
		downloadState.fail();
		console.error('Failed to download gallery', e);
	}
};

function addButton() {
	const readButton = document.querySelector('.level-left > .level-item')!;
	const button = readButton.cloneNode(true) as HTMLButtonElement;
	button.querySelector('a')!.removeAttribute('href');
	button.querySelector('.icon')!.innerHTML = downloadIcon;
	button.querySelector('.button-label')!.innerHTML = 'Download';
	button.addEventListener('click', handleDownload);

	readButton.after(button);

	downloadState.subscribe(async (state) => {
		switch (state.kind) {
			case 'idle':
				button.classList.remove('disabled');
				button.querySelector('.icon')!.innerHTML = downloadIcon;
				button.querySelector('.button-label')!.innerHTML = 'Download';
				break;
			case 'starting':
				button.classList.add('disabled');
				button.querySelector('.icon')!.innerHTML = spinnerIcon;
				button.querySelector('.button-label')!.innerHTML = 'Downloading';
				break;
			case 'processing':
				button.classList.add('disabled');
				button.querySelector('.button-label')!.innerHTML =
					`Downloading (${state.progress}/${state.total})`;
				break;
			case 'failed':
				button.classList.remove('disabled');
				button.querySelector('.icon')!.innerHTML = xMarkIcon;
				button.querySelector('.button-label')!.innerHTML = 'Download Failed';
				break;
			case 'success':
				button.querySelector('.icon')!.innerHTML = downloadIcon;
				button.classList.add('disabled');
				button.querySelector('.button-label')!.innerHTML =
					`Downloaded (${state.progress}/${state.total})`;

				downloaded.add(metadata.id);

				await sleep(1500);

				downloadState.idle();
				break;
		}
	});
}

export const init = () => {
	addButton();
};
