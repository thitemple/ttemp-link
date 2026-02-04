export type ShareTarget = {
	id: string;
	label: string;
	kind: 'link' | 'copy-open';
	href: string;
};

export const getShareTargets = (url: string): ShareTarget[] => {
	if (!url) return [];
	const encodedText = encodeURIComponent(url);
	const encodedUrl = encodeURIComponent(url);
	const emailSubject = encodeURIComponent('Your short link');
	const emailBody = encodeURIComponent(url);

	return [
		{
			id: 'bluesky',
			label: 'BlueSky',
			kind: 'link',
			href: `https://bsky.app/intent/compose?text=${encodedText}`
		},
		{
			id: 'x',
			label: 'X',
			kind: 'link',
			href: `https://x.com/intent/post?text=${encodedText}`
		},
		{
			id: 'instagram',
			label: 'Instagram',
			kind: 'copy-open',
			href: 'https://www.instagram.com/'
		},
		{
			id: 'facebook',
			label: 'Facebook',
			kind: 'link',
			href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
		},
		{
			id: 'threads',
			label: 'Threads',
			kind: 'copy-open',
			href: 'https://www.threads.net/'
		},
		{
			id: 'linkedin',
			label: 'LinkedIn',
			kind: 'link',
			href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
		},
		{
			id: 'tiktok',
			label: 'TikTok',
			kind: 'copy-open',
			href: 'https://www.tiktok.com/'
		},
		{
			id: 'email',
			label: 'Email',
			kind: 'link',
			href: `mailto:?subject=${emailSubject}&body=${emailBody}`
		}
	];
};
