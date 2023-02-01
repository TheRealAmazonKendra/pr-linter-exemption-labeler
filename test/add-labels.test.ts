import { CommentText, GitHubLabel, Label, PullRequestCommentBasedLabelManager } from '../src/add-labels';

describe('labeler interactions', () => {
  test('no-op', async () => {
    expect(true).toEqual(true);
  });
});

// Create or Update
describe('add labels on comment created or updated', () => {
  test('add label for clarification needed when requested in comment', async () => {
    const labelManager = configureMock('created', 'I have a clarification request.', []);
    expect(await labelManager.manageLabels()).toEqual([
      'Clarification requested on PR 123.',
      'Label \'pr/reviewer-clarification-requested\' added to PR 123.',
    ]);
  });

  test('add label for clarification needed when requested in comment regardless of casing and extra letters', async () => {
    const labelManager = configureMock('updated', 'cLaRiFiCaTiOn ReQuEsTed', []);
    expect(await labelManager.manageLabels()).toEqual([
      'Clarification requested on PR 123.',
      'Label \'pr/reviewer-clarification-requested\' added to PR 123.',
    ]);
  });

  test('add label for exemption needed when requested in comment', async () => {
    const labelManager = configureMock('updated', 'exemption request please', []);
    expect(await labelManager.manageLabels()).toEqual([
      'Exemption requested on PR 123.',
      'Label \'pr-linter/exemption-requested\' added to PR 123.',
    ]);
  });

  test('add label for exemption needed when requested in comment regardless of casing', async () => {
    const labelManager = configureMock('created', 'eXeMpTiOn ReQuEsTeD', []);
    expect(await labelManager.manageLabels()).toEqual([
      'Exemption requested on PR 123.',
      'Label \'pr-linter/exemption-requested\' added to PR 123.',
    ]);
  });

  test('do not add label for exemption requested when exemption denied label is present', async () => {
    const labelManager = configureMock('created', CommentText.EXEMPTION_REQUESTED, [Label.EXEMPTION_DENIED]);
    expect(await labelManager.manageLabels()).toEqual([
      'Exemption requested on PR 123.',
      'Label \'pr-linter/exemption-requested\' not added to PR 123 due to label \'pr-linter/no-exemption\'.',
    ]);
  });

  test('add label for clarification requested even when exemption denied label is present', async () => {
    const labelManager = configureMock('updated', CommentText.CLARIFICATION_NEEDED, [Label.EXEMPTION_DENIED]);
    expect(await labelManager.manageLabels()).toEqual([
      'Clarification requested on PR 123.',
      'Label \'pr/reviewer-clarification-requested\' added to PR 123.',
    ]);
  });

  test('add label for both when both are requested and no denial has been given', async () => {
    const labelManager = configureMock('created', 'clarification requested and exemption requested', []);
    expect(await labelManager.manageLabels()).toEqual([
      'Clarification requested on PR 123.',
      'Label \'pr/reviewer-clarification-requested\' added to PR 123.',
      'Exemption requested on PR 123.',
      'Label \'pr-linter/exemption-requested\' added to PR 123.',
    ]);
  });

  test('add label for just clarification when both are requested and a exemption has been denied', async () => {
    const labelManager = configureMock('created', 'Clarification requested and Exemption requested', [Label.EXEMPTION_DENIED]);
    expect(await labelManager.manageLabels()).toEqual([
      'Clarification requested on PR 123.',
      'Label \'pr/reviewer-clarification-requested\' added to PR 123.',
      'Exemption requested on PR 123.',
      'Label \'pr-linter/exemption-requested\' not added to PR 123 due to label \'pr-linter/no-exemption\'.',
    ]);
  });

  test('add label for neither when neither are requested', async () => {
    const labelManager = configureMock('updated', 'All good here. This comment is for something else', []);
    expect(await labelManager.manageLabels()).toEqual([]);
  });

  test('add no label when clarification is requested but label is already present', async () => {
    const labelManager = configureMock('updated', CommentText.CLARIFICATION_NEEDED, [Label.CLARIFICATION_REQUESTED]);
    expect(await labelManager.manageLabels()).toEqual([
      'Clarification requested on PR 123.',
      'Label \'pr/reviewer-clarification-requested\' not added to PR 123 because it has already been added.',
    ]);
  });

  test('add no label when exemption is requested but label is already present', async () => {
    const labelManager = configureMock('created', CommentText.EXEMPTION_REQUESTED, [Label.EXEMPTION_REQUESTED]);
    expect(await labelManager.manageLabels()).toEqual([
      'Exemption requested on PR 123.',
      'Label \'pr-linter/exemption-requested\' not added to PR 123 because it has already been added.',
    ]);
  });

  test('add label for clarification when exemption label is already present', async () => {
    const labelManager = configureMock('updated', CommentText.CLARIFICATION_NEEDED, [Label.EXEMPTION_REQUESTED]);
    expect(await labelManager.manageLabels()).toEqual([
      'Clarification requested on PR 123.',
      'Label \'pr/reviewer-clarification-requested\' added to PR 123.',
    ]);
  });

  test('add label for exemption when clarification label is already present', async () => {
    const labelManager = configureMock('created', CommentText.EXEMPTION_REQUESTED, [Label.CLARIFICATION_REQUESTED]);
    expect(await labelManager.manageLabels()).toEqual([
      'Exemption requested on PR 123.',
      'Label \'pr-linter/exemption-requested\' added to PR 123.',
    ]);
  });

  test('add label for clarification but not exception when both are requested but exemption label is already present', async () => {
    const labelManager = configureMock('updated', 'Clarification requested and Exemption requested', [Label.EXEMPTION_REQUESTED]);
    expect(await labelManager.manageLabels()).toEqual([
      'Clarification requested on PR 123.',
      'Label \'pr/reviewer-clarification-requested\' added to PR 123.',
      'Exemption requested on PR 123.',
      'Label \'pr-linter/exemption-requested\' not added to PR 123 because it has already been added.',
    ]);
  });

  test('add label for exemption but not clarification when both are requested and clarification label is already present', async () => {
    const labelManager = configureMock('updated', 'Clarification requested and Exemption requested', [Label.CLARIFICATION_REQUESTED]);
    expect(await labelManager.manageLabels()).toEqual([
      'Clarification requested on PR 123.',
      'Label \'pr/reviewer-clarification-requested\' not added to PR 123 because it has already been added.',
      'Exemption requested on PR 123.',
      'Label \'pr-linter/exemption-requested\' added to PR 123.',
    ]);
  });

  test('add label for clarification but not exemption when both are requested but exemption has been denied', async () => {
    const labelManager = configureMock('created', 'Clarification requested and Exemption requested', [Label.EXEMPTION_DENIED]);
    expect(await labelManager.manageLabels()).toEqual([
      'Clarification requested on PR 123.',
      'Label \'pr/reviewer-clarification-requested\' added to PR 123.',
      'Exemption requested on PR 123.',
      'Label \'pr-linter/exemption-requested\' not added to PR 123 due to label \'pr-linter/no-exemption\'.',
    ]);
  });
});

