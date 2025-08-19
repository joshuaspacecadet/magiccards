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
  // Use resource_type 'auto' to support images, PDFs, AI/PSD, etc.
  const res = await fetch("https://api.cloudinary.com/v1_1/dnfikz63v/auto/upload", {
    method: "POST",
    body: formData,
  });

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
