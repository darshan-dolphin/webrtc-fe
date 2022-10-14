import React, { useEffect, useRef } from "react";

const VideoPlayer: React.FC<{ stream: MediaStream }> = ({ stream }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  return (
    <>
      <video className="m-16 bg-slate-200" ref={videoRef} autoPlay muted={true} controls />
    </>
  );
};

export default VideoPlayer;
