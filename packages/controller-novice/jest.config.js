/**
 * @type {import('@jest/types').Config.InitialOptions}
 */
const config = {
  transform: {
    "^.+\\.[t|j]sx?$": [
      "esbuild-jest",
      {
        "jsxFactory": "createElement",
      }
    ]
  },
  coverageReporters: [
    'text'
  ],
  testEnvironment: 'jsdom'
}

export default config
