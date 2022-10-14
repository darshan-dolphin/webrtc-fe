import { createContext, useEffect, useState, useReducer } from "react";
import socketIOClient from "socket.io-client";
import { useNavigate } from "react-router-dom";
import Peer from "peerjs";
import { v4 as uuidv4 } from "uuid";
import { peerReducer } from "./peerReducers";
import { addPeerAction, removePeerAction } from "./peerActions";

// const WS = "http://192.168.4.97:8080";
// const WS = "http://192.168.4.153:8080";
const WS = "https://b0d6-122-169-118-120.ngrok.io";
// const WS = "https://webrtc-d.herokuapp.com";
// const WS = "http://122.169.118.120";

export const RoomContext = createContext<null | any>(null);

const ws = socketIOClient(WS);

export const RoomProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [me, setMe] = useState<Peer>();
  const [stream, setStream] = useState<MediaStream | null>();
  const [peers, dispatch] = useReducer(peerReducer, {});
  const [screenSharingId, setScreenSharingId] = useState<string>("");
  const [roomId, setRoomId] = useState<string>("");

  const enterRoom = ({ roomId }: { roomId: string }) => {
    console.log({ roomId });
    navigate(`/room/${roomId}`);
  };

  const getUsers = ({ participants }: { participants: string[] }) => {
    console.log({ participants });
  };

  const removePeer = (peerId: string) => {
    dispatch(removePeerAction(peerId));
  };

  const switchStream = (stream: MediaStream) => {
    setStream(stream);
    setScreenSharingId(me?.id || "");
    Object.values(me?.connections).forEach((connection: any) => {
      const videoTrack = stream
        ?.getTracks()
        .find((track) => track.kind === "video");
      console.log(connection[0].peerConnection.getSenders()[1]);
      connection[0].peerConnection
        .getSenders()[1]
        .replaceTrack(videoTrack)
        .catch((err: any) => console.error(err));
    });
  };

  const shareScreen = () => {
    if (screenSharingId)
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then(switchStream);
    else navigator.mediaDevices.getDisplayMedia({}).then(switchStream);
  };

  useEffect(() => {
    const meId = uuidv4();

    const peer = new Peer(meId);
    setMe(peer);

    async function enableStream() {
      try {
        const st = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        // console.log("_dp stream", st);

        setStream(st);
      } catch (error) {
        console.error(error);
      }
    }

    enableStream();

    const askPermission = async (): Promise<MediaStream | null> =>
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

    let localstream: MediaStream | null;

    askPermission()
      .then((response) => {
        localstream = response;
      })
      .then(() => {
        localstream?.getTracks().forEach((track) => {
          track.stop();
        });
      });

    ws.on("room-created", enterRoom);
    ws.on("get-users", getUsers);
    ws.on("user-disconnected", removePeer);
    ws.on("user-started-sharing", (peerId) => setScreenSharingId(peerId));
    ws.on("user-stopped-sharing", () => setScreenSharingId(""));

    return () => {
      ws.off("room-created");
      ws.off("get-users");
      ws.off("user-disconnected");
      ws.off("user-started-sharing");
      ws.off("user-stopped-sharing");
      ws.off("user-joined");
    };
  }, []);

  useEffect(() => {
    if (screenSharingId)
      ws.emit("start-sharing", { peerId: screenSharingId, roomId });
    else ws.emit("stop-sharing");
  }, [screenSharingId, roomId]);

  useEffect(() => {
    if (!me) return;
    if (!stream) return;

    ws.on("user-joined", ({ peerId }) => {
      const call = me.call(peerId, stream);
      call.on("stream", (peerStream) => {
        dispatch(addPeerAction(peerId, peerStream));
      });
    });

    me.on("call", (call) => {
      call.answer(stream);
      call.on("stream", (peerStream) => {
        dispatch(addPeerAction(call.peer, peerStream));
      });
    });
  }, [me, stream]);

  console.log({ peers });

  return (
    <RoomContext.Provider
      value={{ ws, me, stream, peers, shareScreen, setRoomId, screenSharingId }}
    >
      {children}
    </RoomContext.Provider>
  );
};
