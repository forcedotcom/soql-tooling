const webpack = require('webpack');
module.exports =
{
  output: {
    filename: "app.js"
  },
  resolve: {
    fallback: {
      fs: false
    },
    alias: {
      os: "os-browserify/browser"
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser',
      util: 'util/',
      assert: 'assert/'
    })
  ]
}
