import { styled } from "@mui/material";
import FormControl, { FormControlProps } from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import React from "react";

const SmallLabel = styled(FormLabel)({
    fontSize: "0.75rem",
    marginBottom: 4,
});

export function Control({
    label,
    children,
    ...props
}: { label: string; children: React.ReactNode } & FormControlProps) {
    return (
        <FormControl {...props}>
            <SmallLabel>{label}</SmallLabel>
            {children}
        </FormControl>
    );
}
