#!/usr/bin/env node

const { execSync } = require('child_process')
const { TRAVIS_BRANCH, TRAVIS_PULL_REQUEST, TRAVIS_PULL_REQUEST_SHA } = process.env

if (TRAVIS_PULL_REQUEST && TRAVIS_BRANCH === 'master') {
  const previous = execSync('npm show markletjs version').toString('utf8').trim()
  const current = JSON.parse(execSync(`git show ${TRAVIS_PULL_REQUEST_SHA}:package.json`).toString('utf8')).version
  if (previous === current) {
    console.log('The version number did not increase')
    process.exit(1)
  } else {
    console.log(`The version number increases from ${previous} to ${current}`)
    process.exit(0)
  }
} else {
  console.log('Not a deploy-related commit')
  process.exit(0)
}
