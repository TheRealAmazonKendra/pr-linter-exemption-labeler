import * as core from '@actions/core';
import * as github from '@actions/github';
import { PullRequestCommentBasedLabelManager } from './add-labels';

async function run() {
  core.setOutput('labeled', false.toString());

  const token: string = core.getInput('github-token', { required: true });
  console.log(token);
  const commentId: string = core.getInput('comment-id', { required: true });
  console.log(commentId);
  const pullRequestNumber: string = core.getInput('pull-request-number', { required: true });
  console.log(pullRequestNumber);
  console.log(github.context);

  const labelManager = new PullRequestCommentBasedLabelManager(token, {
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    commentId: toInteger(commentId),
    pullRequestNumber: toInteger(pullRequestNumber),
  });

  await labelManager.addLabels();


};

function toInteger(x: string): number {
  const num = parseInt(x, 10);
  if (`${num}` !== x) {
    throw new Error(`Not a number: ${x}`);
  }
  return num;
}

run().catch(error => {
  core.setFailed(error.message);
});