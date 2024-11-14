import { isDeepEqual } from "./jsUtils";

type Handler<T> = (t: T) => void;
type HandlerAdder<T> = Handler<Handler<T>>;
type Producer<T> = () => T;
type WatcherResult<T> = [Promise<T>, VoidFunction];
export type Watcher<T> = (handleChange: Handler<T>) => WatcherResult<T>;

// this is generic enough that something like it probably exists somewhere but idk where
export function makeWatcher<T extends object, R>(
    fetchFirstT: () => Promise<T>,
    subscribeR: (callback: (r: R) => void) => VoidFunction,
    tFromR: (r: R) => Promise<T>,
): Watcher<T> {
    return function watcher(handleChange: Handler<T>): WatcherResult<T> {
        let savedT: T | null = null;
        let enabled = true;

        const updateT = (newT: T) => {
            const changed = savedT === null || !isDeepEqual(savedT, newT);
            savedT = newT;
            if (changed) {
                handleChange(newT);
            }
        };

        const firstTPromise = (async () => {
            const newT = await fetchFirstT();
            if (enabled) {
                updateT(newT);
            }
            return newT;
        })();

        const unsubscribeR = subscribeR(async (r) => {
            const newT = await tFromR(r);
            updateT(newT);
        });

        const stopWatching = () => {
            enabled = false;
            unsubscribeR();
        };
        return [firstTPromise, stopWatching];
    };
}

export async function watcherToLatest<T extends object>(
    watchT: Watcher<T>,
): Promise<[Producer<T>, HandlerAdder<T>, VoidFunction]> {
    let t: T;
    const handlers: Handler<T>[] = [];
    const addHandler = (handler: Handler<T>) => {
        handlers.push(handler);
        handler(t);
    };

    const [firstT, unsubscribe] = watchT((newT) => {
        t = newT;
        for (const handler of handlers) {
            handler(newT);
        }
    });
    t = await firstT;
    return [() => t, addHandler, unsubscribe];
}
