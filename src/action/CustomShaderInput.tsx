import { SaveOutlined } from "@mui/icons-material";
import { Button, FormControl, FormLabel, TextField } from "@mui/material";
import type { FC} from "react";
import { useState } from "react";

interface CustomShaderInputProps {
    value: string;
    onChange: (sksl: string) => void;
}

export const CustomShaderInput: FC<CustomShaderInputProps> = ({
    value,
    onChange,
}) => {
    const [displayValue, setDisplayValue] = useState(value);

    return (
        <>
            <FormControl fullWidth sx={{ mb: 1 }}>
                <FormLabel>Custom SKSL Shader</FormLabel>
                <TextField
                    multiline
                    minRows={6}
                    slotProps={{
                        htmlInput: {
                            sx: {
                                px: 1,
                            },
                        },
                    }}
                    value={displayValue}
                    onChange={(e) => setDisplayValue(e.target.value)}
                    placeholder="Enter custom SKSL code here..."
                />
            </FormControl>
            <Button
                startIcon={<SaveOutlined />}
                onClick={() => onChange(displayValue)}
                sx={{ ml: "auto", mb: 2 }}
            >
                Save
            </Button>
        </>
    );
};
