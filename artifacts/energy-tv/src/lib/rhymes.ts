export interface RhymeResult {
  word: string;
  score: number;
}

export async function fetchRhymes(word: string): Promise<RhymeResult[]> {
  const trimmed = word.trim();
  if (!trimmed) return [];

  const res = await fetch(
    `https://api.datamuse.com/words?rel_rhy=${encodeURIComponent(trimmed)}&max=30`
  );
  if (!res.ok) throw new Error("Rhyme lookup failed");
  return res.json();
}

export async function fetchNearRhymes(word: string): Promise<RhymeResult[]> {
  // Datamuse's "near rhyme" (approximate/slant rhyme) relation — useful for
  // rap where slant rhymes are the norm, not just perfect rhymes.
  const trimmed = word.trim();
  if (!trimmed) return [];

  const res = await fetch(
    `https://api.datamuse.com/words?rel_nry=${encodeURIComponent(trimmed)}&max=30`
  );
  if (!res.ok) throw new Error("Rhyme lookup failed");
  return res.json();
}
