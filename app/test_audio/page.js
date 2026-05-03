"use client";

import { useState } from "react";
import { saveAudio } from "@/lib/upload";

export default function Page() {
  const [audioURL, setAudioURL] = useState("");

  const handleUpload = async (file) => {
    const url = await saveAudio(file);
    setAudioURL(url);
  };

  return (
    <div>
      <input
        type="file"
        accept="audio/*"
        onChange={(e) => handleUpload(e.target.files[0])}
      />

      {audioURL && <audio controls src={audioURL} />}
    </div>
  );
}