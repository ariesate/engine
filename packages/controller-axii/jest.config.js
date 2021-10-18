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
  coverageReporters: [
    'text'
  ],
  setupFilesAfterEnv: [
    "./jest.setup.js"
  ],
  testEnvironment: 'jsdom'
}

export default config