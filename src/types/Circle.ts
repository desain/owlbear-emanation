import type { Item, Shape } from "@owlbear-rodeo/sdk";
import { isShape } from "@owlbear-rodeo/sdk";

export interface Circle extends Shape {
    shapeType: "CIRCLE";
}
export function isCircle(item: Item): item is Circle {
    return isShape(item) && item.shapeType === "CIRCLE";
}
