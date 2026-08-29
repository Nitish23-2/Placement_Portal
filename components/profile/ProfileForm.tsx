"use client";

import { FormEvent, useEffect, useState } from "react";
import { BRANCHES, normalizeBranchCode } from "@/lib/constants/branches";

type ProfileValues = {
  branch: string;
  batch_year: string;
  cgpa: string;
  active_backlogs: string;
  dob: string;
  category: string;
  sex: string;
  degree: string;
  permanent_address: string;
  father_name: string;
  mobile_no: string;
  certificate_accepted: boolean;
};

type EducationRow = {
  level: string;
  board_university: string;
  completion_year: string;
  score: string;
};

type SemesterRow = {
  year: string;
  semester: string;
  gpa: string;
  cgpa: string;
};

const emptyProfile: ProfileValues = {
  branch: "",
  batch_year: "",
  cgpa: "",
  active_backlogs: "0",
  dob: "",
  category: "",
  sex: "",
  degree: "B.Tech",
  permanent_address: "",
  father_name: "",
  mobile_no: "",
  certificate_accepted: false,
};

const emptyEducation: EducationRow[] = [
  { level: "X", board_university: "", completion_year: "", score: "" },
  { level: "XII", board_university: "", completion_year: "", score: "" },
  { level: "B.Tech/B.S.", board_university: "", completion_year: "", score: "" },
];

const defaultSemesters: SemesterRow[] = [
  { year: "2023-24", semester: "I", gpa: "", cgpa: "" },
  { year: "2023-24", semester: "II", gpa: "", cgpa: "" },
];

