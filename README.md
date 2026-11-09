# Compas Remake

Compas Remake is a fork of [CodeKompas by Joris Petillion](https://github.com/Jpetillion/CodeKompas). It offers local learning hints for HTML, CSS, and JavaScript in Visual Studio Code.

- Switch between English and Dutch from the CodeKompas sidebar.
- See the highlighted code, line and column, and an explanation of each hint.
- Open **Check it yourself** for guided steps and examples on common issues.
- Check the version in the upper-right corner of the sidebar.

## Install in VS Code

Download the VSIX from [GitHub Releases](https://github.com/player1error/compas-remake/releases). In VS Code, open the Command Palette, choose **Extensions: Install from VSIX…**, and select the file. Open the CodeKompas sidebar using the compass icon.

The GitHub build keeps the existing CodeKompas extension ID so it can update the previously installed local version.

## Build and test

```sh
npm ci
npm run bundle
npm test
npm run package
```

The original [Dutch documentation](README.nl.md) is included. Compas Remake retains the [MIT license and copyright notice](LICENSE).
