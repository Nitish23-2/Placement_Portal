export type SignupRole = "student" | "faculty";

export type SignupIdentity = {
  role: SignupRole;
  enrollmentNo?: string;
  branchScope?: string;
};

const studentPattern = /^(\d+)@gbpuat\.ac\.in$/i;
const facultyPattern = /^[a-z.]+\.([a-z]+)@gbpuat-tech\.ac\.in$/i;

export function getSignupIdentity(email: string): SignupIdentity | null {
  const normalizedEmail = email.trim().toLowerCase();
  const studentMatch = normalizedEmail.match(studentPattern);

  if (studentMatch) {
    return { role: "student", enrollmentNo: studentMatch[1] };
  }

  const facultyMatch = normalizedEmail.match(facultyPattern);
  if (facultyMatch) {
    return { role: "faculty", branchScope: facultyMatch[1] };
  }

  return null;
}

export function getDomainHint(email: string): string {
  const identity = getSignupIdentity(email);
  if (identity?.role === "student") return `Student · enrollment ${identity.enrollmentNo}`;
  if (identity?.role === "faculty" && identity.branchScope) {
    return `Faculty · ${identity.branchScope.toUpperCase()} coordinator`;
  }
  return "Use your GBPUAT college email address";
}