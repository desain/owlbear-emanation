import { FormControlProps } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { AuraStyleType, STYLE_TYPES } from '../../types/AuraStyle';
import { Control } from './Control';

export function StyleSelector({ value, onChange, ...props }: {
    value: AuraStyleType,
    onChange: (styleType: AuraStyleType) => void,
} & Omit<FormControlProps, 'onChange'>) {
    return (
        <Control {...props} label="Style">
            <Autocomplete
                options={STYLE_TYPES}
                renderInput={params => <TextField {...params} />}
                disableClearable={true}
                size="small"
                value={value}
                onChange={(_, styleType) => onChange(styleType)}
            />
        </Control>
    );
}