import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import * as path from 'path'
import * as webpack from 'webpack'

// tslint:disable-next-line:no-var-requires
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

export default (env, context) => {
  const bundlePath = path.join(__dirname, 'dist')
  return {
    devServer: {
      contentBase: path.join(__dirname, 'dist'),
      compress: true,
      open: true,
      historyApiFallback: true,
      port: 8888,  // 请不要用8080，本地的8080端口经常被其他服务占用了
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.scss', '.less'],
    },
    externals: {
      'react': 'React',
      'react-dom': 'ReactDOM',
      'antd': 'antd',
      'lodash': {
        commonjs: 'lodash',
        commonjs2: 'lodash',
        amd: 'lodash',
        root: '_',
      },
      'moment': 'moment',
    },
    entry: {
      app: './index.tsx',
    },
    output: {
      publicPath: '/',
      path: bundlePath,
      filename: '[name].js',
      library: '[name]',
      libraryTarget: 'umd',
    },
    module: {
      rules: [
        {
          test: /\.scss$/,
          include: [
            path.resolve(__dirname, 'src'),
          ],
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                modules: true,
                sourceMap: true,
              },
            },
            {
              loader: 'sass-loader',
              options: {
                sourceMap: true,
              },
            },
          ],
        },
        {
          test: /\.(tsx?|jsx?)$/,
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            compilerOptions: {
              traceResolution: false,
            },
          },
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify(process.env.NODE_ENV),
        },
      }),
      new MiniCssExtractPlugin({
        filename: '[name].css',
        chunkFilename: '[name].css',
      }),
      new HtmlWebpackPlugin({
        filename: 'index.html',
        template: './index.html',
        // chunks: ['app'],
        // inject: false,
        // hash: true,
      }),
    ],
  }
}
