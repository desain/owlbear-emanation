export function isObject(object: any) {
    return object != null && typeof object === "object";
};

export function isDeepEqual(object1: any, object2: any) {
    const objKeys1 = Object.keys(object1);
    const objKeys2 = Object.keys(object2);

    if (objKeys1.length !== objKeys2.length) return false;

    for (var key of objKeys1) {
        const value1 = object1[key];
        const value2 = object2[key];

        const isObjects = isObject(value1) && isObject(value2);

        if ((isObjects && !isDeepEqual(value1, value2)) ||
            (!isObjects && value1 !== value2)
        ) {
            return false;
        }
    }
    return true;
};

export function groupBy<T, K extends keyof any>(ts: T[], key: (t: T) => K): Record<K, T[]> {
    return ts.reduce((acc, t) => {
        const k = key(t);
        if (acc[k]) {
            acc[k].push(t);
        } else {
            acc[k] = [t];
        }
        return acc;
    }, {} as Record<K, T[]>);
}