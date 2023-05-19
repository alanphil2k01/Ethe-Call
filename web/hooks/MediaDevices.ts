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
    audio: true,
    cursor: true,
}

export function useMediaDevices() {
    const userStream = useRef<MediaStream>(null);
    const userScreenShare = useRef<MediaStream>(null);
    const camTrack = useRef<MediaStreamTrack>(null);

    const [loadedDeviceList, setLoadedDeviceList] = useState(false);
    const [loadedStream, setLoadedStream] = useState(false);
    const [tracksChanged, setTracksChanged] = useState(false);

    const audioInList = useRef<DeviceInfo[]>([]);
    const audioOutList = useRef<DeviceInfo[]>([]);
    const cameraList = useRef<DeviceInfo[]>([]);

    const [audioIn, setAudioIn] = useState<string>("");
    const [audioOut, setAudioOut] = useState<string>("");
    const [camera, setCamera] = useState<string>("");

    const vidStreamConstraints = useRef<MediaStreamConstraints>(defaultVidStreamConstraints)
    const screenCaptureContraints = useRef<MediaStreamConstraints>(defaultScreenCaptureContraints);

    useEffect(() => {
        initStream();
    }, [camera, audioIn]);

    async function initStream() {
        if (!loadedDeviceList) {
            await initMediaDevices();
        }
        if (!audioIn && !camera) {
            vidStreamConstraints.current = defaultVidStreamConstraints;
        } else {
            vidStreamConstraints.current = {
                audio: {deviceId: audioIn ? {exact: audioIn} : undefined},
                video: {deviceId: camera ? {exact: camera} : undefined,
                        width: {min: 1280, ideal: 1920, max: 1920},
                        height: {min: 720, ideal: 1080, max: 1080}
                },
            };
        }
        await getUserStream()
        setLoadedStream(true);
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
        setLoadedDeviceList(true);
    }
    //
    // function changeAudioOut(videoElement: any) {
    //     if (typeof videoElement.sinkId !== 'undefined') {
    //         videoElement.setSinkId(audioOut)
    //         .then(() => {
    //             console.log(`Success, audio output device attached: ${audioOut}`);
    //         })
    //     } else {
    //         console.warn('Browser does not support output device selection.');
    //     }
    // }

    async function getUserStream() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia(vidStreamConstraints.current)
            camTrack.current = stream.getTracks().find((track) => track.kind === "video");
            if (!userStream.current) {
                userStream.current = stream;
                return;
            }
            userStream.current.getTracks().forEach((track) => {
                userStream.current.removeTrack(track);
            });
            stream.getTracks().forEach((track) => {
                userStream.current.addTrack(track)
            });
            setTracksChanged(true);
        } catch (err) {
            if (!userStream.current) {
                userStream.current = new MediaStream();
            }
        }
    }

    async function startScreenShare(screenShareCleanup: () => void) {
        try {
            userScreenShare.current = await navigator.mediaDevices.getDisplayMedia(screenCaptureContraints.current)
            userStream.current.removeTrack(camTrack.current);
            const captureVideoTrack = userScreenShare.current.getTracks().find((track) => track.kind === "video");
            captureVideoTrack.onended = () => {
                stopScreenShare();
                screenShareCleanup();
            }
            userStream.current.addTrack(captureVideoTrack);
            setTracksChanged(true);
        } catch (err) {
            console.log(err);
        }
    }

    function stopScreenShare() {
        const captureVideoTrack = userScreenShare.current.getTracks().find((track) => track.kind === "video");
        userStream.current.removeTrack(captureVideoTrack);
        userScreenShare.current.getTracks()?.forEach((track) => track.stop());
        userStream.current.addTrack(camTrack.current);
        setTracksChanged(true);
    }

    return {
        initMediaDevices,
        loadedStream,
        userStream,
        userScreenShare,
        camTrack,
        startScreenShare,
        stopScreenShare,
        tracksChanged,
        setTracksChanged,
        cameraList,
        audioInList,
        audioOutList,
        setAudioIn,
        setCamera,
        // changeAudioOut,
    };
}


