import { AsyncZipDeflate, Zip, strToU8 } from 'fflate';
import pLimit from 'p-limit';
import { createWriteStream } from 'streamsaver';
import type { Gallery } from './data';

type Image = {
	image: string;
	label: string;
	url_label: string;
	type: 'image' | '';
};

export type IdleState = {
	kind: 'idle';
};

export type StartingState = {
	kind: 'starting';
};

export type ProcessingState = {
	kind: 'processing';
	progress: number;
	total: number;
};

export type FailedState = {
	kind: 'failed';
};

export type SuccessState = {
	kind: 'success';
	progress: number;
	total: number;
};

export type DownloadState =
	| IdleState
	| StartingState
	| ProcessingState
	| FailedState
	| SuccessState;

const primeNumbers = [2, 3, 5, 7, 11, 13, 17, 19];
const limit = pLimit(4);

const generateFilename = ({ title, artists, magazines }: Gallery) => {
	const splits = [];

	if (artists) {
		if (artists.length === 1) {
			splits.push(`[${artists[0]}]`);
		} else if (artists.length === 2) {
			splits.push(`[${artists[0]} & ${artists[1]}]`);
		} else if (artists.length >= 3) {
			splits.push('[Various]');
		}
	}

	splits.push(title);

	if (magazines?.length === 1) {
		splits.push(`(${magazines[0]})`);
	}

	return splits
		.join(' ')
		.replace('\u{FF0A}', '*')
		.replace('\u{FF1F}', '?')
		.replace('\u{2044}', '/')
		.replace('\u{A792}', ':');
};

const base64ToBytes = (encoded: string) => {
	const binaryString = atob(encoded);
	const len = binaryString.length;
	const bytes = new Uint8Array(len);

	for (let i = 0; i < len; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}

	return bytes;
};

export const decryptData = (encoded: string) => {
	const data = base64ToBytes(encoded);
	const keyStream = data.slice(0, 64).map((byte) => byte & 0xff);
	const ciphertext = data.slice(64).map((byte) => byte & 0xff);
	const digest = [...Array(256).keys()];

	let primeIdx = 0;

	for (let i = 0; i < 64; i++) {
		primeIdx ^= keyStream[i];

		for (let j = 0; j < 8; j++) {
			primeIdx = (primeIdx & 1) !== 0 ? (primeIdx >>> 1) ^ 12 : primeIdx >>> 1;
		}
	}
	primeIdx &= 7;

	let temp;
	let key = 0;

	for (let i = 0; i < 256; i++) {
		key = (key + digest[i] + keyStream[i % 64]) % 256;

		temp = digest[i];
		digest[i] = digest[key];
		digest[key] = temp;
	}

	const q = primeNumbers[primeIdx];
	let k = 0;
	let n = 0;
	let p = 0;
	let xorKey = 0;

	let result = '';

	for (let i = 0; i < ciphertext.length; i++) {
		k = (k + q) % 256;
		n = (p + digest[(n + digest[k]) % 256]) % 256;
		p = (p + k + digest[k]) % 256;

		temp = digest[k];
		digest[k] = digest[n];
		digest[n] = temp;

		xorKey = digest[(n + digest[(k + digest[(xorKey + p) % 256]) % 256]) % 256];
		result += String.fromCharCode(ciphertext[i] ^ xorKey);
	}

	return result;
};

const fetchImage = async (image: Image, zip: Zip) => {
	return new Promise<void>((resolve, reject) => {
		try {
			const img = new Image();
			img.src = image.image;
			img.crossOrigin = 'anonymous';
			img.addEventListener('load', () => {
				const canvas = document.createElement('canvas');
				const context = canvas.getContext('2d')!;

				canvas.height = img.naturalHeight;
				canvas.width = img.naturalWidth;
				context.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);

				canvas.toBlob((blob) => {
					const extension = blob!.type.split('/').at(-1);
					const imageFile = new AsyncZipDeflate(`${image.url_label}.${extension}`);

					zip.add(imageFile);

					blob!.arrayBuffer().then((buffer) => {
						imageFile.push(new Uint8Array(buffer), true);

						canvas.remove();
						img.remove();

						resolve();
					});
				});
			});
		} catch (e) {
			reject(e);
		}
	});
};

export const startDownload = async (
	metadata: Gallery,
	images: Image[],
	setProgress: (progress: number) => void
) => {
	return new Promise<void>((resolve, reject) => {
		const fileStream = createWriteStream(`${generateFilename(metadata)}.cbz`);
		const writer = fileStream.getWriter();

		const zip = new Zip();

		zip.ondata = async (err, chunk, final) => {
			if (!err) {
				writer.write(chunk);

				if (final) {
					writer.close();
				}
			} else {
				writer.abort();
				reject(err);
			}
		};

		const metadataFile = new AsyncZipDeflate('info.json');

		zip.add(metadataFile);

		metadataFile.push(strToU8(JSON.stringify(metadata, null, 2)), true);

		let progress = 0;

		Promise.all(
			images.map((image) =>
				limit(() =>
					fetchImage(image, zip).then(() => {
						progress++;
						setProgress(progress);
					})
				)
			)
		).then(() => {
			zip.end();
			resolve();
		});

		const beforeUnloadHandler = () => writer.abort();

		window.addEventListener('beforeunload', beforeUnloadHandler);

		writer.closed.then(() => window.removeEventListener('beforeunload', beforeUnloadHandler));
	});
};

export const getImages = async (id: number) => {
	const res = await fetch(`/read/${id}`);

	if (!res.ok) {
		throw new Error(`[${res.status}] ${res.statusText} - Failed to get images for ${id}`);
	}

	const html = await res.text();
	const document = new DOMParser().parseFromString(html, 'text/html');

	const readerScript = Array.from(document.querySelectorAll('script')).find((script) =>
		script.innerHTML.includes('initReader')
	)!.innerHTML;

	const encoded = readerScript.match(/initReader\("([^"]*)"/)![1];

	const images: Image[] = JSON.parse(decryptData(encoded));

	return images.filter((image) => image.type === 'image');
};
