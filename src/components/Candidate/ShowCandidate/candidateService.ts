import { supabase } from "@/lib/supabase";
import { Candidate } from "../CandidateList/Types";

export async function fetchCandidateById(candidateId: string): Promise<Candidate> {
  const { data, error } = await supabase
    .from("candidates")
    .select(
      `
      *,
      tags:candidate_tags (
        tags (
          id,
          name,
          color
        )
      )
    `
    )
    .eq("id", candidateId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch candidate: ${error.message}`);
  }

  if (!data) {
    throw new Error("Candidate not found");
  }

  // Transform the tags data to match the expected format
  const transformedData = {
    ...data,
    tags: data.tags?.map((ct: any) => ct.tags).filter(Boolean) || [],
  };

  return transformedData;
}