import React, { useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import VideoPlayer from "../components/VideoPlayer";
import { PeerState } from "../context/peerReducers";
import { RoomContext } from "../context/RoomContext";
import { HiDesktopComputer } from "react-icons/hi";

const Room = () => {
  const { id } = useParams();
  const { ws, me, stream, peers, shareScreen, screenSharingId, setRoomId } =
    useContext(RoomContext);

  useEffect(() => {
    if (me) ws.emit("join-room", { roomId: id, peerId: me._id });
  }, [id, me, ws]);

  useEffect(() => {
    setRoomId(id);
  }, [id, setRoomId]);

  console.log("_dp screenSharingId", { screenSharingId });

  return (
    <>
      Room id : {id}
      <div className="grid grid-cols-4 gap-4">
        <VideoPlayer stream={stream} />

        {Object.values(peers as PeerState).map((peer) => (
          <VideoPlayer stream={peer.stream} />
        ))}
      </div>
      <div className="fixed bottom-0 p-6 w-full flex justify-center border-t-2">
        <button
          className="bg-rose-400 p-3 rounded-lg text-xl hover:bg-rose-600 text-white"
          onClick={() => shareScreen()}
        >
          <HiDesktopComputer />
        </button>
      </div>
    </>
  );
};

export default Room;
