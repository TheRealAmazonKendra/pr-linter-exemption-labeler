import * as core from '@actions/core';
import * as github from '@actions/github';
import { PullRequestCommentBasedLabelManager } from './add-labels';

async function run() {
  core.setOutput('labeled', false.toString());

  const token: string = core.getInput('github-token', { required: true });
  console.log(token);
  console.log(github.context);
  console.log('****************************************');
  console.log(github.context.payload.issue!.labels);
  console.log('****************************************');
  console.log(github.context.payload.comment!.body);

  const labelManager = new PullRequestCommentBasedLabelManager(token, {
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    comment: github.context.payload.comment!.body,
    pr: github.context.payload.issue!.number,
    labels: github.context.payload.issue!.labels,
  });

  await labelManager.addLabels();
};

run().catch(error => {
  core.setFailed(error.message);
});