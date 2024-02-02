type Field<T> = {
	name: string;
	description: string;
	value: T;
};

const buildCheckboxField = ({ name, description, value }: Field<boolean>) => {
	const container = document.createElement('div');
	container.classList.add('field');

	const input = document.createElement('input');
	input.id = name;
	input.name = name;
	input.style.marginRight = '0.5rem';
	input.type = 'checkbox';
	input.checked = value;

	const label = document.createElement('label');
	label.htmlFor = name;
	label.innerHTML = description;

	container.append(input, label);

	return container;
};

const addSettings = () => {
	const container = document.querySelector('.container')!;

	const separator = document.createElement('hr');

	const title = document.createElement('h4');
	title.classList.add('title', 'is-4');
	title.innerHTML = 'Script settings';

	const form = document.createElement('form');

	form.onsubmit = () => {
		const formData = new FormData(form);
		const formProps = Object.fromEntries(formData);

		localStorage.setItem('skip_download', formProps['skip_download'] ? 'true' : 'false');
		localStorage.setItem('strip_filter', formProps['strip_filter'] ? 'true' : 'false');

		location.reload();
	};

	const skipDownload = localStorage.getItem('skip_download');
	const stripFilter = localStorage.getItem('strip_filter');

	const skipDownloadCheckbox = buildCheckboxField({
		name: 'skip_download',
		description: 'Skip downloaded galleries from batch downloads.',
		value: skipDownload === 'true'
	});

	const stripFilterCheckbox = buildCheckboxField({
		name: 'strip_filter',
		description:
			"Avoid striping '?filter=null' from the image URL. Enable this if downloads fail or are incomplete.",
		value: stripFilter === 'true'
	});

	form.append(skipDownloadCheckbox, stripFilterCheckbox);

	const submitButton = document.createElement('div');
	submitButton.classList.add('filter');
	submitButton.innerHTML =
		'<div class="control"><button class="button is-primary">Submit</button></div>';

	form.append(submitButton);

	const columns = document.createElement('div');
	columns.classList.add('columns');
	const column = document.createElement('div');
	column.classList.add('column');

	column.append(form);
	columns.append(column);
	container.append(separator);
	container.append(title);
	container.append(columns);
};

export const init = () => {
	addSettings();
};
