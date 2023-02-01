import * as github from '@actions/github';

interface GitHubPullRequest {
  readonly author: string;
  readonly state: string;
  readonly labels: string[];
}

interface GitHubComment {
  readonly id: number;
  readonly author: string;
  readonly body: string;
}

interface PullRequestCommentBasedLabelManagerProps {
  readonly owner: string;
  readonly repo: string;
  readonly commentId: number;
  readonly pullRequestNumber: number;
}

/**
 * Labels to be added to Pull Requests to indicate attention is needed by a core team member.
 */
enum Label {

  /**
   * Label automatically added when contributor comment contains `clarification request`
   * This label indicates that the contributor needs input from a core team member regarding their PR.
   * This can be used when needing help on a failing build, clarification of changes requested, etc.
   */
  CLARIFICATION_NEEDED = 'pr/reviewer-clarification-needed',

  /**
   * Label manually added to stop `pr-linter/exemption-requested` from being re-added to the PR.
   */
  EXEMPTION_DENIED = 'pr-linter/no-exemption',

  /**
   * Label automatically added when contributor comment contains `exemption request`
   * This label indicates that the contributor would like a core team member to assess whether their
   * change qualifies for an exemption to the PR Linter result.
   */
  EXEMPTION_REQUESTED = 'pr-linter/exemption-requested',
}

/**
 * Text in PR comments added by contributors that indicate attention is needed by a core team member.
 *
 * The PR Linter provides instructions on adding these phrases.
 */
enum CommentText {

  /**
   * Text added to comment that indicates that the contributor needs input from a core team member
   * regarding their PR.
   *
   * This can be used when needing help on a failing build, clarification of changes requested, etc.
   */
  CLARIFICATION_NEEDED = 'clarification request',

  /**
   * Text added to comment that indicates that the contributor would like a core team member
   * to assess whether their change qualifies for an exemption to the PR Linter result.
   */
  EXEMPTION_REQUESTED = 'exemption request',
}

interface TryAddLabelOptions {
  label: Label;
  exception?: Label;
  pr: GitHubPullRequest;
  comment: GitHubComment;
}

export class PullRequestCommentBasedLabelManager {
  private readonly client: ReturnType<typeof github.getOctokit>;
  private readonly repo: { owner: string; repo: string };


  constructor(token: string, private readonly props: PullRequestCommentBasedLabelManagerProps) {
    this.client = github.getOctokit(token);
    this.repo = { owner: props.owner, repo: props.repo };
  }

  private async getComment(): Promise<GitHubComment> {
    const comment = await this.client.rest.issues.getComment({
      ...this.repo,
      comment_id: this.props.commentId,
    });

    return {
      id: comment.data.id,
      author: comment.data.user!.login,
      body: comment.data.body!,
    };
  }

  private async getPullRequest(): Promise<GitHubPullRequest> {
    const pr = await this.client.rest.pulls.get({
      ...this.repo,
      pull_number: this.props.pullRequestNumber,
    });

    return {
      author: pr.data.user!.login,
      state: pr.data.state,
      labels: pr.data.labels.map(label => label.name),
    };
  }

  private pullRequestHasLabel(pr: GitHubPullRequest, label?: Label): boolean {
    return label ? pr.labels.includes(label) : false;
  }

  private commentHasText(comment: GitHubComment, text: CommentText): boolean {
    return comment.body.includes(text.toLowerCase());
  }

  private async addLabelToPullRequest(label: Label): Promise<ReturnType<typeof this.client.rest.issues.addLabels>> {
    return this.client.rest.issues.addLabels({
      ...this.repo,
      issue_number: this.props.pullRequestNumber,
      labels: [{
        name: label,
      }],
    });
  }

  private async tryAddLabel(options: TryAddLabelOptions): Promise<void> {
    if (this.pullRequestHasLabel(options.pr, options.exception)) {
      console.log(`Label '${options.label}' not added to PR ${this.props.pullRequestNumber} due to label '${options.exception}.'`);
    }

    if (this.pullRequestHasLabel(options.pr, options.label)) {
      console.log(`Label '${options.label}' not added to PR ${this.props.pullRequestNumber} because it is already present.`);
    }

    const addLabelResponse = await this.addLabelToPullRequest(options.label);
    console.log(`Label '${addLabelResponse.data[0].name}' added to PR ${this.props.pullRequestNumber}.`);
  }

  public async addLabels() {
    const comment = await this.getComment();
    const pr = await this.getPullRequest();

    if (this.commentHasText(comment, CommentText.CLARIFICATION_NEEDED)) {
      await this.tryAddLabel({
        label: Label.CLARIFICATION_NEEDED,
        comment,
        pr,
      });
    }

    if (this.commentHasText(comment, CommentText.EXEMPTION_REQUESTED)) {
      await this.tryAddLabel({
        label: Label.EXEMPTION_REQUESTED,
        comment,
        pr,
        exception: Label.EXEMPTION_DENIED,
      });
    }
  }
}