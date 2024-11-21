import { Item, Shape, isShape } from "@owlbear-rodeo/sdk";

export type Circle = Shape & { shapeType: "CIRCLE" };
export function isCircle(item: Item): item is Circle {
    return isShape(item) && item.shapeType === "CIRCLE";
}
