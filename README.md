# Emanations

Add emanations to any character

![Interface](./docs/header.jpg)

## Installing

The extension can be installed from the [store page](https://extensions.owlbear.rodeo/owlbear-emanation).

## How it Works

This project is a simple Typescript app.

The background script `background.ts` communicates with Owlbear Rodeo to create a context menu item. When that item is clicked a popup is shown with the `main.ts` site rendered.

## Building

This project uses [Yarn](https://yarnpkg.com/) as a package manager.

To install all the dependencies run:

`yarn`

To run in a development mode run:

`yarn dev`

To make a production build run:

`yarn build`

## License

GNU GPLv3
