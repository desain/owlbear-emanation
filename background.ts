import OBR from "@owlbear-rodeo/sdk";
import installDragTool from "./dragtool/src/install";
import installEmanations from "./emanation/src/install";

OBR.onReady(async () => {
    if (await OBR.scene.isReady()) {
        await installEmanations();
    } else {
        OBR.scene.onReadyChange(async (ready) => {
            if (ready) {
                await Promise.all([
                    installEmanations(),
                    installDragTool(),
                ])
            }
        });
    }
});