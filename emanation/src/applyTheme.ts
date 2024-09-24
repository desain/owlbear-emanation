import OBR, { Theme } from "@owlbear-rodeo/sdk";

export default async function applyTheme(app: HTMLElement) {
    addThemeValues(app, await OBR.theme.getTheme());
}

function addThemeValues(app: HTMLElement, theme: Theme) {
    app.style.setProperty('--text-primary', theme.text.primary);
    app.style.setProperty('--text-disabled', theme.text.disabled);
    app.style.setProperty('--text-secondary', theme.text.secondary);
    app.style.setProperty('--primary-main', theme.primary.main);
}