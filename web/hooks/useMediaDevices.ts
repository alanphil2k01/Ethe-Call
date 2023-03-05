import { useEffect, useRef, useState } from "react";


export type DeviceInfo = {
    id: string,
    label: string
}

const defaultVidStreamConstraints = {
    audio: true,
    video: true
}

const defaultScreenCaptureContraints = {
    video: {
        displaySurface: "browser"
    } as MediaTrackSettings,
    audio: true
}

export default function useMediaDevices() {
    const userStreamRef = useRef<MediaStream>(null);
    const userScreenCapture = useRef<MediaStream>(null);

    const [isLoadingStream, setIsLoadingStream] = useState(false);

    const audioInList = useRef<DeviceInfo[]>([]);
    const [audioIn, setAudioIn] = useState<string>("");

    const audioOutList = useRef<DeviceInfo[]>([]);
    const [audioOut, setAudioOut] = useState<string>("");

    const cameraList = useRef<DeviceInfo[]>([]);
    const [camera, setCamera] = useState<string>("");

    const vidStreamConstraints = useRef<MediaStreamConstraints>(defaultVidStreamConstraints)
    const screenCaptureContraints = useRef<MediaStreamConstraints>(defaultScreenCaptureContraints);

    useEffect(() => {
        setIsLoadingStream(true)
        initMediaDevices().then(() => {
            setIsLoadingStream(false);
        });
        return () => {
            if (userStreamRef.current) {
                userStreamRef.current.getTracks().forEach(track => track.stop());
            }
        }
    }, []);

    useEffect(() => {
        const prevConstrains = vidStreamConstraints.current;
        getUserConstraints(audioIn, camera);
        if (vidStreamConstraints.current === prevConstrains) {
            return;
        }

        setIsLoadingStream(true)
        getUserStream().then(() => {
            setIsLoadingStream(false);
        });

        return () => {
            if (userStreamRef.current) {
                userStreamRef.current.getTracks().forEach(track => track.stop());
            }
        }
    }, [audioIn, camera]);

    function getUserConstraints(audioIn: string, camera: string) {
        if (!audioIn && !camera) {
            vidStreamConstraints.current = defaultVidStreamConstraints;
        } else {
            vidStreamConstraints.current = {
                audio: {deviceId: audioIn ? {exact: audioIn} : undefined},
                video: {deviceId: camera ? {exact: camera} : undefined}
            };
        }

    }

    async function initMediaDevices() {
        const deviceInfos = await navigator.mediaDevices.enumerateDevices()
        audioInList.current = [];
        audioOutList.current = [];
        cameraList.current = [];

        for (var i in deviceInfos) {
            const deviceInfo = deviceInfos[i];
            let device: DeviceInfo = { id: "", label: "" };
            device.id = deviceInfo.deviceId;
            if (deviceInfo.kind === 'audioinput') {
                device.label = deviceInfo.label || `microphone ${audioInList.current.length + 1}`;
                audioInList.current.push(device);
            } else if (deviceInfo.kind === 'audiooutput') {
                device.label = deviceInfo.label || `speaker ${audioOutList.current.length + 1}`;
                audioOutList.current.push(device);
            } else if (deviceInfo.kind === 'videoinput') {
                device.label = deviceInfo.label || `camera ${cameraList.current.length + 1}`
                cameraList.current.push(device);
            } else {
                console.log('Unknown source/device: ', deviceInfo);
            }
        }

        setAudioIn(audioInList.current[0]?.id);
        setAudioOut(audioOutList.current[0]?.id);
        setCamera(cameraList.current[0]?.id);

        getUserConstraints(audioInList.current[0]?.id, cameraList.current[0]?.id);
        await getUserStream()
    }

    function changeAudioOut(videoElement: any) {
        if (typeof videoElement.sinkId !== 'undefined') {
            videoElement.setSinkId(audioOut)
            .then(() => {
                console.log(`Success, audio output device attached: ${audioOut}`);
            })
        } else {
            console.warn('Browser does not support output device selection.');
        }
    }

    async function getUserStream() {
        try {
            userStreamRef.current = await navigator.mediaDevices.getUserMedia(vidStreamConstraints.current)
        } catch (err) {
            console.log(err);
        }
    }

    async function initScreenCapture() {
        try {
            userScreenCapture.current = await navigator.mediaDevices.getDisplayMedia(screenCaptureContraints.current)
        } catch (err) {
            console.log(err);
        }
    }

    function test_media_dev() {
        console.log("Audio in List: ", audioInList.current);
        console.log("Audio out List: ", audioOutList.current);
        console.log("Camera List: ", cameraList.current);

        console.log("Selected Audio in: ", audioIn)
        console.log("Selected Audio out: ", audioOut)
        console.log("Selected Camera: ", camera)
    }

    return {
        initMediaDevices,
        isLoadingStream,
        userStreamRef,
        userScreenCapture,
        initScreenCapture,
        audioInList,
        setAudioIn,
        audioOutList,
        changeAudioOut,
        setCamera,
        test_media_dev,
        cameraList
    };
}

