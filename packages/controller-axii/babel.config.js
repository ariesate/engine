// TODO 神奇了，改成 .babelrc include 就失效了。
module.exports = {
  "presets": [
    "@babel/react",
    "@babel/preset-env"
  ],
  "plugins": [
    [
      "@babel/plugin-transform-react-jsx",
      {
        "pragma": "createElement",
        "pragmaFrag": "Fragment"
      }
    ],
    [
      "@babel/plugin-proposal-class-properties"
    ]
  ],
  "include": ["./src", "../engine"]
}
