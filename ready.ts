import OBR from "@owlbear-rodeo/sdk";

type Installer = () => Promise<() => void>;
export default function ready(install: Installer) {
    let uninstall: () => void = () => { };
    OBR.onReady(async () => {
        if (await OBR.scene.isReady()) {
            uninstall = await install();
        }
        const uninstallReadyChange = OBR.scene.onReadyChange(async (ready) => {
            uninstall();
            if (ready) {
                uninstall = await install();
            } else {
                uninstallReadyChange();
            }
        });
    });
}