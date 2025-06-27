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
  const res = await fetch("https://api.cloudinary.com/v1_1/dnfikz63v/upload", {
    method: "POST",
    body: formData,
  });

  console.log("Cloudinary response status:", res.status);

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Cloudinary upload failed:", errorText);
    throw new Error("Failed to upload file to Cloudinary");
  }

  const data = await res.json();
  console.log("Cloudinary upload successful:", data.secure_url);
  return data.secure_url; // This is the public URL
}
