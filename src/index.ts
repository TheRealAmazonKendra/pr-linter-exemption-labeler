import * as core from '@actions/core';
import * as github from '@actions/github';
import { PullRequestCommentBasedLabelManager } from './add-labels';

async function run() {
  core.setOutput('labeled', false.toString());

  const token: string = core.getInput('github-token', { required: true });
  console.log(token);
  console.log(github.context);
  console.log('****************************************');
  console.log(github.context.payload.pull_request);
  console.log('****************************************');
  console.log(github.context.payload.comment);

  const labelManager = new PullRequestCommentBasedLabelManager(token, {
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    comment: github.context.payload.comment!,
    pr: github.context.payload.pull_request!,
  });

  await labelManager.addLabels();
};

run().catch(error => {
  core.setFailed(error.message);
});