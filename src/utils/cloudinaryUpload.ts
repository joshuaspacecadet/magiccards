export async function uploadToCloudinary(file: File): Promise<string> {
  console.log(
    "uploadToCloudinary called with file:",
    file.name,
    file.size,
    file.type
  );

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "Magic Cards"); // Use your exact preset name

  console.log("Uploading to Cloudinary...");
  // Choose endpoint by MIME type (images -> image/upload, others -> raw/upload),
  // with a fallback to auto/upload.
  const cloudName = "dnfikz63v";
  const primaryResource = file.type && file.type.startsWith("image/") ? "image" : "raw";

  async function doUpload(resource: "image" | "raw" | "auto") {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);
    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/${resource}/upload`,
        {
          method: "POST",
          body: formData,
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);
      return response;
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }

  let res = await doUpload(primaryResource);
  if (!res.ok) {
    // Try fallback to auto
    try {
      const text = await res.text();
      console.warn(`Primary ${primaryResource}/upload failed:`, text);
    } catch {}
    res = await doUpload("auto");
  }

  console.log("Cloudinary response status:", res.status);

  if (!res.ok) {
    let message = "Failed to upload file to Cloudinary";
    try {
      const maybeJson = await res.json();
      if (maybeJson?.error?.message) message = maybeJson.error.message;
      console.error("Cloudinary upload failed:", maybeJson);
    } catch (_) {
      const errorText = await res.text();
      console.error("Cloudinary upload failed (text):", errorText);
    }
    throw new Error(message);
  }

  const data = await res.json();
  console.log("Cloudinary upload successful:", data.secure_url);
  return data.secure_url; // This is the public URL
}
