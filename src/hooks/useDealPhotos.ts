import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { errMsg } from "@/lib/errors";

export interface DealPhoto {
  id: string;
  deal_id: string;
  rep_id: string;
  storage_path: string;
  caption: string | null;
  created_at: string;
  signedUrl?: string;
}

const BUCKET = "deal-photos";

async function downscaleImage(file: File, maxSide = 1600, quality = 0.82): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  const imageUrl = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Could not read image"));
      img.src = imageUrl;
    });
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    if (scale >= 1 && file.size <= 1_500_000) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

async function attachSignedUrls(photos: DealPhoto[]): Promise<DealPhoto[]> {
  if (photos.length === 0) return photos;
  const { data } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(photos.map((p) => p.storage_path), 60 * 60);
  return photos.map((p, i) => ({ ...p, signedUrl: data?.[i]?.signedUrl }));
}

export function useDealPhotos(dealId: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["deal-photos", dealId],
    enabled: !!user && !!dealId,
    queryFn: async (): Promise<DealPhoto[]> => {
      if (!dealId) return [];
      const { data, error } = await supabase
        .from("deal_photos")
        .select("*")
        .eq("deal_id", dealId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return attachSignedUrls((data ?? []) as DealPhoto[]);
    },
  });
}

export function useUploadDealPhoto() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ dealId, file, caption }: { dealId: string; file: File; caption?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const uploadFile = await downscaleImage(file);
      const ext = uploadFile.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/${dealId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, uploadFile, {
        cacheControl: "3600",
        upsert: false,
      });
      if (upErr) throw upErr;
      const { error: insErr } = await supabase
        .from("deal_photos")
        .insert({ deal_id: dealId, rep_id: user.id, storage_path: path, caption: caption ?? null });
      if (insErr) throw insErr;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["deal-photos", vars.dealId] });
      toast.success("Photo uploaded");
    },
    onError: (err) => toast.error(errMsg(err, "Upload failed")),
  });
}

export function useDeleteDealPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (photo: DealPhoto) => {
      await supabase.storage.from(BUCKET).remove([photo.storage_path]);
      const { error } = await supabase.from("deal_photos").delete().eq("id", photo.id);
      if (error) throw error;
    },
    onSuccess: (_d, photo) => {
      qc.invalidateQueries({ queryKey: ["deal-photos", photo.deal_id] });
    },
    onError: (err) => toast.error(errMsg(err, "Delete failed")),
  });
}
