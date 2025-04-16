# Auras and Emanations

This extension allows you to add auras to any character in a variety of styles.

![Interface](https://github.com/user-attachments/assets/b5825f4a-1846-476f-849e-4e7d31efab78)

## Installing

The extension can be installed from https://owlbear-emanation.pages.dev/manifest.json.

(Eventually on a [store page](https://extensions.owlbear.rodeo/owlbear-emanation) maybe, though not yet)

## Features

-   Create auras from shapes, shader effects, or images.
-   Auras will display the correct shape for the current grid type and grid measurement type. (e.g when using Chebyshev / Chessboard D&D 5e distance, auras will be square)
-   Auras will automatically resize after tokens are scaled, so that their boundary is the correct distance away.
-   Manage any number of auras with any color, opacity, or style.

## How to use

### Adding an aura

![Add Aura](https://github.com/user-attachments/assets/ba002d01-ed73-4d9c-8445-d5269b0fc6d5)

Select one or more character tokens, then right click and click the 'Add Aura' item that appears on the context menu. You can also press 'E' (for Emanation - A for Aura was taken :P) while the context menu is open to add one quickly.

The aura will be centered on the source's origin point (the center of the controls you edit the item). This means that if the image's center is offset from the origin, the aura will not appear in the center of the image. This is intentional, to allow things like torches (with the origin at the head) to have glow auras emanate from the the head of the torch rather than the middle of the body.

### Editing aura parameters

![Edit Auras](https://github.com/user-attachments/assets/109a5abd-6bf7-442d-af0c-ee431cbbaa92)

When any selected token has at least one aura, you will see the 'Edit Auras' menu option (with the same 'E' shortcut), which lets you manage auras for those characters through the 'Aura Settings' action in the top left.

![Edit Tab](https://github.com/user-attachments/assets/0f2094c7-66c3-45cf-ad74-9650a568b8e6)

You can also open the action in the 'Edit' tab and then select tokens to add or edit auras.

Menu options:

-   **Style**: Display style of the aura (see below).
-   **Size**: Size of the aura, in the same units as the grid.
-   **Color**: Aura color. Editable with your browser's native color picker. By default, the color will be your player color.
-   **Opacity**: Aura opacity.
-   **Image**: For image auras, selects which image asset to use as the aura.
-   **Delete**: Remove this aura from the character.
-   **Copy to Clipboard**: Copy this aura's settings to your OS clipboard.
-   **New**: Add another aura to the characters using the aura settings from the 'Defaults' tab. If multiple characters are selected, this button will add a new aura to all of them.
-   **Paste**: Allows you to add a previously-copied aura to a token.
-   **Delete All**: Remove all auras from the selected characters.

Options under 'Advanced Options':

-   **Visibility**: Lets you control which players can see the aura.
-   **Blend Mode**: For shader-based auras, sets the graphical [blend mode](https://en.wikipedia.org/wiki/Blend_modes) for the shader. Ideas: 'PLUS' with the 'Glow' aura is good for simulating lights, and with a pure white 'Range' aura, 'DIFFERENCE' creates an area of negative color, and 'SATURATION' creates an aura that makes the world inside it grayscale.

#### Editing multiple auras at once

If you select multiple tokens which all share an aura, you can edit that aura on all the tokens at once. You will see a list of which tokens you are editing above the aura settings.

![Multi edit](https://github.com/user-attachments/assets/7b25bcf7-d4a1-4912-a47a-73b3d791f66c)

### Resizing tokens

https://github.com/user-attachments/assets/71ca78dc-01bd-4de4-b110-9d3072eba336

When you drag to resize a token, the aura will change size after you let go.

### Changing grid types

https://github.com/user-attachments/assets/bb7423a3-380e-4f74-baf2-605403ddbc5a

When you change the grid type or measurement type, auras will reshape to be appropriate for the new settings.

### Changing defaults

![Defaults Menu](https://github.com/user-attachments/assets/91d102ea-3f10-4399-bb32-5b34fb41d644)

To change the default settings for newly created auras, open the Aura Settings action menu in the top left and go to the 'Defaults' tab. These settings are saved to your browser's local storage, so they persist across game sessions (unless you clear your browser data).

### Changing global settings

The GM can also access scene-global settings under the Aura Settings action menu in the 'GM Settings' tab.

-   **Shape to grid**: When enabled, causes auras in the current scene to try to trace out the outline of grid squares within range. When disabled, auras trace the exact set of points within range of the source, even when that cuts through the middle of grid squares.
-   **Override Shape**: When set, causes auras to take on the specified shape, rather than conforming to a shape that traces out the points a certain distance away from the source based on the grid's current measurement settings.

![Settings Tab](https://github.com/user-attachments/assets/186ca429-72f3-4aa1-a45f-9a0119401441)

### Aura Styles

This extension supports several different aura styles. The different types are listed below.

#### Simple

![Simple](https://github.com/user-attachments/assets/2345b74a-3129-4639-9f79-bdffa8b90a63)

A filled area with a solid outline. The color control sets the color of both the fill and stroke, and the opacity controls the opacity of the fill.

#### Image

![Image](https://github.com/user-attachments/assets/e7e624c4-a4cf-47fa-ab88-906ddd3e8408)

An image from your assets. You can find some fun effect images from https://library.jb2a.com.

#### Bubble

![Bubble](https://github.com/user-attachments/assets/dc0f640a-3eae-4e3b-8926-6f5f6e13fdf5)

An area with a gradient that gets more opaque towards the edges. High opacity values are recommended.

Inspired by [these AoE tokens](https://drive.google.com/drive/folders/16EoOnBMzu2oerC98bZ3HdF4nfk9Fpw_5).

#### Glow

![Glow](https://github.com/user-attachments/assets/78afaee3-1adc-4bfe-b357-3a04a214bf4c)

An always-circular glow around the token that's lighter in the center. Useful for simulating torches!

#### Range

![Range](https://github.com/user-attachments/assets/1be43d2d-2553-43f2-a3eb-c4dc1811137a)

A rangefinder which steps from white to the aura color at each discrete grid unit. Supports all grid types. Darker aura colors are recommended for contrast.

#### Spirits

![Spirits](https://github.com/user-attachments/assets/88667f53-2a44-46a2-81b4-5dd4dd9326ed)

A fancy one just for fun! Displays animated trails that circle your character while changing color.

## Calling this extension from other extensions

If you're another extension developer, you can automate managing auras with this API. Create an object `message` of one of these types:

```typescript
interface CreateAurasMessage {
    type: "CREATE_AURAS";
    /**
     *  Item IDs for character images that will receive auras.
     */
    sources: string[];
    /**
     * Aura size, e.g 5 for 5ft.
     */
    size: number;
    /**
     * Style of aura to create. If not provided, the current player's default style will be used.
     */
    style?: "Simple" | "Image" | "Bubble" | "Glow" | "Range" | "Spirits";
    /**
     * Hex code, e.g "#d00dad". If not provided, the current player's default color will be used.
     */
    color?: string;
    /**
     * Number from 0 (fully transparent) to 1 (fully opaque). If not provided, the current player's default opacity will be used.
     */
    opacity?: number;
    /**
     * ID of player this aura will be visible to. If not provided, the aura will be visible to eveyrone.
     * If set to null, the aura will not be visible.
     */
    visibleTo?: string | null;
    /**
     * Which Owlbear Rodeo layer the aura will be on. If not provided, the 'DRAWING' layer
     * will be used.
     */
    layer?: Layer;
    /**
     * Blend mode for effect-based auras. Only used if the `style` parameter is an effect type. If not provided,
     * the default SRC_OVER value will be used.
     */
    blendMode?: BlendMode;
    /**
     * Details for image-based auras. Must be provided if and only if the `style` parameter is "Image".
     */
    imageBuildParams?: {
        image: ImageContent;
        grid: ImageGrid;
    };
}

interface RemoveAurasMessage {
    type: "REMOVE_AURAS";
    /**
     *  Item IDs for character images that will have all auras removed.
     */
    sources: string[];
}
```

Then send a local broadcast with the message:

```typescript
await OBR.broadcast.sendMessage("com.desain.emanation/message", message, {
    destination: "LOCAL",
});
```

## Support

If you need support for this extension you can message me in the [Owlbear Rodeo Discord](https://discord.com/invite/u5RYMkV98s) @Nick or open an issue on [GitHub](https://github.com/desain/owlbear-emanation/issues).

## Development

After checkout, run `pnpm install`.

## How it Works

This project is a Typescript app.

The `action.html` page is rendered in the 'renderAction.tsx' file, which calls OBR APIs to set up the context menu and installs handlers to manage auras.

## Building

This project uses [pnpm](https://pnpm.io/) as a package manager.

To install all the dependencies run:

`pnpm install`

To run in a development mode run:

`pnpm dev`

To make a production build run:

`pnpm build`

## To do

-   Allow creating multiple presets instead of single defaults
-   Optimize item update handler
-   More effects!
    -   Localized weather effects - snow, rain
-   Split out style picker into a larger modal?
-   Update store page
-   Allow turning off context menu
-   Explanations of blend modes (maybe an option to hide less useful blend modes)
-   Option to hide nonstandard layers
-   Combine stores
-   Figure out what to do when identical auras combine
-   Check image picker on guest account
-   Message "click new" when no auras

## License

GNU GPLv3
