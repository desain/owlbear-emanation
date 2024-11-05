export function createControlRow(...children: string[]) {
    return `
        <div class="control-row">
            ${children.join('')}
        </div>
    `;
}