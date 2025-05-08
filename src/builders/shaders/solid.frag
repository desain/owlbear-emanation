#include cellCoords

vec4 main(vec2 fragCoord){
    vec2 xy = cellCoords(fragCoord);
    xy = axonometricTransform(xy);
    xy = transformCoordinateSpace(xy); // axono transform + move to corner or pixel to hex
    xy = roundToCell(xy);

    float d = distance(xy);
    float itemRadius = getItemRadius();
    float threshold = numUnits + itemRadius;

    return d > threshold
        ? vec4(0.0)
        : vec4(color, 1.0) * opacity;
}