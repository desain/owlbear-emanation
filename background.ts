import OBR from "@owlbear-rodeo/sdk";
import installDragTool from "./dragtool/src/install";
import installEmanations from "./emanation/src/install";

OBR.onReady(async () => {
    let uninstallAll: (() => void) | null = null;
    if (await OBR.scene.isReady()) {
        uninstallAll = await install();
    }
    OBR.scene.onReadyChange(async (ready) => {
        if (ready) {
            uninstallAll = await install();
        } else {
            if (uninstallAll) {
                uninstallAll();
            }
        }
    });
});

async function install() {
    const uninstallers = await Promise.all([
        installEmanations(),
        installDragTool(),
    ]);
    return () => uninstallers.forEach(uninstaller => uninstaller());
}