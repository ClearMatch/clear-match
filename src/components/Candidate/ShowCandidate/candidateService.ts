import { supabase } from "@/lib/supabase";
import { Candidate } from "../CandidateList/Types";

interface CandidateTag {
  tags: {
    id: string;
    name: string;
    color: string;
  };
}

/**
 * Fetches a candidate by ID with associated tags
 * @param candidateId - The unique identifier for the candidate
 * @returns Promise<Candidate> - The candidate with transformed tags
 */
export async function fetchCandidateById(candidateId: string): Promise<Candidate> {
  if (!candidateId || typeof candidateId !== 'string') {
    throw new Error('Invalid candidate ID provided');
  }
  const { data, error } = await supabase
    .from("contacts")
    .select(
      `
      *,
      tags:contact_tags (
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
    tags: data.tags?.map((ct: CandidateTag) => ct.tags).filter(Boolean) || [],
  };

  return transformedData;
}