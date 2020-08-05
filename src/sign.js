const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const tmpl = require('blueimp-tmpl');
const openpgp = require('openpgp');

async function run() {
  try {
    const template = fs.readFileSync('templates/' + core.getInput('template'), 'utf8');
    const destination = core.getInput('destination');
    const primary = core.getInput('primary');
    const secondary = core.getInput('secondary');

    const { context } = github;
    const octokit = github.getOctokit(process.env.GITHUB_TOKEN);

    const { owner, repo } = context.repo;
    const commitSha = context.payload.after;
    const { ref } = context;

    let label = commitSha;

    const commit = await octokit.git.getCommit({ owner, repo, commit_sha: commitSha });

    if (/^refs\/tags\//.test(ref)) {
      label = ref.replace('refs/tags/', '');
    }

    if (commit.data.verification.verified === false) {
      throw new Error('Commit must be signed and verified with GitHub.');
    }

    const { signature } = commit.data.verification;

    const key = (
      await openpgp.message.readArmored(signature)
    )
      .getSigningKeyIds()[0]
      .toHex()
      .toUpperCase();

    const data = {
      theme: {
        primary,
        secondary,
      },
      commit: {
        url: commit.data.parents[0].html_url,
        label,
        at: commit.data.author.date,
        key,
      },
      author: {
        name: commit.data.author.name,
        email: commit.data.author.email,
      },
    };

    fs.writeFileSync(destination, tmpl(template, data));

    core.setOutput('signature', destination);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
