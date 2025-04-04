import EditIcon from "@mui/icons-material/Edit";
import SettingsIcon from "@mui/icons-material/Settings";
import { Tab, Tabs } from "@mui/material";
import { useState } from "react";
import { EditTab } from "./EditTab";
import { SettingsTab } from "./SettingsTab";

export function Action() {
    const [currentTab, setCurrentTab] = useState(0);

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
                    icon={<SettingsIcon />}
                    iconPosition="start"
                    label="Settings"
                />
            </Tabs>
            {currentTab === 0 ? <EditTab /> : <SettingsTab />}
        </>
    );
}
