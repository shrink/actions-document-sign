# Document Sign

A GitHub Action for generating an Electronic Signature for your commit, tag or
release. Designed to be used as part of a workflow which
[publishes signed documents][publish].

```yaml
shrink/actions-document-sign@v1
```

## Requirements

* An Electronic Signature is only produced for a commit that is
  [signed and verified][signed-commits], the action will fail for a commit that
  is not signed or signed but not verified.

## Inputs

All inputs are optional, by default your Electronic Signature destination is
`.signature` in the workspace directory.

| ID  | Description | Example |
| --- | ----------- | ------- |
| `destination` | Filepath to the signature's destination | `.signature` |
| `template` | Filepath to a template, either an [included template][templates] or your own | `cute.html` |
| `primary` | Primary colour in template | `#1e7e34` |
| `secondary` | Secondary colour in template | `#2f80ed` |

### Templates

#### `cute.html`

A simple HTML template suitable for use in HTML or Markdown.

## Notes

A number of dependencies must be included as part of the project due to
dynamic require behaviour used in openpgp that is not supported by the ncc build
tool ([#538][ncc-538]).

[signed-commits]: https://docs.github.com/en/github/authenticating-to-github/managing-commit-signature-verification
[templates]: #templates
[publish]: https://github.com/shrink/actions-document-publish
[ncc-538]: https://github.com/vercel/ncc/issues/538
