// uniform shader scene;

const float TIME_FACTOR = 0.2;
const float TIME_WARP_FACTOR = 0.1;
const float PI = 3.14159;
float scaleOffset(float pct) {
    // Windowing function to ensure zeros at 0, 0.5, and 1
    // sin(2*PI*pct) gives positive at 0.25, negative at 0.75
    // sin(PI*pct) zeros at 0,1
    return sin(PI * pct) * sin(2.0 * PI * pct) * dpi *
        (warpFactor + sin(time * TIME_FACTOR) * TIME_WARP_FACTOR);
}

vec4 main(in vec2 fragCoordPx) {
    float radiusPx = (numUnits + itemRadiusUnits) * dpi;
    vec2 centerRelativeCoordPx = fragCoordPx - size * 0.5;
    float d = length(centerRelativeCoordPx);
    float pct = clamp(d / radiusPx, 0.0, 1.0);

    // why multiply from the left here?
    // according to https://en.wikibooks.org/wiki/GLSL_Programming/Vector_and_Matrix_Operations
    // multiplying v * M (from the left) is equivalent to transpose(M) * v
    // OBR matrices are row-major, whereas GLSL/SKSL matrics are column-major
    // so we want to transpose the matrix before multiplying
    vec2 worldCoordPx = (vec3(fragCoordPx, 1.0) * model).xy;
    worldCoordPx += normalize(centerRelativeCoordPx) * scaleOffset(pct);
    vec2 viewCoordPx = (vec3(worldCoordPx, 1.0) * view).xy;
    return scene.eval(viewCoordPx);
}