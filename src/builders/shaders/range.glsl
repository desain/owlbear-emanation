#include random
#include cellCoords

const float FUZZINESS = 0.1;

vec4 main(vec2 fragCoord){
    vec2 xy = cellCoords(fragCoord);
    xy += FUZZINESS * (vec2(random(xy), random(xy.yx)) - 0.5); // dither
    xy = abs(xy); // mirror to each quadrant
    xy = transformCoordinateSpace(xy); // move to corner or pixel to hex
    xy = roundToCell(xy);

    float d = distance(xy);
    float itemRadius = getItemRadius();
    float threshold = numUnits + itemRadius;
    float pct = ceil(d - itemRadius) / numUnits;
	float b = 1.0 - step(threshold, d);

    return vec4(mix(vec3(1.0), color, pct), 1.0) * b * opacity;
}