import { api } from "./axios";

export type UploadFolder =
  | "avatar"
  | "profile_cover"
  | "startup_logo"
  | "startup_cover"
  | "pitch_deck"
  | "document"
  | "resume"
  | "service_cover";

export const uploadApi = {
  upload: (file: File, folder: UploadFolder) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    return api
      .post<{ success: boolean; data: { url: string; publicId: string; name: string } }>("/uploads", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.data);
  },
};
