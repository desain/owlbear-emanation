import { ToolAction, ToolContext } from "@owlbear-rodeo/sdk";
import icon1x from "../../assets/1x.svg";
import icon2x from "../../assets/2x.svg";
import { PLUGIN_ID, TOOL_ID } from "../constants";
import { DragToolMetadata, setToolMetadata } from "./DragToolMetadata";

type Scale = [number, string];

export default class ChangeScalingAction implements ToolAction {
    private static DISTANCE_SCALING_KEY: keyof DragToolMetadata = 'distanceScaling';
    private static SCALES: Scale[] = [
        // [0, icon0x],
        [1, icon1x],
        [2, icon2x],
        // [3, icon3x],
        // [4, icon4x],
        // [5, icon5x],
        // [6, icon6x],
        // [7, icon7x],
        // [8, icon8x],
    ];
    private static nextScale(index: number): number {
        return ChangeScalingAction.SCALES[(index + 1) % ChangeScalingAction.SCALES.length][0];
    }

    private justClicked: boolean = false;
    readonly getAndClearJustClicked: () => boolean;

    constructor() {
        this.getAndClearJustClicked = this.getAndClearJustClickedImpl.bind(this);
    }

    id = `${PLUGIN_ID} /tool-action-change-scaling`;
    shortcut = 'X';
    icons = ChangeScalingAction.SCALES.map(([scale, icon], index) => ({
        icon,
        label: `Change Scaling to ${ChangeScalingAction.nextScale(index)}x`,
        filter: {
            activeTools: [TOOL_ID],
            metadata: [
                {
                    key: ChangeScalingAction.DISTANCE_SCALING_KEY,
                    value: scale,
                },
            ],
        },
    }))

    async onClick(context: ToolContext) {
        this.justClicked = true;
        const currentIndex = ChangeScalingAction.SCALES.findIndex(([scale]) => scale === context.metadata.distanceScaling);
        await setToolMetadata({ distanceScaling: ChangeScalingAction.nextScale(currentIndex) }); // deactivates tool mode, which will check and clear this flag
    }

    private getAndClearJustClickedImpl() {
        const result = this.justClicked;
        this.justClicked = false;
        return result;
    }
}