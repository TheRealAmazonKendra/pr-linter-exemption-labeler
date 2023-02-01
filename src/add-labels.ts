import * as github from '@actions/github';
import { WebhookPayload } from '@actions/github/lib/interfaces';

interface GitHubPullRequest {
  readonly number: number;
  readonly labels: string[];
}

interface GitHubComment {
  readonly id: number;
  readonly author: string;
  readonly body: string;
}

interface ContextPayloadComment {
  readonly [key: string]: any;
  readonly id: number;

}

interface PullRequestCommentBasedLabelManagerProps {
  readonly owner: string;
  readonly repo: string;
  readonly comment: ContextPayloadComment;
  readonly pr: WebhookPayload['pull_request'];
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
}

export class PullRequestCommentBasedLabelManager {
  private readonly client: ReturnType<typeof github.getOctokit>;
  private readonly repo: { owner: string; repo: string };
  private readonly comment: GitHubComment;
  private readonly pr: GitHubPullRequest;


  constructor(token: string, private readonly props: PullRequestCommentBasedLabelManagerProps) {
    this.client = github.getOctokit(token);
    this.repo = {
      owner: props.owner,
      repo: props.repo,
    };

    this.comment = {
      id: this.props.comment.id,
      author: this.props.comment.user.login,
      body: this.props.comment.body,
    };

    this.pr = {
      number: this.props.pr!.number,
      labels: this.props.pr!.labels,
    };
  }


  private pullRequestHasLabel(label?: Label): boolean {
    return label ? this.pr.labels.includes(label) : false;
  }

  private commentHasText(text: CommentText): boolean {
    return this.comment.body.includes(text.toLowerCase());
  }

  private async addLabelToPullRequest(label: Label): Promise<ReturnType<typeof this.client.rest.issues.addLabels>> {
    return this.client.rest.issues.addLabels({
      ...this.repo,
      issue_number: this.pr.number,
      labels: [{
        name: label,
      }],
    });
  }

  private async tryAddLabel(options: TryAddLabelOptions): Promise<void> {
    if (this.pullRequestHasLabel(options.exception)) {
      console.log(`Label '${options.label}' not added to PR ${this.pr.number} due to label '${options.exception}.'`);
    }

    if (this.pullRequestHasLabel(options.label)) {
      console.log(`Label '${options.label}' not added to PR ${this.pr.number} because it is already present.`);
    }

    const addLabelResponse = await this.addLabelToPullRequest(options.label);
    console.log(`Label '${addLabelResponse.data[0].name}' added to PR ${this.pr.number}.`);
  }

  public async addLabels() {

    if (this.commentHasText(CommentText.CLARIFICATION_NEEDED)) {
      await this.tryAddLabel({
        label: Label.CLARIFICATION_NEEDED,
      });
    }

    if (this.commentHasText(CommentText.EXEMPTION_REQUESTED)) {
      await this.tryAddLabel({
        label: Label.EXEMPTION_REQUESTED,
        exception: Label.EXEMPTION_DENIED,
      });
    }
  }
}