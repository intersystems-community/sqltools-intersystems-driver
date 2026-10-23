# Change Log

## [0.3.1] 23-Oct-2026
- Dependency updates
  - Bump @babel/core and @babel/preset-env (#85)
  - Bump @babel/plugin-transform-modules-systemjs from 7.22.5 to 7.29.4 (#79)
  - Bump @vscode/vsce from 2.19.0 to 3.9.2 (#84)
  - Bump brace-expansion from 5.0.6 to 5.0.12 (#86, #96)
  - Bump browserslist from 4.28.1 to 4.28.8 (#92)
  - Bump fast-uri from 3.1.0 to 3.1.7 (#80, #88, #89, #91)
  - Bump js-yaml from 4.2.0 to 4.3.2 (#90, #95)
  - Bump linkify-it from 5.0.1 to 5.0.2 (#87)
  - Bump markdown-it from 12.3.2 to 14.3.3 (#84, #98)
  - Bump qs from 6.15.0 to 6.15.2 (#81)
  - Bump rimraf from 3.0.2 to 6.1.3 (#86)
  - Bump tmp from 0.2.4 to 0.2.7 (#82)
  - Bump uuid from 8.3.2 to 14.0.0 (#78)

## [0.3.0] 07-Apr-2026
- Enhancements
  - Add `resultSetRowLimit` extension setting to cap query rows (#62)
  - Handle duplicate column names in query results when using IRIS 2023.1+ (#61)
- Bug Fixes
  - Respect `http.rejectUnauthorized` VS Code setting for self-signed certificates (#70)
- Refactoring
  - Remove `request-promise` dependency, replacing with native Node.js HTTP handling
- Documentation
  - Revise SQL getting started exercises link
  - Add contributors section to package.json (#64)
- Dependency updates
  - Bump serialize-javascript, terser-webpack-plugin (#77)
  - Bump picomatch 2.3.1 → 2.3.2 (#76)
  - Bump minimatch 3.1.2 → 3.1.5 (#75)
  - Bump ajv 6.12.6 → 6.14.0 (#74)
  - Bump webpack 5.94.0 → 5.105.0 (#73)
  - Bump lodash 4.17.21 → 4.17.23 (#72)
  - Bump tar-fs 2.1.1 → 2.1.4 (#65, #68, #71)
  - Bump tmp 0.2.1 → 0.2.4 (#69)
  - Bump @babel/helpers 7.22.5 → 7.27.0 (#66)

## [0.2.0] 05-Feb-2025
- Enhancements
  - Support use of Server Manager connection definitions (#60)
