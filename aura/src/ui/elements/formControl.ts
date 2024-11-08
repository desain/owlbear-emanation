export default function createFormControl(label: string, child: string, customStyle?: string) {
    const customStyleAttr = customStyle ? `style="${customStyle}"` : ''
    return `
        <div class="form-control" ${customStyleAttr}>
            <label class="form-control-label">${label}</label>
            ${child}
        </div>
    `
}