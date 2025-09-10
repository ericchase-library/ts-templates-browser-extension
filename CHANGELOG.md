Please refer to the `ts-library` changelog for library and build tool changes:

- https://github.com/ericchase-library/ts-library/blob/main/CHANGELOG.md

## 2025-10-01

## 2025-09-01

- Some minor changes here and there

## 2025-08-19

- Removed `release/chrome/browser-extension-v0.0.0.zip` and `release/firefox/browser-extension-v0.0.0.zip` from repo and commit history using `git-filter-repo`
  - Added those paths to `.gitignore`

## 2025-08-16

- The `Processor_Browser_Extension_Update_Manifest_Cache` processor now `node.path.joins()` `Builder.Dir.Src` and `config.manifest_path`. All processed files are expected to reside under the `src` folder, so I decided to lightly enforce this design decision.

## 2025-08-07

- Upgraded to Build Tools v4

## 2025-03-28

- Upgraded to Build Tools v2
