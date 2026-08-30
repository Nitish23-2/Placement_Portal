import { describe, it, expect } from "vitest";

describe("Analytics Calculation & Offer Deduplication Mathematics", () => {
  type Student = { id: string; branch: string; batch_year: number };
  type Application = { student_id: string; drive_ctc_min: number; drive_ctc_max: number; status: "applied" | "shortlisted" | "selected" | "rejected" };

  function computePlacementMetrics(students: Student[], applications: Application[]) {
    const studentMap = new Map(students.map((s) => [s.id, s.branch]));
    const totalStudents = students.length;

    // Filter to selected applications (representing confirmed offers)
    const selectedApps = applications.filter((app) => app.status === "selected" && studentMap.has(app.student_id));
    const totalOffers = selectedApps.length;

    const distinctPlaced = new Set<string>();
    const offerCtcList: number[] = [];
    let highestCtc = 0;

    const branchStats = new Map<string, { total: number; placed: Set<string>; offers: number; ctcList: number[] }>();
    students.forEach((s) => {
      if (!branchStats.has(s.branch)) {
        branchStats.set(s.branch, { total: 0, placed: new Set(), offers: 0, ctcList: [] });
      }
      branchStats.get(s.branch)!.total += 1;
    });

    selectedApps.forEach((app) => {
      const studentId = app.student_id;
      const branch = studentMap.get(studentId)!;
      const ctc = app.drive_ctc_max || app.drive_ctc_min;

      distinctPlaced.add(studentId);
      const bStat = branchStats.get(branch)!;
      bStat.placed.add(studentId);
      bStat.offers += 1;
      if (ctc > 0) {
        bStat.ctcList.push(ctc);
        offerCtcList.push(ctc);
        if (ctc > highestCtc) highestCtc = ctc;
      }
    });

    const totalPlaced = distinctPlaced.size;
    const placementPercentage = totalStudents > 0 ? Math.round((totalPlaced / totalStudents) * 10000) / 100 : 0;
    const avgOfferCtc =
      offerCtcList.length > 0 ? Math.round((offerCtcList.reduce((a, b) => a + b, 0) / offerCtcList.length) * 100) / 100 : 0;

    return {
      totalStudents,
      totalPlaced,
      totalOffers,
      placementPercentage,
      highestCtc,
      avgOfferCtc,
      byBranch: Array.from(branchStats.entries()).map(([branch, stat]) => ({
        branch,
        total: stat.total,
        placed: stat.placed.size,
        offers: stat.offers,
        avgCtc: stat.ctcList.length > 0 ? Math.round((stat.ctcList.reduce((a, b) => a + b, 0) / stat.ctcList.length) * 100) / 100 : 0,
      })),
    };
  }

  it("accurately computes placement % and deduplicates multi-offer students", () => {
    // Controlled dataset matching Phase 20:
    // Student A (CSE): Offer 1 = 10 LPA, Offer 2 = 18 LPA
    // Student B (ECE): Offer 1 = 12 LPA
    // Student C (ME): No offer (only applied)
    const students: Student[] = [
      { id: "student-a", branch: "cse", batch_year: 2026 },
      { id: "student-b", branch: "ece", batch_year: 2026 },
      { id: "student-c", branch: "me", batch_year: 2026 },
    ];

    const applications: Application[] = [
      { student_id: "student-a", drive_ctc_min: 8, drive_ctc_max: 10, status: "selected" },
      { student_id: "student-a", drive_ctc_min: 15, drive_ctc_max: 18, status: "selected" },
      { student_id: "student-b", drive_ctc_min: 10, drive_ctc_max: 12, status: "selected" },
      { student_id: "student-c", drive_ctc_min: 6, drive_ctc_max: 8, status: "applied" },
    ];

    const result = computePlacementMetrics(students, applications);

    expect(result.totalStudents).toBe(3);
    expect(result.totalPlaced).toBe(2); // Student A and Student B
    expect(result.totalOffers).toBe(3); // 2 offers for A + 1 for B
    expect(result.placementPercentage).toBe(66.67); // 2/3 = 66.67%
    expect(result.highestCtc).toBe(18);
    expect(result.avgOfferCtc).toBe(13.33); // (10 + 18 + 12) / 3 = 40 / 3 = 13.33 LPA

    // Branch Breakdown verification
    const cse = result.byBranch.find((b) => b.branch === "cse")!;
    expect(cse.total).toBe(1);
    expect(cse.placed).toBe(1);
    expect(cse.offers).toBe(2);
    expect(cse.avgCtc).toBe(14); // (10 + 18) / 2 = 14 LPA

    const me = result.byBranch.find((b) => b.branch === "me")!;
    expect(me.total).toBe(1);
    expect(me.placed).toBe(0);
    expect(me.offers).toBe(0);
    expect(me.avgCtc).toBe(0);
  });
});
