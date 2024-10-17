import installEmanations from "./emanation/src/install";
import ready from "./ready";

async function install() {
    const uninstallers = await Promise.all([
        installEmanations(),
    ]);
    return () => uninstallers.forEach(uninstaller => uninstaller());
}

ready(install);