import { Button, FormControlProps } from "@mui/material";
import OBR, { ImageContent } from "@owlbear-rodeo/sdk";
import { RefObject, useEffect, useRef } from "react";
import { ImageBuildParams } from "../types/AuraStyle";
import { Control } from "owlbear-utils";

interface ImageSelectorProps {
    onChange: (imageBuildParams: ImageBuildParams) => void;
    value: ImageBuildParams;
}

function CurrentImageDisplay({ image }: { image: ImageContent }) {
    const videoRef: RefObject<HTMLVideoElement | null> = useRef(null);

    // If the video source changes, the browser won't update the currently
    // playing video by default, so we have to manually call load() to update
    // the video element.
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.load();
        }
    }, [image.url]);

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
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
            }}
        >
            <source src={image.url} type={image.mime} />
            Cannot render video.
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
        if (images.length > 0) {
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
