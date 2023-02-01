const { GitHubActionTypeScriptProject } = require('projen-github-action-typescript');
const project = new GitHubActionTypeScriptProject({
  defaultReleaseBranch: 'main',
  name: 'pr-linter-exemption-labeler',
  deps: [
    '@octokit/graphql',
    '@actions/core',
    '@actions/github',
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

  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // packageName: undefined,  /* The "name" in package.json. */
});
project.synth();