/**
 * Created by arey on 4/28/17.
 */
const environmentHelper = require('./helpers/EnvironmentHelper');
const config = require('config');
const webpack = require('webpack');
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CleanCSSPlugin = require('less-plugin-clean-css');

const port = config.get('app.port');
const baseDirectory = __dirname;

const extractLess = new ExtractTextPlugin({
  filename: "[name].css"
});

module.exports = {
  entry: entryPoint({
    index: path.join(baseDirectory, '/app/client/index.js')
  }),
  // the bundle file we will get in the result
  output: {
    publicPath: 'http://localhost:' + port + '/',
    path: path.join(baseDirectory, 'bundles'),
    //path: '/',
    filename: '[name].js',
  },
  module: {
    // apply loaders to files that meet given conditions
    rules: [
      {
        test: /\.js?$/,
        include: path.join(baseDirectory, '/app'),
        use: [
          {
            loader: 'babel-loader'
          }
        ]
      },
      styleLoader()
    ]
  },
  plugins: pluginsToLoad(),
  target: 'web'
};

/**
 * Add modules to entry point only when its development
 * @param entry
 * @returns {*}
 */
function entryPoint(entry) {
  const devEntries = ['react-hot-loader/patch', 'webpack-hot-middleware/client'];

  if (Array.isArray(entry)) {
    return {
      main: (environmentHelper.isDevelopment()) ? devEntries.concat(entry) : entry
    }
  } else if (typeof entry === 'string') {
    return {
      main: (environmentHelper.isDevelopment()) ? devEntries.concat([entry]) : [entry]
    }
  } else if (typeof entry === 'object') {
    Object.keys(entry).forEach((entryName) => {
      if (!Array.isArray(entry[entryName])) {
        entry[entryName] = (environmentHelper.isDevelopment()) ? devEntries.concat([entry[entryName]]) : [entry[entryName]]
      } else {
        entry[entryName] = (environmentHelper.isDevelopment()) ? devEntries.concat(entry[entryName]) : entry[entryName]
      }
    });
    return entry;
  } else {
    throw new Error(`Expected entry point to be object, array or string. Instead got: ${entry}`);
  }
}

function styleLoader() {
  let lessLoaderPlugins = [];

  if(!environmentHelper.isDevelopment()){
    lessLoaderPlugins.push(
      new CleanCSSPlugin({
        advanced: true,
        minify: true
      })
    )
  }

  return {
    test: /\.(css|less)$/,
    use: extractLess.extract({
      use: [{
        loader: 'css-loader'
      }, {
        loader: 'autoprefixer-loader'
      }, {
        loader: 'less-loader',
        options: {
          plugins: lessLoaderPlugins
        }
      }],
      fallback: 'style-loader'
    })
  }
}

function pluginsToLoad() {
  let plugins = [];

  // Always extract the CSS
  plugins.push(extractLess);

  if (environmentHelper.isDevelopment()) {
    plugins = plugins.concat([
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NoEmitOnErrorsPlugin()
    ]);
  }else{
    // This must be the first plugin
    plugins.unshift(
      new CleanWebpackPlugin([path.join(baseDirectory, 'bundles')], {
        verbose: true,
        allowExternal: true
      })
    );

    plugins = plugins.concat([
      new webpack.optimize.UglifyJsPlugin({
        compress: {
          warnings: false
        },
        output: {
          comments: false
        },
        screwIe8: true,
        sourceMap: false
      })
    ])
  }

  return plugins;
}