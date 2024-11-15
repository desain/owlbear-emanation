---
title: Auras and Emanations
description: Add smart auras in one of several styles to any character.
author: desain
image: https://github.com/user-attachments/assets/1231da26-2939-4877-a023-3444ed2018b7
icon: https://github.com/desain/owlbear-emanation/blob/main/public/logo.png
tags:
    - tool
    - combat
    - drawing
manifest: https://owlbear-emanation.pages.dev/manifest.json
---

# Auras and Emanations

This extension allows you to add auras to any character in a variety of styles.

## Features

-   Auras will display the correct shape for the current grid type and grid measurement type. (e.g when using Chevyshev / Chessboard D&D 5e distance, auras will be square)
-   Auras will automatically resize after tokens are scaled, so that their boundary is the correct distance away.
-   Manage any number of auras with any color, opacity, or style.

## How to use

### Adding an aura

![Add Aura](https://github.com/user-attachments/assets/ba002d01-ed73-4d9c-8445-d5269b0fc6d5)

Select one or more character tokens, then right click and click the 'Add Aura' item that appears on the context menu. You can also press 'E' (for Emanation - A for Aura was taken :P) while the context menu is open to add one quickly.

### Editing aura parameters

![Edit Auras](https://github.com/user-attachments/assets/bf696d4f-e605-4792-a4de-30b78a6f9eae)

When any selected character has at least one aura, you will see the edit auras menu, which lets you manage auras for those characters.

Menu options:

-   **Style**: Display style of the aura (see below).
-   **Size**: Size of the aura, in the same units as the grid.
-   **Color**: Aura color. Editable with your browser's native color picker. By default, the color will be your player color.
-   **Opacity**: Aura opacity.
-   **Delete** (trash icon): Remove this aura from the character.
-   **New**: Add another aura to the characters. You can manage all auras in the context menu (if you don't see a new aura, try scrolling up or down in the menu). If multiple characters are selected, this button will add a new aura to all of them.
-   **Delete All**: Remove all auras from the selected characters.

### Resizing tokens

https://github.com/user-attachments/assets/71ca78dc-01bd-4de4-b110-9d3072eba336

When you drag to resize a token, the aura will change size after you let go.

### Changing grid types

https://github.com/user-attachments/assets/bb7423a3-380e-4f74-baf2-605403ddbc5a

When you change the grid type or measurement type, auras will reshape to be appropriate for the new settings.

### Changing defaults

![Defaults Menu](https://github.com/user-attachments/assets/f477f7e3-b41c-4893-a19e-f71eceb7b37c)

To change the default settings for newly created auras, open the Auras actions menu in the top left.

In addition to the standard auras settings, this menu has an additional setting:

-   **Shape to grid**: When enabled, causes auras to trace out the outline of grid squares within range. When disabled, auras trace the exact set of points within range of the source, even when that cuts through the middle of grid squares.

https://github.com/user-attachments/assets/130b5f4f-14bb-41ed-9fa2-ecd1b1354b79

### Aura Styles

This extension supports several different aura styles. The different types are listed below.

#### Simple

![Simple](https://github.com/user-attachments/assets/2345b74a-3129-4639-9f79-bdffa8b90a63)

A filled area with a solid outline. The color control sets the color of both the fill and stroke, and the opacity controls the opacity of the fill.

#### Bubble

![Bubble](https://github.com/user-attachments/assets/dc0f640a-3eae-4e3b-8926-6f5f6e13fdf5)

An area with a gradient that gets more opaque towards the edges. High opacity values are recommended.

Inspired by [these AoE tokens](https://drive.google.com/drive/folders/16EoOnBMzu2oerC98bZ3HdF4nfk9Fpw_5).

All grid types are supported, but this style will not conform its edges to grid squares when that would lead to a concave outline.

#### Glow

![Glow](https://github.com/user-attachments/assets/78afaee3-1adc-4bfe-b357-3a04a214bf4c)

An always-circular glow around the token that's lighter in the center. Useful for simulating torches!

#### Range

![Range](https://github.com/user-attachments/assets/1be43d2d-2553-43f2-a3eb-c4dc1811137a)

A rangefinder which steps from white to the aura color at each discrete grid unit. Supports all grid types. Darker aura colors are recommended for contrast.

#### Spirits

![Spirits](https://github.com/user-attachments/assets/88667f53-2a44-46a2-81b4-5dd4dd9326ed)

A fancy one just for fun! Displays animated trails that circle your character while changing color.

This style ignores your color and opacity settings because the spirits have their own ideas.

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
    style?: "Simple" | "Bubble" | "Glow" | "Range" | "Spirits";
;
    /**
     * Hex code, e.g #d00dad. If not provided, the current player's default color will be used.
     */
    color?: string;
    /**
     * Number from 0 (fully transparent) to 1 (fully opaque). If not provided, the current player's default opacity will be used.
     */
    opacity?: number;
}

interface RemoveAurasMessage {
    type: "REMOVE_AURAS";
    /**
     *  Item IDs for character images that will receive auras.
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
