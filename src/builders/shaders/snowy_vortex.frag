#include util/circle
#include util/fbm
#include util/random
#include util/cellCoords.glsl

const float density = 3.0;
const float speed = 1.0;

// Adapted snow function for vortex motion
float vortex_snow(vec2 p, float jitter, float baseSpeed, float flakeSize, float inwardPull) {
    // Calculate vortex direction: tangential + inward radial
    vec2 tangent = normalize(vec2(-p.y, p.x));
    vec2 radial = -normalize(p);
    // Handle center point to avoid NaN
    if (length(p) < 0.001) {
        radial = vec2(0.0);
        tangent = vec2(1.0, 0.0); // Or some default
    }
    vec2 vortexDir = normalize(tangent + radial * inwardPull);

    // Move the input space based on time, calculated direction, and speed
    // Adjust speed based on distance? (Optional, e.g., faster near center)
    float distFactor = 1.0; // Example: clamp(1.0 / (length(p) * 0.5 + 0.1), 0.5, 5.0);
    vec2 p_moved = p + time * vortexDir * baseSpeed * distFactor;

    // Animate the swaying/positioning of the snow (using fbm for jitter)
    float minDist = 10.;
    vec2 minPoint;
    animatedCircle(p_moved, jitter, baseSpeed, minDist, minPoint); // Use p_moved here

    // Scale the circle by the progress of the animation/position
    float scale = dot(minPoint, vec2(0.4, 0.4)) - 0.2 - flakeSize;
    // Convert the distance to a circle
    float blur = flakeSize * 0.2;
    float circle = smoothstep(flakeSize * scale - blur, flakeSize * scale + blur, minDist);
    return 1.0 - circle;
}


vec4 main(vec2 fragCoord) {
    vec2 xy = cellCoords(fragCoord);
    
    xy = axonometricTransform(xy);
    // xy is now relative to the center in grid units

    // --- Vortex Calculation ---
    float d = length(xy); // Distance from center


    // Fade out effect based on numUnits
    float falloff = smoothstep(numUnits + 1.0, numUnits - 1.0, d); // Smooth fade over 2 units
    if (falloff <= 0.0) {
        return vec4(0.0); // Discard fragments outside the radius + fade zone
    }

    float alpha = 0.0;
    float baseSpeed = pow(speed + 0.1, 1.5); // Similar speed scaling as weather_snow
    float tiling = 1.0; // Adjust tiling if needed, maybe based on numUnits

    // --- Snow Layers ---
    // Call vortex_snow multiple times with different parameters
    // Adjust parameters based on density input
    float densityFactor = clamp(density / 3.0, 0.5, 2.0); // Example scaling

    // Layer 1: Smaller, slower, less inward pull
    alpha += vortex_snow(xy * 8.0 * tiling, 8.363, 0.8 * baseSpeed, 0.08 * densityFactor, 0.2);
    // Layer 2: Larger, faster, more inward pull
    alpha += vortex_snow(xy * 5.0 * tiling, 11.683, 1.2 * baseSpeed, 0.15 * densityFactor, 0.4);

    if (density > 1.5) {
        // Layer 3: Medium size/speed/pull for higher density
        alpha += vortex_snow(xy * 6.5 * tiling, 5.42, 1.0 * baseSpeed, 0.11 * densityFactor, 0.3);
    }
    if (density > 2.5) {
        // Layer 4: Dense core effect?
        alpha += vortex_snow(xy * 10.0 * tiling, 15.98, 1.5 * baseSpeed, 0.05 * densityFactor, 0.6);
    }


    // Clamp alpha and apply falloff and overall opacity
    alpha = clamp(alpha, 0.0, 1.0);
    alpha *= falloff * opacity;

    return vec4(color, alpha);
    
}