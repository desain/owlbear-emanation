import { Button, FormControlProps } from "@mui/material";
import OBR, { ImageContent, ImageGrid } from "@owlbear-rodeo/sdk";
import { ImageBuildParams } from "../types/AuraStyle";
import { Control } from "./Control";

interface ImageSelectorProps {
    onChange: (imageBuildParams: ImageBuildParams) => void;
    value: { image: ImageContent; grid: ImageGrid };
}

function CurrentImageDisplay({ image }: { image: ImageContent }) {
    return image.mime.startsWith("image/") ? (
        <img
            src={image.url}
            alt="Selected aura"
            style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
            }}
        />
    ) : (
        <video
            autoPlay
            style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
            }}
        >
            <source src={image.url} type={image.mime} />
        </video>
    );
}

export function ImageSelector({
    onChange,
    value,
    ...props
}: ImageSelectorProps & Omit<FormControlProps, "onChange">) {
    const handleSelectImage = async () => {
        const images = await OBR.assets.downloadImages(
            false,
            undefined,
            "PROP",
        );
        if (images && images.length > 0) {
            const selected = images[0];
            onChange({
                image: selected.image,
                grid: selected.grid,
            });
        }
    };

    return (
        <Control {...props} label="Image">
            <Button
                variant="outlined"
                onClick={handleSelectImage}
                sx={{ width: "100%", height: "120px", position: "relative" }}
            >
                <CurrentImageDisplay image={value.image} />
            </Button>
        </Control>
    );
}
