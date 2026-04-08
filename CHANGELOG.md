# Change Log

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
