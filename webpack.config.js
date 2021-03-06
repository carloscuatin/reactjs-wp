// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development'

const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ip = require('ip')
const opener = require('opener')
const webpack = require('webpack')
const merge = require('webpack-merge')
const parts = require('./libs/webpack.parts')

const host = process.env.REACTJS_HOST || ip.address()
const port = process.env.REACTJS_PORT || 3000
const apiUrl = process.env.REACTJS_API_URL || `http://${ip.address()}:${8080}/api`
const PATHS = {
  app: path.join(__dirname, 'app'),
  dist: path.join(__dirname, 'dist')
}

const common = merge([
  // Common settings
  {
    entry: {
      app: PATHS.app
    },
    output: {
      path: PATHS.dist,
      filename: '[name].js'
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify(process.env.NODE_ENV),
          REACTJS_API_URL: JSON.stringify(apiUrl)
        }
      }),
      new HtmlWebpackPlugin({
        template: './app/index.html'
      })
    ],
    resolve: {
      extensions: ['.jsx', '.js', '.json', '.css']
    },
    module: {
      rules: [{
        test: /\.html$/,
        include: PATHS.app,

        use: 'html-loader'
      }]
    }
  },

  parts.lintCSS(PATHS.app),
  parts.loadImages(PATHS.app),
  parts.loadFonts(PATHS.app),
  parts.loadAssets(PATHS.app)
])

module.exports = ({
  target
}) => {
  // Return production configuration
  if (target === 'production') {
    return merge([
      common,
      {
        output: {
          filename: '[name].[chunkhash].js'
        },
        plugins: [
          new webpack.HashedModuleIdsPlugin()
        ]
      },
      parts.extractBundles(),
      parts.clean(PATHS.dist),
      parts.loadJS({
        paths: PATHS.app
      }),
      parts.minify(),
      parts.extractCSS(PATHS.app)
    ])
  }

  // Run opener
  opener(`http://${host}:${port}`)

  // Return development configurations
  return merge([
    common,
    {
      plugins: [
        new webpack.NamedModulesPlugin()
      ]
    },
    parts.generateSourcemaps('#inline-source-map'),
    parts.loadCSS(PATHS.app),
    parts.devServer({
      // Customize host/port here if needed
      host,
      port
    }),
    parts.loadJS({
      paths: PATHS.app,
      eslintOptions: {
        // Emit warnings over errors to avoid crashing
        // HMR on error.
        emitWarning: true
      }
    })
  ])
}
