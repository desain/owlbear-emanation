# Emanations

Add emanations to any character.

![Interface](./docs/header.jpg)

## Features
- Emanations will display the correct shape for the current grid type and grid measurement type.
- Emanations will automatically resize after tokens are scaled.
- Manage any number of emanations with any color.

## Installing

The extension can be installed from https://owlbear-emanation.pages.dev/manifest.json.

Eventually on [store page](https://extensions.owlbear.rodeo/owlbear-emanation).

## How it Works

This project is a simple Typescript app.

The background script `background.ts` communicates with Owlbear Rodeo to create a context menu item. When that item is clicked a popup is shown with the `contextmenu.ts` site rendered.

The `action.html` page is rendered as an action item, which controls global settings for emanations.

## Building

This project uses [Yarn](https://yarnpkg.com/) as a package manager.

To install all the dependencies run:

`yarn`

To run in a development mode run:

`yarn dev`

To make a production build run:

`yarn build`

## To do
- Light and dark mode
- Update emanations when image alignment changes
- Debounce rebuilds
- Refocus size after rebuild
- Clockwise polygons

### Grabtool
- Key to drop a point at current spot
- Allow measure on non token
- Watch items and remove sequence if current item changes

## License

GNU GPLv3
