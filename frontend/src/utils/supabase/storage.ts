import { createClient } from "./client";

/**
 * Uploads a file directly to the Supabase Storage bucket.
 * Designed to be called from a Client Component (browser).
 */
export async function uploadEvidencePhoto(file: File): Promise<{ url: string | null; error: any }> {
    const supabase = createClient();

    // Create a unique file path to prevent collisions
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `field_evidence/${fileName}`;

    // Upload to the 'alert_evidence_photos' bucket
    const { error: uploadError } = await supabase.storage
        .from('alert_evidence_photos')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (uploadError) {
        console.error("Storage upload error:", uploadError);
        return { url: null, error: uploadError };
    }

    // Get the public URL to save to the database
    const { data } = supabase.storage
        .from('alert_evidence_photos')
        .getPublicUrl(filePath);

    return { url: data.publicUrl, error: null };
}
