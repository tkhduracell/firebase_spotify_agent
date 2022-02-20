/* eslint-disable @typescript-eslint/no-var-requires */
const moment = require('moment')
const commitHash = require('child_process')
  .execSync('git rev-parse --short HEAD')
  .toString()
  .trim()

module.exports = {
  devServer: {
    headers: {}
  },

  chainWebpack: config => {
    config.plugin('html').tap(args => {
      args[0].title = 'Spotify Agent'
      return args
    })

    config.plugin('define').tap(args => {
      const envs = args[0]['process.env']
      envs.BUILD_GIT_COMMIT_HASH = '"' + commitHash + '"'
      envs.BUILD_TIME = '"' + moment().format('YYYY-MM-DD HH:mm:SS') + '"'
      return args
    })

    config.module.rule('eslint').use('eslint-loader').options({
      fix: true
    })
  }
}
