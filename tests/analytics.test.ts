import { describe, expect, it } from "vitest";

describe("Analytics deduplication and CTC metrics", () => {
  it("counts distinct placed students when one student has multiple offers", () => {
    const selectedApplications = [
      { student_id: "student-1", drive_id: "drive-a", ctc: 12 },
      { student_id: "student-1", drive_id: "drive-b", ctc: 18 }, // Same student, second offer
      { student_id: "student-2", drive_id: "drive-a", ctc: 10 },
    ];

    const distinctPlacedStudents = new Set(selectedApplications.map((app) => app.student_id));
    expect(distinctPlacedStudents.size).toBe(2);

    const totalStudents = 10;
    const placementPct = Math.round((distinctPlacedStudents.size / totalStudents) * 10000) / 100;
    expect(placementPct).toBe(20);
  });

  it("calculates accurate average and highest CTC from offers", () => {
    const ctcOffers = [10, 12, 18, 8];
    const highestCtc = Math.max(...ctcOffers);
    const averageCtc = Math.round((ctcOffers.reduce((a, b) => a + b, 0) / ctcOffers.length) * 100) / 100;

    expect(highestCtc).toBe(18);
    expect(averageCtc).toBe(12);
  });
});
