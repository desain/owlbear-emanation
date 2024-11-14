import OBR from "@owlbear-rodeo/sdk";
import { useEffect, useState } from "react";

function isGmRole(role: string) {
    return role === "GM";
}

export function GmGate({ children }: { children: React.ReactNode }) {
    const [isGm, setIsGm] = useState(false);

    useEffect(() => {
        if (!isGm) {
            OBR.player.getRole().then(isGmRole).then(setIsGm);
        }
        return OBR.player.onChange((player) => {
            setIsGm(isGmRole(player.role));
        });
    }, [isGm]);

    if (isGm) {
        return <>{children}</>;
    } else {
        return null;
    }
}
