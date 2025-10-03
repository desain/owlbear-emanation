import EditIcon from "@mui/icons-material/Edit";
import SettingsIcon from "@mui/icons-material/Settings";
import TuneIcon from "@mui/icons-material/Tune";
import { Box, Tab, Tabs } from "@mui/material";
import OBR from "@owlbear-rodeo/sdk";
import { useActionResizer, useUndoRedoHandler } from "owlbear-utils";
import { useEffect, useState } from "react";
import { CHANNEL_TAB } from "../constants";
import { AuraDefaultsTab } from "./AuraDefaultsTab";
import { EditTab } from "./EditTab";
import { SettingsTab } from "./SettingsTab";

const BASE_HEIGHT = 100;
const MAX_HEIGHT = 700;

function TabContent({
    index,
    currentIndex,
    children,
}: {
    index: number;
    currentIndex: number;
    children: React.ReactNode;
}) {
    if (index === currentIndex) {
        return children;
    }
    return null;
}

export function Action() {
    const [currentTab, setCurrentTab] = useState(0);

    useEffect(() =>
        OBR.broadcast.onMessage(CHANNEL_TAB, ({ data }) => {
            if (typeof data === "number") {
                setCurrentTab(data);
            }
        }),
    );

    const tabContainer = useActionResizer(BASE_HEIGHT, MAX_HEIGHT);

    useUndoRedoHandler();

    return (
        <>
            <Tabs
                value={currentTab}
                variant="fullWidth"
                onChange={(_, value: number) => setCurrentTab(value)}
                sx={{ mb: 2 }}
            >
                <Tab icon={<EditIcon />} label="Edit" />
                <Tab icon={<TuneIcon />} label="Defaults" />
                <Tab icon={<SettingsIcon />} label="Settings" />
            </Tabs>

            <Box ref={tabContainer} sx={{ pb: 2 }}>
                <TabContent currentIndex={currentTab} index={0}>
                    <EditTab />
                </TabContent>
                <TabContent currentIndex={currentTab} index={1}>
                    <AuraDefaultsTab />
                </TabContent>
                <TabContent currentIndex={currentTab} index={2}>
                    <SettingsTab />
                </TabContent>
            </Box>
        </>
    );
}
