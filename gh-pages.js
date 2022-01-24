var ghpages = require('gh-pages');

ghpages.publish(
	'public', // path to public directory
	{
		branch: 'gh-pages',
		repo: 'https://github.com/metrixsandbox/drugfinder.git', // Update to point to your repository
		user: {
			name: 'metrixsandbox', // update to use your name
			email: 'bradleylsaunders@gmail.com' // Update to use your email
		},
		dotfiles: true
	},
	() => {
		console.log('Deploy Complete!');
	}
);
