export async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "Magic Cards"); // Use your exact preset name

  const res = await fetch("https://api.cloudinary.com/v1_1/dnfikz63v/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Failed to upload file to Cloudinary");
  }

  const data = await res.json();
  return data.secure_url; // This is the public URL
}
