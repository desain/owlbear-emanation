import OBR, { Theme } from "@owlbear-rodeo/sdk";

export default async function installTheme(app: HTMLElement, watch: boolean) {
    addThemeValues(app, await OBR.theme.getTheme());
    if (watch) {
        return OBR.theme.onChange((theme) => addThemeValues(app, theme));
    } else {
        return () => { };
    }
}

function addThemeValues(app: HTMLElement, theme: Theme) {
    // console.log(theme);
    app.style.setProperty('--text-disabled', theme.text.disabled);

    // material
    // https://github.com/material-components/material-components-web/blob/master/docs/theming.md
    app.style.setProperty('--mdc-theme-primary', theme.primary.main);
    app.style.setProperty('--mdc-theme-secondary', theme.secondary.main);
    app.style.setProperty('--mdc-theme-background', theme.background.default);
    app.style.setProperty('--mdc-theme-text-primary-on-background', theme.text.primary);
    app.style.setProperty('--mdc-checkbox-unchecked-color', theme.text.primary);
}