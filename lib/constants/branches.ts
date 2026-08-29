export interface BranchOption {
  code: string;
  name: string;
  shortName: string;
  aliases: string[];
}

export const BRANCHES: BranchOption[] = [
  {
    code: "cse",
    name: "Computer Science & Engineering",
    shortName: "CSE",
    aliases: [
      "computer science",
      "computer science and engineering",
      "computer science & engineering",
      "cse",
      "cs",
    ],
  },
  {
    code: "it",
    name: "Information Technology",
    shortName: "IT",
    aliases: ["information technology", "it"],
  },
  {
    code: "me",
    name: "Mechanical Engineering",
    shortName: "ME",
    aliases: ["mechanical engineering", "mechanical", "me", "mech"],
  },
  {
    code: "ee",
    name: "Electrical Engineering",
    shortName: "EE",
    aliases: ["electrical engineering", "electrical", "ee"],
  },
  {
    code: "ece",
    name: "Electronics & Communication Engineering",
    shortName: "ECE",
    aliases: [
      "electronics and communication engineering",
      "electronics & communication engineering",
      "electronics",
      "ece",
      "ec",
    ],
  },
  {
    code: "ce",
    name: "Civil Engineering",
    shortName: "CE",
    aliases: ["civil engineering", "civil", "ce"],
  },
  {
    code: "ipe",
    name: "Industrial & Production Engineering",
    shortName: "IPE",
    aliases: [
      "industrial and production engineering",
      "industrial & production engineering",
      "production engineering",
      "ipe",
      "ip",
    ],
  },
  {
    code: "ae",
    name: "Agricultural Engineering",
    shortName: "AE",
    aliases: ["agricultural engineering", "agriculture", "ae", "ag"],
  },
];

export const VALID_BRANCH_CODES = BRANCHES.map((b) => b.code);

export function normalizeBranchCode(input?: string | null): string {
  if (!input) return "";
  const cleaned = input.trim().toLowerCase();
  const found = BRANCHES.find(
    (b) =>
      b.code.toLowerCase() === cleaned ||
      b.shortName.toLowerCase() === cleaned ||
      b.name.toLowerCase() === cleaned ||
      b.aliases.some((alias) => alias.toLowerCase() === cleaned)
  );
  return found ? found.code : cleaned;
}

export function getBranchName(codeOrAlias?: string | null): string {
  if (!codeOrAlias) return "Not set";
  const code = normalizeBranchCode(codeOrAlias);
  const found = BRANCHES.find((b) => b.code.toLowerCase() === code.toLowerCase());
  return found ? found.name : codeOrAlias;
}

export function isValidBranchCode(code?: string | null): boolean {
  if (!code) return false;
  const normalized = normalizeBranchCode(code);
  return BRANCHES.some((b) => b.code === normalized);
}
