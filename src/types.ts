export interface FamilyMember {
  id: string;
  name: string;
  gender: "male" | "female" | "other";
  birthYear?: string;
  deathYear?: string;
  birthPlace?: string;
  occupation?: string;
  notes?: string;
  fatherId?: string;
  motherId?: string;
  spouseId?: string;
}

export type RelationType = "father" | "mother" | "spouse" | "child" | "sibling" | "none";

export interface TreeStats {
  totalCount: number;
  generationsCount: number;
  maleCount: number;
  femaleCount: number;
}
