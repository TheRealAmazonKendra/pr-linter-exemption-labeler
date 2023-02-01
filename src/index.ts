import * as core from '@actions/core';
import * as github from '@actions/github';
import { Octokit } from '@octokit/rest';
import { PullRequestCommentBasedLabelManager } from './add-labels';

async function run() {
  const token: string = core.getInput('github-token', { required: true });

  const client = new Octokit({ auth: token });

  const labelManager = new PullRequestCommentBasedLabelManager({
    client,
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    comment: github.context.payload.comment!.body,
    pr: github.context.payload.issue!.number,
    labels: github.context.payload.issue!.labels,
    action: github.context.payload.action!,
  });

  const output = await labelManager.manageLabels();

  console.log('**************************************');
  console.log('Summary: ');
  output.forEach(x => console.log(`\t${x}`));
  console.log('**************************************');
};

run().catch(error => {
  core.setFailed(error.message);
});