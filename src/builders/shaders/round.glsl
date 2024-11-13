// wtf is happening?
// if I don't declare this and try to call round(some_float):
// 	error: 26: no match for round(float)
// but if I declare 'round' myself:
// 	error: 12: duplicate definition of intrinsic function 'round'
// so does it exist or not??
// declare it under a different name so the compiler is happy
float round2(float x) {
  return x > 0.0 ? floor(x + 0.5) : ceil(x - 0.5);
}