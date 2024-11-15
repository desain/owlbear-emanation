import { useOwlbearStore } from "../useOwlbearStore";

export function GmGate({ children }: { children: React.ReactNode }) {
    const role = useOwlbearStore((store) => store.role);

    if (role === "GM") {
        return <>{children}</>;
    } else {
        return null;
    }
}
