import type { FormControlProps } from "@mui/material";
import { Button } from "@mui/material";
import type { ImageContent } from "@owlbear-rodeo/sdk";
import OBR from "@owlbear-rodeo/sdk";
import { complain, Control, isObject } from "owlbear-utils";
import type { RefObject } from "react";
import { useEffect, useRef } from "react";
import type { ImageBuildParams } from "../types/AuraStyle";

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
        try {
            const images = await OBR.assets.downloadImages(
                false,
                undefined,
                "PROP",
            );
            const selected = images[0];
            if (selected) {
                onChange({
                    image: selected.image,
                    grid: selected.grid,
                });
            }
        } catch (e) {
            console.log(e);
            let error = "Failed to get image";
            if (
                isObject(e) &&
                "error" in e &&
                isObject(e.error) &&
                "message" in e.error &&
                typeof e.error.message === "string"
            ) {
                error = e.error.message;
            }
            complain(error);
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
