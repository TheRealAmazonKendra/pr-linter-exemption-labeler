import * as core from '@actions/core';
import * as github from '@actions/github';
import { PullRequestCommentBasedLabelManager } from './add-labels';

async function run() {
  const token: string = core.getInput('github-token', { required: true });

  const labelManager = new PullRequestCommentBasedLabelManager(token, {
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    comment: github.context.payload.comment!.body,
    pr: github.context.payload.issue!.number,
    labels: github.context.payload.issue!.labels,
  });

  console.log(await labelManager.addLabels());
};

run().catch(error => {
  core.setFailed(error.message);
});