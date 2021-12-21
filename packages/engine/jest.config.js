/**
 * @type {import('@jest/types').Config.InitialOptions}
 */
const config = {
  transform: {
    "^.+\\.[t|j]sx?$": [
      "esbuild-jest",
      {
        "jsxFactory": "createElement",
        "jsxFragment": "Fragment"
      }
    ]
  },
  setupFilesAfterEnv: [
    "./jest.setup.js"
  ],
  testEnvironment: 'jsdom'
}

export default config
