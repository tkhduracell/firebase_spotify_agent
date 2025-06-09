/* eslint-disable @typescript-eslint/no-var-requires */
const moment = require('moment')
const commitHash = require('child_process')
  .execSync('git rev-parse --short HEAD')
  .toString()
  .trim()

/**
 * @type {import('@vue/cli-service').ProjectOptions}
 */
module.exports = {
  devServer: {
    headers: {}
  },
  
  css: {
    loaderOptions: {
      sass: {
        sassOptions: {
          quietDeps: true
        }
      }
    }
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
  }
}
