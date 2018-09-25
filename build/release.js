const { version } = require('../packages/marklet/package.json')
const { major, minor } = require('semver')
const github = new (require('@octokit/rest'))()
const tag = `v${major(version)}.${minor(version)}`

github.authenticate({
  type: 'oauth',
  token: process.env.GITHUB_OAUTH
})

github.repos.createRelease({
  repo: 'Marklet',
  owner: 'obstudio',
  tag_name: tag,
  name: tag,
}).then(() => {
  console.log('Release created successfully.')
})
