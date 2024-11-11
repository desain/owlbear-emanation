// https://thebookofshaders.com/10/
// outputs 0 to 1
float random (vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}