export function isObject(object: unknown): object is object {
    return object != null && typeof object === "object";
}

export function isDeepEqual<T extends object>(
    object1: T | undefined,
    object2: T | undefined,
) {
    if (object1 === undefined && object2 === undefined) {
        return true;
    } else if (object1 === undefined || object2 === undefined) {
        return false;
    }

    const objKeys1: (keyof T)[] = Object.keys(object1) as (keyof T)[];
    const objKeys2 = Object.keys(object2);

    if (objKeys1.length !== objKeys2.length) return false;

    for (const key of objKeys1) {
        const value1 = object1[key];
        const value2 = object2[key];

        const isObjects = isObject(value1) && isObject(value2);

        if (
            (isObjects && !isDeepEqual(value1, value2)) ||
            (!isObjects && value1 !== value2)
        ) {
            return false;
        }
    }
    return true;
}

export function groupBy<T, K extends string>(
    ts: T[],
    key: (t: T) => K,
): Record<K, T[]> {
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
