import { useRef, useState } from "react";
import { supabase } from "../lib/supabase.js";

const MAX_SIDE = 1600;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read this image. Try a JPG or PNG.")); };
    img.src = url;
  });
}

function toBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function shrink(file) {
  const img = await loadImage(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
  let blob = await toBlob(canvas, "image/webp", 0.85);
  if (!blob || blob.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg", 0.85);
  if (!blob) throw new Error("Could not process this image.");
  return blob;
}

export default function ImageUpload({ value, onChange, label = "Image", folder = "products" }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onPick(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) return setError("Please choose an image file.");
    setBusy(true);
    try {
      const blob = await shrink(file);
      const ext = blob.type === "image/webp" ? "webp" : "jpg";
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(path, blob, { contentType: blob.type, cacheControl: "31536000", upsert: false });
      if (upErr) throw new Error(upErr.message);
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="field">
      <span>{label}</span>
      <div className="upload-box">
        {value ? <img className="upload-preview" src={value} alt="" /> : null}
        <div className="row">
          <button type="button" className="btn btn-sm" disabled={busy} onClick={() => inputRef.current.click()}>
            {busy ? "Uploading…" : value ? "Change photo" : "Choose photo"}
          </button>
          {value && !busy ? (
            <button type="button" className="btn btn-danger btn-sm" onClick={() => onChange("")}>Remove</button>
          ) : null}
        </div>
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={onPick} />
        {error ? <p className="error-text">{error}</p> : null}
      </div>
    </div>
  );
}
