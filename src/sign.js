const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const tmpl = require('blueimp-tmpl');
const openpgp = require('openpgp');
const path = require('path');

async function run() {
  try {
    const { context } = github;
    const octokit = github.getOctokit(process.env.GITHUB_TOKEN);
    const { owner, repo } = context.repo;

    let label = null;
    let verification = null;
    let author = null;

    const { data: reference } = await octokit.request('GET /repos/:owner/:repo/git/refs/:ref', {
      repo,
      owner,
      ref: context.ref.replace('refs/', ''),
    });

    if (reference.object.type === 'tag') {
      const { data: tag } = await octokit.git.getTag({
        owner,
        repo,
        tag_sha: reference.object.sha,
      });

      label = reference.ref.replace('refs/tags/', '');
      author = tag.tagger;
      verification = tag.verification;
    }

    if (reference.object.type === 'commit') {
      const { data: commit } = await octokit.git.getCommit({
        owner,
        repo,
        commit_sha: reference.object.sha,
      });

      label = reference.object.sha;
      author = commit.author;
      verification = commit.verification;
    }

    if (verification == null || verification.verified === false) {
      throw new Error('Object (commit, tag) must be signed and verified with GitHub.');
    }

    const key = (
      await openpgp.message.readArmored(verification.signature)
    )
      .getSigningKeyIds()[0]
      .toHex()
      .toUpperCase();

    const destination = core.getInput('destination');
    const primary = core.getInput('primary');
    const secondary = core.getInput('secondary');
    const template = fs.readFileSync(
      `${path.dirname(eval('__filename'))}/../templates/${core.getInput('template')}`,
      'utf8',
    );

    const url = `https://github.com/${owner}/${repo}/tree/${label}`;

    const data = {
      theme: { primary, secondary },
      object: { url, label, key },
      author,
    };

    fs.writeFileSync(destination, tmpl(template, data));

    core.setOutput('signature', destination);
    core.setOutput('label', label);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
