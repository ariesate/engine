/**
 * @type {import('@jest/types').Config.InitialOptions}
 */
const config = {
  transform: {
    "^.+\\.[t|j]sx?$": [
      "esbuild-jest",
      {
        "jsxFactory": "createElement",
        "jsxFragment": "Fragment",
        "sourcemap": 'inline',
      }
    ]
  },
  coverageReporters: [
    'text'
  ],
  setupFilesAfterEnv: [
    "./jest.setup.js"
  ],
  testEnvironment: 'jsdom',
  globals: {
    __DEV__: true
  }
}

export default config