export function ProfileForm() {
  const [values, setValues] = useState(emptyProfile);
  const [education, setEducation] = useState(emptyEducation);
  const [semesters, setSemesters] = useState<SemesterRow[]>(defaultSemesters);
  const [message, setMessage] = useState("Loading profile...");
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    fetch("/api/students/me")
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message ?? "Unable to load profile.");
        if (result.data) {
          const general = result.data.biodata_json?.general ?? {};
          const savedEducation = result.data.biodata_json?.education_summary ?? [];
          const savedSemesters = result.data.biodata_json?.semester_record ?? [];

          setValues({
            ...emptyProfile,
            branch:
              result.data.branch && result.data.branch !== "Not set"
                ? normalizeBranchCode(result.data.branch)
                : "",
            batch_year: result.data.batch_year > 0 ? String(result.data.batch_year) : "",
            cgpa: result.data.cgpa == null ? "" : String(result.data.cgpa),
            active_backlogs: String(result.data.active_backlogs ?? 0),
            ...general,
            certificate_accepted: result.data.biodata_json?.certificate_accepted ?? false,
          });

          setEducation(
            emptyEducation.map((row, index) => {
              const saved = savedEducation[index];
              return saved
                ? {
                    level: row.level,
                    board_university: saved.board_university ?? "",
                    completion_year: String(saved.completion_year ?? ""),
                    score: String(saved.percentage ?? saved.cgpa_or_percentage ?? ""),
                  }
                : row;
            })
          );

          if (savedSemesters.length > 0) {
            setSemesters(
              savedSemesters.map((s: SemesterRow) => ({
                year: s.year ?? "",
                semester: s.semester ?? "",
                gpa: s.gpa != null ? String(s.gpa) : "",
                cgpa: s.cgpa != null ? String(s.cgpa) : "",
              }))
            );
          }
        }
        setMessage("");
      })
      .catch((error: Error) => setMessage(error.message));
  }, []);

  function update(field: keyof ProfileValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function updateEducation(index: number, field: keyof EducationRow, value: string) {
    setEducation((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row))
    );
  }

  function updateSemester(index: number, field: keyof SemesterRow, value: string) {
    setSemesters((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row))
    );
  }

  function addSemester() {
    const nextSem =
      ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"][semesters.length] ?? `Sem ${semesters.length + 1}`;
    setSemesters((current) => [...current, { year: "", semester: nextSem, gpa: "", cgpa: "" }]);
  }

  function removeSemester(index: number) {
    if (semesters.length <= 1) return;
    setSemesters((current) => current.filter((_, i) => i !== index));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setMessage("");

    const validSemesters = semesters
      .filter((s) => s.year.trim() && s.semester.trim())
      .map((s) => ({
        year: s.year.trim(),
        semester: s.semester.trim(),
        gpa: Number(s.gpa || 0),
        cgpa: Number(s.cgpa || s.gpa || 0),
      }));

    try {
      const response = await fetch("/api/students/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branch: values.branch,
          batch_year: Number(values.batch_year),
          cgpa: values.cgpa ? Number(values.cgpa) : null,
          active_backlogs: Number(values.active_backlogs || 0),
          biodata_json: {
            general: {
              dob: values.dob,
              category: values.category,
              sex: values.sex,
              degree: values.degree,
              permanent_address: values.permanent_address,
              father_name: values.father_name,
              mobile_no: values.mobile_no,
            },
            education_summary: education.map((row) => ({
              level: row.level,
              board_university: row.board_university,
              completion_year: Number(row.completion_year || 0),
              ...(row.level === "B.Tech/B.S."
                ? { cgpa_or_percentage: Number(row.score || 0) }
                : { percentage: Number(row.score || 0) }),
            })),
            semester_record: validSemesters,
            certificate_accepted: values.certificate_accepted,
          },
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Unable to save profile.");
      setMessage("Profile saved successfully. Ready for placement applications.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save profile.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="profile-form" onSubmit={submit}>
      <label>
        Branch / Department
        <select
          required
          value={values.branch}
          onChange={(event) => update("branch", event.target.value)}
        >
          <option value="">Select your branch</option>
          {BRANCHES.map((b) => (
            <option key={b.code} value={b.code}>
              {b.name} ({b.shortName})
            </option>
          ))}
        </select>
      </label>
      <div className="profile-fields">
        <label>
          Batch year
          <input
            required
            type="number"
            value={values.batch_year}
            onChange={(event) => update("batch_year", event.target.value)}
            placeholder="2027"
          />
        </label>
        <label>
          Overall CGPA
          <input
            type="number"
            min="0"
            max="10"
            step="0.001"
            value={values.cgpa}
            onChange={(event) => update("cgpa", event.target.value)}
            placeholder="8.250"
          />
        </label>
        <label>
          Active backlogs
          <input
            required
            type="number"
            min="0"
            value={values.active_backlogs}
            onChange={(event) => update("active_backlogs", event.target.value)}
          />
        </label>
      </div>
      <div className="profile-fields">
        <label>
          Date of birth
          <input
            required
            type="date"
            value={values.dob}
            onChange={(event) => update("dob", event.target.value)}
          />
        </label>
        <label>
          Category
          <input
            required
            value={values.category}
            onChange={(event) => update("category", event.target.value)}
            placeholder="General / OBC / SC / ST / EWS"
          />
        </label>
        <label>
          Sex
          <input
            required
            value={values.sex}
            onChange={(event) => update("sex", event.target.value)}
            placeholder="Male / Female / Other"
          />
        </label>
      </div>
      <div className="profile-fields">
        <label>
          Degree
          <input
            required
            value={values.degree}
            onChange={(event) => update("degree", event.target.value)}
          />
        </label>
        <label>
          Father&apos;s name
          <input
            required
            value={values.father_name}
            onChange={(event) => update("father_name", event.target.value)}
          />
        </label>
        <label>
          Mobile number
          <input
            required
            value={values.mobile_no}
            onChange={(event) => update("mobile_no", event.target.value)}
          />
        </label>
      </div>
      <label>
        Permanent address
        <textarea
          required
          value={values.permanent_address}
          onChange={(event) => update("permanent_address", event.target.value)}
          rows={3}
        />
      </label>

      <fieldset className="profile-fieldset">
        <legend>Education summary</legend>
        {education.map((row, index) => (
          <div className="profile-fields" key={row.level}>
            <label>
              {row.level} board / university
              <input
                required
                value={row.board_university}
                onChange={(event) => updateEducation(index, "board_university", event.target.value)}
              />
            </label>
            <label>
              Completion year
              <input
                required
                type="number"
                value={row.completion_year}
                onChange={(event) => updateEducation(index, "completion_year", event.target.value)}
              />
            </label>
            <label>
              {row.level === "B.Tech/B.S." ? "CGPA" : "Percentage (%)"}
              <input
                required
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={row.score}
                onChange={(event) => updateEducation(index, "score", event.target.value)}
              />
            </label>
          </div>
        ))}
      </fieldset>

      <fieldset className="profile-fieldset">
        <legend>Semester records</legend>
        {semesters.map((s, index) => (
          <div className="profile-fields" key={index}>
            <label>
              Academic year
              <input
                required
                value={s.year}
                onChange={(event) => updateSemester(index, "year", event.target.value)}
                placeholder="2023-24"
              />
            </label>
            <label>
              Semester
              <input
                required
                value={s.semester}
                onChange={(event) => updateSemester(index, "semester", event.target.value)}
                placeholder="I"
              />
            </label>
            <label>
              Semester GPA
              <input
                required
                type="number"
                min="0"
                max="10"
                step="0.01"
                value={s.gpa}
                onChange={(event) => updateSemester(index, "gpa", event.target.value)}
              />
            </label>
            <label>
              Cumulative CGPA
              <input
                required
                type="number"
                min="0"
                max="10"
                step="0.01"
                value={s.cgpa}
                onChange={(event) => updateSemester(index, "cgpa", event.target.value)}
              />
            </label>
            {semesters.length > 1 && (
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button
                  type="button"
                  className="button button-quiet"
                  style={{ minHeight: "44px", padding: "0 12px" }}
                  onClick={() => removeSemester(index)}
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        ))}
        <button
          type="button"
          className="button button-quiet"
          style={{ marginTop: "12px" }}
          onClick={addSemester}
        >
          + Add semester
        </button>
      </fieldset>

      <label className="profile-check">
        <input
          type="checkbox"
          checked={values.certificate_accepted}
          onChange={(event) =>
            setValues((current) => ({ ...current, certificate_accepted: event.target.checked }))
          }
        />
        I certify that the information provided is accurate and matches my official college records.
      </label>

      <button
        className="button button-accent"
        disabled={isPending || message === "Loading profile..."}
        type="submit"
      >
        {isPending ? "Saving..." : "Save profile"} <span aria-hidden="true">-&gt;</span>
      </button>
      {message && (
        <p className="form-message" role="status">
          {message}
        </p>
      )}
    </form>
  );
}