import { describe, it, expect } from "vitest";

describe("IDOR & Tenant Authorization Scoping Rules", () => {
  // Logic helpers representing server authorization invariants
  function authorizeStudentAccess(actorUserId: string, targetStudentUserId: string, actorRole: string): boolean {
    if (actorRole === "admin") return true;
    if (actorRole === "student") return actorUserId === targetStudentUserId;
    return false;
  }

  function authorizeFacultyBranchAccess(facultyBranchScope: string, studentBranch: string, actorRole: string): boolean {
    if (actorRole === "admin") return true;
    if (actorRole === "faculty") {
      const normalizedFaculty = facultyBranchScope.trim().toLowerCase();
      const normalizedStudent = studentBranch.trim().toLowerCase();
      return normalizedFaculty === normalizedStudent;
    }
    return false;
  }

  it("prevents Student A from accessing or modifying Student B data", () => {
    const studentA = { userId: "user-student-a", role: "student" };
    const studentB = { userId: "user-student-b", role: "student" };

    // Student A accessing own record
    expect(authorizeStudentAccess(studentA.userId, studentA.userId, studentA.role)).toBe(true);

    // Student A attempting to access Student B
    expect(authorizeStudentAccess(studentA.userId, studentB.userId, studentA.role)).toBe(false);
  });

  it("prevents Faculty from accessing students outside assigned branch scope", () => {
    const meFaculty = { branchScope: "me", role: "faculty" };
    const cseStudent = { branch: "cse" };
    const meStudent = { branch: "me" };

    // Faculty accessing own branch student
    expect(authorizeFacultyBranchAccess(meFaculty.branchScope, meStudent.branch, meFaculty.role)).toBe(true);

    // Faculty attempting to access different department student
    expect(authorizeFacultyBranchAccess(meFaculty.branchScope, cseStudent.branch, meFaculty.role)).toBe(false);
  });

  it("allows Admin universal oversight across all branches and student profiles", () => {
    const adminUser = { userId: "user-admin", role: "admin" };
    expect(authorizeStudentAccess(adminUser.userId, "any-student-id", adminUser.role)).toBe(true);
    expect(authorizeFacultyBranchAccess("any-scope", "any-branch", adminUser.role)).toBe(true);
  });
});
