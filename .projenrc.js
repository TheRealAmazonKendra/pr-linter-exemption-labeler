const { GitHubActionTypeScriptProject } = require('projen-github-action-typescript');
const project = new GitHubActionTypeScriptProject({
  defaultReleaseBranch: 'main',
  name: 'pr-linter-exemption-labeler',
  deps: [
    '@octokit/graphql',
    '@actions/core',
    '@actions/github',
    '@octokit/rest',
  ],
  metadata: {
    author: 'Kendra Neil',
    inputs: {
      'github-token': {
        description: 'GitHub token',
        required: true,
      },
    },
  },
  devDeps: ['projen-github-action-typescript'],
});
project.synth();