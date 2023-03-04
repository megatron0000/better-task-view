const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  // no need for production shenanigans since our JS code
  // is embedded inside the final executable (better-task-view.exe)
  mode: "development",
  target: ["web", "es5"],

  // loads various polyfills, and then
  // our main index.js
  entry: [
    "./vendor/polyfills/keyboard-polyfill.js",
    "./vendor/polyfills/array-polyfill.js",
    "./vendor/polyfills/promise-polyfill.js",
    "./vendor/polyfills/isconnected-polyfill.js",
    "./vendor/polyfills/remove-polyfill.js",
    "./src/web/index.js",
  ],

  // disable top-level arrow function (syntax error in Neutron)
  output: {
    environment: {
      arrowFunction: false,
    },
  },

  module: {
    rules: [
      // babel so that we can use ES6 in source code and still
      // map it to something old IE can understand
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
            targets: { ie: "8" },
          },
        },
      },
      // CSS loader so that we can import() CSS inside JS
      // instead of dumping lots of <link> tags into index.html
      {
        test: /\.css$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              esModule: false, // to avoid problems with CSS url()
            },
          },
        ],
      },
    ],
  },

  // inserts our JS bundle as a <script> tag inside the HTML file template
  plugins: [
    new HtmlWebpackPlugin({
      template: __dirname + "/src/web/index.html",
      minify: false,
    }),
  ],
};
