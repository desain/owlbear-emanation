import OBR from "@owlbear-rodeo/sdk";

type Installer = () => Promise<VoidFunction>;
export default function ready(install: Installer) {
    let uninstall: VoidFunction = () => { };
    OBR.onReady(async () => {
        console.log('onready');
        uninstall();
        if (await OBR.scene.isReady()) {
            console.log('scene isready');
            uninstall = await install();
        }
        OBR.scene.onReadyChange(async (ready) => {
            console.log('readychange', ready);
            uninstall();
            uninstall = () => { };
            if (ready) {
                uninstall = await install();
            }
        });
    });
}