export default function createFormControl(label: string, child: string) {
    return `
        <div class="form-control">
            <label class="form-control-label">${label}</label>
            ${child}
        </div>
    `
}