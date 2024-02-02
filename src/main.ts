import './styles.css';

if (
	location.pathname == '/' ||
	location.pathname.startsWith('/page') ||
	location.pathname.startsWith('/favorites')
) {
	import('./library').then((m) => m.init());
} else if (location.pathname.startsWith('/view/')) {
	import('./gallery').then((m) => m.init());
} else if (location.pathname.startsWith('/settings')) {
	import('./settings').then((m) => m.init());
}
