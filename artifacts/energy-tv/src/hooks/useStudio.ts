/**
 * useStudio.ts
 * -------------------------------------------------------
 * Supabase-backed hooks for the hidden /studio feature.
 * Requires schema-studio.sql to have been run in Supabase.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { uploadStudioRecording, deleteStudioRecording, getStudioRecordingUrl } from "@/lib/uploads";

const STALE = 30 * 1000;

export interface StudioProject {
  id: string;
  title: string;
  bpm: number;
  lyrics: string;
  created_at: string;
  updated_at: string;
}

export interface StudioTrack {
  id: string;
  project_id: string;
  name: string;
  audio_path: string;
  volume: number;
  muted: boolean;
  created_at: string;
}

// ─── Projects ───────────────────────────────────────────────

export function useStudioProjects() {
  const { user } = useAuth();
  return useQuery<StudioProject[]>({
    queryKey: ["studio", "projects", user?.id],
    enabled: !!user,
    staleTime: STALE,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("studio_projects")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateStudioProject() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (title: string) => {
      if (!user) throw new Error("Must be signed in");
      const { data, error } = await supabase
        .from("studio_projects")
        .insert({ user_id: user.id, title: title || "Untitled" })
        .select()
        .single();
      if (error) throw error;
      return data as StudioProject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studio", "projects"] });
    },
  });
}

export function useUpdateStudioProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...fields
    }: { id: string } & Partial<Pick<StudioProject, "title" | "bpm" | "lyrics">>) => {
      const { error } = await supabase
        .from("studio_projects")
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["studio", "projects"] });
      queryClient.invalidateQueries({ queryKey: ["studio", "project", vars.id] });
    },
  });
}

export function useDeleteStudioProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Tracks cascade-delete at the DB level, but their storage objects
      // need cleaning up separately first.
      const { data: tracks } = await supabase
        .from("studio_tracks")
        .select("audio_path")
        .eq("project_id", id);
      if (tracks?.length) {
        await Promise.all(tracks.map((t) => deleteStudioRecording(t.audio_path)));
      }
      const { error } = await supabase.from("studio_projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studio", "projects"] });
    },
  });
}

// ─── Tracks (per project) ───────────────────────────────────

export interface StudioTrackWithUrl extends StudioTrack {
  url: string;
}

export function useStudioTracks(projectId: string | undefined) {
  return useQuery<StudioTrackWithUrl[]>({
    queryKey: ["studio", "tracks", projectId],
    enabled: !!projectId,
    staleTime: STALE,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("studio_tracks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });
      if (error) throw error;

      const tracks = (data ?? []) as StudioTrack[];
      return Promise.all(
        tracks.map(async (t) => ({ ...t, url: await getStudioRecordingUrl(t.audio_path) }))
      );
    },
  });
}

export function useAddStudioTrack(projectId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ blob, name }: { blob: Blob; name: string }) => {
      if (!user) throw new Error("Must be signed in");
      const path = await uploadStudioRecording(user.id, blob);
      const { error } = await supabase.from("studio_tracks").insert({
        project_id: projectId,
        user_id: user.id,
        name,
        audio_path: path,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studio", "tracks", projectId] });
    },
  });
}

export function useUpdateStudioTrack(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...fields
    }: { id: string } & Partial<Pick<StudioTrack, "name" | "volume" | "muted">>) => {
      const { error } = await supabase.from("studio_tracks").update(fields).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studio", "tracks", projectId] });
    },
  });
}

export function useDeleteStudioTrack(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, audio_path }: { id: string; audio_path: string }) => {
      await deleteStudioRecording(audio_path);
      const { error } = await supabase.from("studio_tracks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studio", "tracks", projectId] });
    },
  });
}
