import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export async function saveAudio(file) {
  const url = URL.createObjectURL(file);

  await addDoc(collection(db, "audio"), {
    name: file.name,
    type: file.type,
    url: url,
    createdAt: new Date()
  });

  return url;
}