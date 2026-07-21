import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { JobCard } from "./JobCard";
import type { Job } from "@/types";

const baseJob: Job = {
  _id: "job-1",
  employer: { _id: "emp-1", name: "MahaHub Ventures" },
  title: "Frontend Engineer",
  companyName: "MahaHub Ventures",
  description: "Build and maintain our React frontend.",
  type: "full_time",
  experienceLevel: "mid",
  skills: ["React", "TypeScript", "Tailwind"],
  location: "Pune, India",
  isRemote: false,
  salaryMin: 60000,
  salaryMax: 90000,
  currency: "INR",
  status: "open",
  applicationsCount: 4,
  createdAt: new Date().toISOString(),
};

function renderCard(job: Job) {
  return render(
    <MemoryRouter>
      <JobCard job={job} />
    </MemoryRouter>
  );
}

describe("JobCard", () => {
  it("shows the title, company, and salary range", () => {
    renderCard(baseJob);
    expect(screen.getByText("Frontend Engineer")).toBeInTheDocument();
    expect(screen.getByText("MahaHub Ventures")).toBeInTheDocument();
    expect(screen.getByText(/₹60,000/)).toBeInTheDocument();
  });

  it("shows a Remote label instead of location when isRemote is true", () => {
    renderCard({ ...baseJob, isRemote: true });
    expect(screen.getByText("Remote")).toBeInTheDocument();
  });

  it("shows the location when not remote", () => {
    renderCard(baseJob);
    expect(screen.getByText("Pune, India")).toBeInTheDocument();
  });

  it("links to the job's detail page", () => {
    renderCard(baseJob);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/jobs/job-1");
  });
});
