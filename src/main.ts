import { init as initGallery } from './gallery';
import { init as initLibrary } from './library';
import * as Settings from './settings';
import './styles.css';

if (
	location.pathname == '/' ||
	location.pathname.startsWith('/page') ||
	location.pathname.startsWith('/favorites')
) {
	initLibrary();
} else if (location.pathname.startsWith('/view/')) {
	initGallery();
} else if (location.pathname.startsWith('/settings')) {
	Settings.addSettings();
}
