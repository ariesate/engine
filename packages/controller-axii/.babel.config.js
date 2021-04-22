// TODO 神奇了，改成 .babelrc include 就失效了。
module.exports = {
  "presets": [
    "@babel/react",
    ["@babel/preset-env", {
      "exclude": [
        "@babel/plugin-transform-regenerator"
      ],
    }]
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
    ],
    ["module-resolver",
      {
        "alias": {
          "@ariesate/are": "../engine"
        }
      }],
    [
      "@babel/plugin-proposal-export-default-from"
    ]
  ],
  "include": ["./src", "../engine"]
}
