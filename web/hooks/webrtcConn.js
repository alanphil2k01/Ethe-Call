import { useEffect, useRef } from 'react';

const useDtlsSrtpCertificate = () => {
  const rtcConnectionRef = useRef(null);
  const dtlsCertificate = useRef(null);

  useEffect(() => {
    rtcConnectionRef.current = new RTCPeerConnection();

    rtcConnectionRef.current.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
      .then(offer => rtcConnectionRef.current.setLocalDescription(offer))
      .then(() => {
        dtlsCertificate.current = rtcConnectionRef.current.localDescription.sdp.match(/a=fingerprint:sha-256\s(.+)/)[1];
        console.log('DTLS-SRTP Certificate:', dtlsCertificate);
      })
      .catch(error => console.error(error));

    return () => {
      rtcConnectionRef.current.close();
      rtcConnectionRef.current = null;
    };
  }, []);

  return { rtcConnectionRef, dtlsCertificate };
};

export default useDtlsSrtpCertificate;

