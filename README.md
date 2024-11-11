# Auras and Emanations

Add auras to any character token.

![Interface](./docs/header.jpg)

## Features
- Adds a context menu item to character and mount token images.
- Auras will display the correct shape for the current grid type and grid measurement type.
- Auras will automatically resize after tokens are scaled.
- Manage any number of auras with any color / opacity.

Example:
![Example](./docs/menu.png)

## Installing

The extension can be installed from https://owlbear-emanation.pages.dev/manifest.json.

Eventually on [store page](https://extensions.owlbear.rodeo/owlbear-emanation).

## Development

After checkout, run `yarn dlx @yarnpkg/sdks vscode` to set up development in VS Code.

## How it Works

This project is a simple Typescript app.

The background script `background.ts` communicates with Owlbear Rodeo to create a context menu item. When that item is clicked a popup is shown with the `contextmenu.ts` site rendered.

The `action.html` page is rendered as an action item, which controls global settings for auras.

## Building

This project uses [Yarn](https://yarnpkg.com/) as a package manager.

To install all the dependencies run:

`yarn`

To run in a development mode run:

`yarn dev`

To make a production build run:

`yarn build`

## To do
- Update auras when image alignment changes
- Find more ways to skip rebuilds (debounce, track builder)
- More effects!
- https://www.raulmelo.me/en/blog/making-the-switch-to-pnpm

## License

GNU GPLv3
