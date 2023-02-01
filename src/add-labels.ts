import { Octokit } from '@octokit/rest';

export interface GitHubLabel {
  readonly name: string;
}

interface PullRequestCommentBasedLabelManagerProps {
  readonly owner: string;
  readonly repo: string;
  readonly comment: string;
  readonly pr: number;
  readonly labels: GitHubLabel[];
  readonly action: string;
  readonly client: Octokit;
}

/**
 * Labels to be added to Pull Requests to indicate attention is needed by a core team member.
 */
export enum Label {

  /**
   * Label automatically added when contributor comment contains `clarification request`
   * This label indicates that the contributor needs input from a core team member regarding their PR.
   * This can be used when needing help on a failing build, clarification of changes requested, etc.
   */
  CLARIFICATION_REQUESTED = 'pr/reviewer-clarification-requested',

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
export enum CommentText {

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

/**
 * Tests comments for specific text and adds/removes labels based off whether or not the text is present.
 */
export class PullRequestCommentBasedLabelManager {
  private readonly repo: { owner: string; repo: string };
  private readonly labels: string[];


  constructor(private readonly props: PullRequestCommentBasedLabelManagerProps) {
    this.repo = {
      owner: props.owner,
      repo: props.repo,
    };

    this.labels = props.labels.map(label => label.name);
  }

  /**
   * Adds and removes labels based off content of comment.
   * @returns statuses of each attempt to add or remove a label
   */
  public async manageLabels(): Promise<string[]> {
    if (this.props.action === 'deleted') {
      return this.removeLabels();
    }
    return this.addLabels();
  }

  private async addLabels(): Promise<string[]> {
    const statuses: string[] = [];
    if (this.commentHasText(CommentText.CLARIFICATION_NEEDED)) {
      statuses.push(`Clarification requested on PR ${this.props.pr}.`);
      statuses.push(await this.tryAddLabel({
        label: Label.CLARIFICATION_REQUESTED,
      }));
    }

    if (this.commentHasText(CommentText.EXEMPTION_REQUESTED)) {
      statuses.push(`Exemption requested on PR ${this.props.pr}.`);
      statuses.push(await this.tryAddLabel({
        label: Label.EXEMPTION_REQUESTED,
        exception: Label.EXEMPTION_DENIED,
      }));
    }
    return statuses;
  }

  private async tryAddLabel(options: TryAddLabelOptions): Promise<string> {
    if (this.pullRequestHasLabel(options.exception)) {
      return `Label '${options.label}' not added to PR ${this.props.pr} due to label '${options.exception}'.`;
    }

    if (this.pullRequestHasLabel(options.label)) {
      return `Label '${options.label}' not added to PR ${this.props.pr} because it has already been added.`;
    }

    const addLabelResponse = await this.addLabelToPullRequest(options.label);
    console.log(addLabelResponse);
    return `Label '${options.label}' added to PR ${this.props.pr}.`;
  }

  private async addLabelToPullRequest(label: string): Promise<ReturnType<typeof this.props.client.issues.addLabels>> {
    return this.props.client.issues.addLabels({
      ...this.repo,
      issue_number: this.props.pr,
      labels: [label],
    });
  }

  private async removeLabels(): Promise<string[]> {
    const statuses: string[] = [];
    if (this.commentHasText(CommentText.CLARIFICATION_NEEDED)) {
      statuses.push(`Comment deleted requesting clarification on PR ${this.props.pr}.`);
      statuses.push(await this.tryRemoveLabel(Label.CLARIFICATION_REQUESTED));
    }

    if (this.commentHasText(CommentText.EXEMPTION_REQUESTED)) {
      statuses.push(`Comment deleted requesting exemption on PR ${this.props.pr}.`);
      statuses.push(await this.tryRemoveLabel(Label.EXEMPTION_REQUESTED));
    }
    return statuses;
  }

  private async tryRemoveLabel(label: string): Promise<string> {
    if (this.pullRequestHasLabel(label)) {
      const removeLabelResponse = await this.removeLabelFromPullRequest(label);
      console.log(removeLabelResponse);
      return `Label '${label}' removed from PR ${this.props.pr}.`;
    }

    return `Label '${label}' not removed from PR ${this.props.pr} because it was not present.`;
  }

  private async removeLabelFromPullRequest(label: string) {
    return this.props.client.issues.removeLabel({
      ...this.repo,
      issue_number: this.props.pr,
      name: label,
    });
  }

  private commentHasText(text: CommentText): boolean {
    return this.props.comment.toLowerCase().includes(text);
  }

  private pullRequestHasLabel(label?: string): boolean {
    return label ? this.labels.includes(label) : false;
  }
}