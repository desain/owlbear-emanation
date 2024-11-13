import OBR from "@owlbear-rodeo/sdk";

type Installer = () => Promise<VoidFunction>;
export default function ready(install: Installer) {
    let uninstall: VoidFunction = () => { };
    OBR.onReady(async () => {
        uninstall();
        if (await OBR.scene.isReady()) {
            uninstall = await install();
        }
        OBR.scene.onReadyChange(async (ready) => {
            uninstall();
            uninstall = () => { };
            if (ready) {
                uninstall = await install();
            }
        });
    });
}