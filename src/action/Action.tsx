import EditIcon from "@mui/icons-material/Edit";
import SettingsIcon from "@mui/icons-material/Settings";
import TuneIcon from "@mui/icons-material/Tune";
import { Box, Tab, Tabs } from "@mui/material";
import OBR from "@owlbear-rodeo/sdk";
import { useEffect, useRef, useState } from "react";
import { TAB_CHANNEL } from "../constants";
import { useOwlbearStore } from "../useOwlbearStore";
import { AuraDefaultsTab } from "./AuraDefaultsTab";
import { EditTab } from "./EditTab";
import { SceneSettingsTab } from "./SettingsTab";

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
    const role = useOwlbearStore((store) => store.role);

    useEffect(() => {
        return OBR.broadcast.onMessage(TAB_CHANNEL, ({ data }) => {
            if (typeof data === "number") {
                setCurrentTab(data);
            }
        });
    });

    const tabContainer = useRef(null);

    useEffect(() => {
        if (!tabContainer.current) {
            return;
        }

        const observer = new ResizeObserver(async (entries) => {
            if (entries.length === 0) {
                return;
            }
            const entry = entries[0];

            if (!entry.borderBoxSize) {
                return;
            }

            const height = Math.min(
                MAX_HEIGHT,
                BASE_HEIGHT + entry.borderBoxSize[0].blockSize,
            );

            await OBR.action.setHeight(height);
        });

        observer.observe(tabContainer.current);
        return () => {
            observer.disconnect();
            void OBR.action.setHeight(BASE_HEIGHT);
        };
    }, []);

    return (
        <>
            <Tabs
                value={currentTab}
                variant="fullWidth"
                onChange={(_, value) => setCurrentTab(value)}
                sx={{ mb: 2 }}
            >
                <Tab icon={<EditIcon />} iconPosition="start" label="Edit" />
                <Tab
                    icon={<TuneIcon />}
                    iconPosition="start"
                    label="Defaults"
                />
                <Tab
                    icon={<SettingsIcon />}
                    iconPosition="start"
                    disabled={role === "PLAYER"}
                    label="GM Settings"
                />
            </Tabs>

            <Box ref={tabContainer} sx={{ pb: 2 }}>
                <TabContent currentIndex={currentTab} index={0}>
                    <EditTab />
                </TabContent>
                <TabContent currentIndex={currentTab} index={1}>
                    <AuraDefaultsTab />
                </TabContent>
                <TabContent currentIndex={currentTab} index={2}>
                    <SceneSettingsTab />
                </TabContent>
            </Box>
        </>
    );
}
