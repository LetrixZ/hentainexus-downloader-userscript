export type Gallery = {
	id: number;
	title: string;
	description?: string;
	artists?: string[];
	circles?: string[];
	magazines?: string[];
	parodies?: string[];
	publishers?: string[];
	published?: string;
	pages: number;
	favorites: number;
	tags: string[];
};

const getInfoElement = (name: string, document: Document) => {
	const infoTable = Array.from(document.querySelectorAll('.view-page-details tr'));

	return infoTable.find((tr) => tr.querySelector('td')?.textContent?.includes(name));
};

const getArrayText = (name: string, document: Document) => {
	const infoElement = getInfoElement(name, document);

	if (!infoElement) {
		return;
	}

	return Array.from(infoElement.querySelectorAll('a')).map((a) =>
		a.childNodes[0].textContent!.trim()
	);
};

export const getData = (document: Document): Gallery => {
	const id = Number(
		document.querySelector('a[href^="/read/"]')!.getAttribute('href')!.split('/').at(-1)!
	);
	const title = document.querySelector('h1.title')!.textContent!;
	const description = getInfoElement('Description', document)
		?.querySelector('td:last-of-type')
		?.textContent?.trim();

	const artists = getArrayText('Artist', document);
	const circles = getArrayText('Circle', document);
	const magazines = getArrayText('Magazine', document);
	const parodies = getArrayText('Parody', document);
	const publishers = getArrayText('Publisher', document);

//	const published = getInfoElement('Published', document)!
//		.querySelector('td:last-of-type')!
//		.textContent!.trim();
	const pages = parseInt(
		getInfoElement('Pages', document)!.querySelector('td:last-of-type')!.textContent!.trim()
	);
	const favorites = parseInt(
		getInfoElement('Favorites', document)!.querySelector('td:last-of-type')!.textContent!.trim()
	);
	const tags = Array.from(getInfoElement('Tags', document)!.querySelectorAll('.tag')).map((tag) =>
		tag.textContent!.trim().split('(')[0].trim()
	);

	return {
		id,
		title,
		description,
		artists,
		circles,
		magazines,
		parodies,
		publishers,
//		published,
		pages,
		favorites,
		tags
	};
};

export const getMetadata = async (id: number): Promise<Gallery> => {
	const res = await fetch(`/view/${id}`);

//	if (!res.ok) {
//		throw new Error(`[${res.status}] ${res.statusText} - Failed to get metadata for ${id}`);
//	}

	const html = await res.text();
	const document = new DOMParser().parseFromString(html, 'text/html');

	return getData(document);
};
