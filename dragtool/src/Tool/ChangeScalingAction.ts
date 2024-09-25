import { ToolAction, ToolContext } from "@owlbear-rodeo/sdk";
import icon0x from "../../assets/0x.svg";
import icon1x from "../../assets/1x.svg";
import icon2x from "../../assets/2x.svg";
import icon3x from "../../assets/3x.svg";
import icon4x from "../../assets/4x.svg";
import icon5x from "../../assets/5x.svg";
import icon6x from "../../assets/6x.svg";
import icon7x from "../../assets/7x.svg";
import icon8x from "../../assets/8x.svg";
import icon9x from "../../assets/9x.svg";
import { PLUGIN_ID, TOOL_ID } from "../constants";
import { DragToolMetadata, setToolMetadata } from "./DragToolMetadata";

export default class ChangeScalingAction implements ToolAction {
    private static DISTANCE_SCALING_KEY: keyof DragToolMetadata = 'distanceScaling';
    private static ICONS = [
        icon0x,
        icon1x,
        icon2x,
        icon3x,
        icon4x,
        icon5x,
        icon6x,
        icon7x,
        icon8x,
        icon9x,
    ];
    private static SCALES = [0, 1, 2];

    private static nextScale(index: number): number {
        return ChangeScalingAction.SCALES[(index + 1) % ChangeScalingAction.SCALES.length];
    }

    private justClicked: boolean = false;
    readonly getAndClearJustClicked: () => boolean;

    constructor() {
        this.getAndClearJustClicked = this.getAndClearJustClickedImpl.bind(this);
    }

    id = `${PLUGIN_ID} /tool-action-change-scaling`;
    shortcut = 'X';
    icons = ChangeScalingAction.ICONS.map((icon, index) => ({
        icon,
        label: `Change Scaling to ${ChangeScalingAction.nextScale(index)}x`,
        filter: {
            activeTools: [TOOL_ID],
            metadata: [
                {
                    key: ChangeScalingAction.DISTANCE_SCALING_KEY,
                    value: index,
                },
            ],
        },
    }))

    async onClick(context: ToolContext) {
        this.justClicked = true;
        const currentIndex = ChangeScalingAction.SCALES.findIndex((scale) => scale === context.metadata.distanceScaling);
        await setToolMetadata({ distanceScaling: ChangeScalingAction.nextScale(currentIndex) }); // deactivates tool mode, which will check and clear this flag
    }

    private getAndClearJustClickedImpl() {
        const result = this.justClicked;
        this.justClicked = false;
        return result;
    }
}