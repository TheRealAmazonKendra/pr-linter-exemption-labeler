import * as github from '@actions/github';

interface GitHubLabel {
  readonly name: string;
}

interface PullRequestCommentBasedLabelManagerProps {
  readonly owner: string;
  readonly repo: string;
  readonly comment: string;
  readonly pr: number;
  readonly labels: GitHubLabel[];
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
  private readonly labels: string[];


  constructor(token: string, private readonly props: PullRequestCommentBasedLabelManagerProps) {
    this.client = github.getOctokit(token);
    this.repo = {
      owner: props.owner,
      repo: props.repo,
    };

    this.labels = props.labels.map(label => label.name);
  }

  private commentHasText(text: CommentText): boolean {
    return this.props.comment.includes(text.toLowerCase());
  }

  private pullRequestHasLabel(label?: string): boolean {
    return label ? this.labels.includes(label) : false;
  }

  private async addLabelToPullRequest(label: string): Promise<ReturnType<typeof this.client.rest.issues.addLabels>> {
    return this.client.rest.issues.addLabels({
      ...this.repo,
      issue_number: this.props.pr,
      labels: [label],
    });
  }

  private async tryAddLabel(options: TryAddLabelOptions): Promise<void> {
    if (this.pullRequestHasLabel(options.exception)) {
      console.log(`Label '${options.label}' not added to PR ${this.props.pr} due to label '${options.exception}.'`);
    }

    if (this.pullRequestHasLabel(options.label)) {
      console.log(`Label '${options.label}' not added to PR ${this.props.pr} because it is already present.`);
    }

    const addLabelResponse = await this.addLabelToPullRequest(options.label);
    console.log(`Label '${addLabelResponse.data[0].name}' added to PR ${this.props.pr}.`);
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