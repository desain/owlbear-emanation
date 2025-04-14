#include round

// https://observablehq.com/@jrus/hexround
vec2 axial_round(vec2 qr) {
    vec2 qrgrid = vec2(round2(qr.x), round2(qr.y));
    qr -= qrgrid; // remainder
    if (abs(qr.x) >= abs(qr.y)) {
        return vec2(qrgrid.x + round2(qr.x + 0.5*qr.y), qrgrid.y);
    } else {
        return vec2(qrgrid.x, qrgrid.y + round2(qr.y + 0.5*qr.x));
    }
}