// Delete
describe('remove labels on comment deletion', () => {
  test('clarification requested and label is present on PR', async () => {
    const labelManager = configureMock('deleted', CommentText.CLARIFICATION_NEEDED, [Label.CLARIFICATION_REQUESTED]);
    expect(await labelManager.manageLabels()).toEqual([
      'Comment deleted requesting clarification on PR 123.',
      'Label \'pr/reviewer-clarification-requested\' removed from PR 123.',
    ]);
  });

  test('clarification requested but label is not present on PR', async () => {
    const labelManager = configureMock('deleted', CommentText.CLARIFICATION_NEEDED, []);
    expect(await labelManager.manageLabels()).toEqual([
      'Comment deleted requesting clarification on PR 123.',
      'Label \'pr/reviewer-clarification-requested\' not removed from PR 123 because it was not present.',
    ]);
  });

  test('exemption requested and label is present on PR', async () => {
    const labelManager = configureMock('deleted', CommentText.EXEMPTION_REQUESTED, [Label.EXEMPTION_REQUESTED]);
    expect(await labelManager.manageLabels()).toEqual([
      'Comment deleted requesting exemption on PR 123.',
      'Label \'pr-linter/exemption-requested\' removed from PR 123.',
    ]);
  });

  test('exemption requested but label is not present on PR', async () => {
    const labelManager = configureMock('deleted', CommentText.EXEMPTION_REQUESTED, []);
    expect(await labelManager.manageLabels()).toEqual([
      'Comment deleted requesting exemption on PR 123.',
      'Label \'pr-linter/exemption-requested\' not removed from PR 123 because it was not present.',
    ]);
  });

  test('both requested and labels are present on PR', async () => {
    const labelManager = configureMock('deleted', 'exemption requested and clarification requested', [
      Label.CLARIFICATION_REQUESTED,
      Label.EXEMPTION_REQUESTED,
    ]);
    expect(await labelManager.manageLabels()).toEqual([
      'Comment deleted requesting clarification on PR 123.',
      'Label \'pr/reviewer-clarification-requested\' removed from PR 123.',
      'Comment deleted requesting exemption on PR 123.',
      'Label \'pr-linter/exemption-requested\' removed from PR 123.',
    ]);
  });

  test('both requested but neither are present on PR', async () => {
    const labelManager = configureMock('deleted', 'exemption requested and clarification requested', []);
    expect(await labelManager.manageLabels()).toEqual([
      'Comment deleted requesting clarification on PR 123.',
      'Label \'pr/reviewer-clarification-requested\' not removed from PR 123 because it was not present.',
      'Comment deleted requesting exemption on PR 123.',
      'Label \'pr-linter/exemption-requested\' not removed from PR 123 because it was not present.',
    ]);
  });

  test('clarification requested but exemption request label is on PR', async () => {
    const labelManager = configureMock('deleted', CommentText.CLARIFICATION_NEEDED, [Label.EXEMPTION_REQUESTED]);
    expect(await labelManager.manageLabels()).toEqual([
      'Comment deleted requesting clarification on PR 123.',
      'Label \'pr/reviewer-clarification-requested\' not removed from PR 123 because it was not present.',
    ]);
  });

  test('exemption requested but clarification request is on PR', async () => {
    const labelManager = configureMock('deleted', CommentText.EXEMPTION_REQUESTED, [Label.CLARIFICATION_REQUESTED]);
    expect(await labelManager.manageLabels()).toEqual([
      'Comment deleted requesting exemption on PR 123.',
      'Label \'pr-linter/exemption-requested\' not removed from PR 123 because it was not present.',
    ]);
  });

  test('neither requested but both labels are present on PR', async () => {
    const labelManager = configureMock('deleted', 'nothing needed here', [Label.CLARIFICATION_REQUESTED, Label.EXEMPTION_REQUESTED]);
    expect(await labelManager.manageLabels()).toEqual([]);
  });

  test('neither requested and neither labels are present on PR', async () => {
    const labelManager = configureMock('deleted', 'still need nothing', []);
    expect(await labelManager.manageLabels()).toEqual([]);
  });
});


function configureMock(action: string, comment: string, labels: string[]) {
  const issuesMockClient = {
    addLabels() {},
    removeLabel() {},
  };
  return new PullRequestCommentBasedLabelManager({
    owner: 'aws',
    repo: 'aws-cdk',
    comment,
    pr: 123,
    labels: labels.map(label => ({ name: label } as GitHubLabel)),
    action,
    client: {
      issues: issuesMockClient as any,
    } as any,
  });
}