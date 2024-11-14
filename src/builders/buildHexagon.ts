import { Math2, Vector2, buildCurve } from "@owlbear-rodeo/sdk";
import { HexGridType, getHexGridUtils } from "../utils/HexGridUtils";

function clockwiseAroundOrigin(point: Vector2, degrees: number) {
    return Math2.rotate(point, { x: 0, y: 0 }, degrees);
}

export function buildHexagonGridAura(
    position: Vector2,
    numHexes: number,
    hexSize: number,
    absoluteItemSize: number,
    gridType: HexGridType,
) {
    const utils = getHexGridUtils(hexSize, gridType);
    const radius = utils.getAuraRadius(numHexes, absoluteItemSize);
    const rightHexOffset = { x: utils.mainAxisSpacing, y: 0 };

    const topLeftHexOffset = clockwiseAroundOrigin(
        Math2.multiply(rightHexOffset, radius),
        240,
    );

    const pointyTopOffset = { x: 0, y: -utils.absoluteSideLength };
    const topLeftPointyTop = Math2.add(topLeftHexOffset, pointyTopOffset);
    const topLeftPointyRight = Math2.add(
        topLeftHexOffset,
        clockwiseAroundOrigin(pointyTopOffset, 60),
    );

    const points: Vector2[] = [];
    for (let i = 0; i < radius; i++) {
        const acrossOffset = Math2.multiply(rightHexOffset, i);
        points.push(Math2.add(topLeftPointyTop, acrossOffset));
        points.push(Math2.add(topLeftPointyRight, acrossOffset));
    }
    points.push(
        Math2.add(topLeftPointyTop, Math2.multiply(rightHexOffset, radius)),
    );

    return buildCurve()
        .points([
            ...points.map((point) =>
                clockwiseAroundOrigin(point, utils.baseRotationDegrees),
            ),
            ...points.map((point) =>
                clockwiseAroundOrigin(point, utils.baseRotationDegrees + 60),
            ),
            ...points.map((point) =>
                clockwiseAroundOrigin(point, utils.baseRotationDegrees + 120),
            ),
            ...points.map((point) =>
                clockwiseAroundOrigin(point, utils.baseRotationDegrees + 180),
            ),
            ...points.map((point) =>
                clockwiseAroundOrigin(point, utils.baseRotationDegrees + 240),
            ),
            ...points.map((point) =>
                clockwiseAroundOrigin(point, utils.baseRotationDegrees + 300),
            ),
        ])
        .position(position)
        .closed(true)
        .tension(0)
        .build();
}
