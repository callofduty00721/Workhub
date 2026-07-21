import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { FreelancerCard } from "./FreelancerCard";
import type { FreelancerSummary } from "@/types";

const baseFreelancer: FreelancerSummary = {
  _id: "f1",
  name: "Aditi Kulkarni",
  headline: "Graphic Designer",
  location: "Pune, India",
  skills: ["Logo Design", "Branding", "Illustrator", "Packaging"],
  hourlyRate: 800,
  rating: 4.8,
  reviewCount: 12,
  yearsOfExperience: 5,
};

function renderCard(freelancer: FreelancerSummary) {
  return render(
    <MemoryRouter>
      <FreelancerCard freelancer={freelancer} />
    </MemoryRouter>
  );
}

describe("FreelancerCard", () => {
  it("shows the name, headline, and hourly rate", () => {
    renderCard(baseFreelancer);
    expect(screen.getByText("Aditi Kulkarni")).toBeInTheDocument();
    expect(screen.getByText("Graphic Designer")).toBeInTheDocument();
    expect(screen.getByText(/₹800/)).toBeInTheDocument();
  });

  it("shows only the first 4 skills", () => {
    renderCard({ ...baseFreelancer, skills: ["A", "B", "C", "D", "E"] });
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("D")).toBeInTheDocument();
    expect(screen.queryByText("E")).not.toBeInTheDocument();
  });

  it("shows 'Rate on request' when hourlyRate is 0", () => {
    renderCard({ ...baseFreelancer, hourlyRate: 0 });
    expect(screen.getByText("Rate on request")).toBeInTheDocument();
  });

  it("links to the freelancer's profile page", () => {
    renderCard(baseFreelancer);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/freelancers/f1");
  });
});
