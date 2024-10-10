import OBR, { GridMeasurement, GridType, isImage, Item, Vector2 } from "@owlbear-rodeo/sdk";

export default class Snapper {
    private snappingSensitivity: number;
    private snapToCorners: boolean;
    private snapToCenter: boolean;
    constructor(item: Item | null, measurement: GridMeasurement, gridType: GridType) {
        this.snappingSensitivity = measurement === 'EUCLIDEAN' ? 0 : 1;
        if (item && isImage(item) && gridType === 'SQUARE') {
            const itemSizeInGridUnits = Math.max(item.image.width * item.scale.x, item.image.height * item.scale.y) / item.grid.dpi;
            const sizeIsOdd = (Math.round(itemSizeInGridUnits) & 1) === 1;
            this.snapToCenter = sizeIsOdd;
            this.snapToCorners = !sizeIsOdd;
        } else {
            this.snapToCorners = false;
            this.snapToCenter = true;
        }
    }

    async snap(position: Vector2) {
        return OBR.scene.grid.snapPosition(position, this.snappingSensitivity, this.snapToCorners, this.snapToCenter);
    }
}