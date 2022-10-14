import React, { useContext } from "react";
import { RoomContext } from "../context/RoomContext";

const CreateButton: React.FC = () => {
  const { ws } = useContext(RoomContext);
  const createRoom = () => {
    ws.emit("create-room");
  };

  return (
    <button
      onClick={createRoom}
      className="bg-slate-500 px-4 py-4 rounded-lg hover:bg-slate-300 text-white hover:text-slate-800"
    >
      Start new Meeting
    </button>
  );
};

export default CreateButton;
