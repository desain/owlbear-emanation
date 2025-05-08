uniform shader scene;

const float TIME_FACTOR = 0.2;
const float WARP_FACTOR = 0.2;
const float TIME_WARP_FACTOR = 0.1;
const float PI = 3.14159;
float scaleOffset(float pct) {
    // Windowing function to ensure zeros at 0, 0.5, and 1
    // sin(2*PI*pct) gives positive at 0.25, negative at 0.75
    // sin(PI*pct) zeros at 0,1
    return sin(PI * pct) * sin(2.0 * PI * pct) * dpi *
        (WARP_FACTOR + sin(time * TIME_FACTOR) * TIME_WARP_FACTOR);
}

vec4 main(in vec2 fragCoordPx) {
    float radiusPx = (numUnits + itemRadiusUnits) * dpi;
    vec2 centerRelativeCoordPx = fragCoordPx - size * 0.5;
    float d = length(centerRelativeCoordPx);
    float pct = clamp(d / radiusPx, 0.0, 1.0);

    vec2 viewCoordPx = (vec3(fragCoordPx, 1.0) * modelView).xy;
    viewCoordPx += normalize(centerRelativeCoordPx) * scaleOffset(pct);
    return scene.eval(viewCoordPx);
}