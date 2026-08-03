import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ContestCard } from "./ContestCard";
import { AuthProvider } from "@/context/AuthContext";
import type { Contest } from "@/types";

const baseContest: Contest = {
  _id: "contest-1",
  client: { _id: "client-1", name: "Priya Deshmukh" },
  title: "Design a Logo",
  description: "We need a modern logo for our startup.",
  category: "Graphics & Design",
  skills: ["Logo Design", "Branding", "Illustrator"],
  prizeAmount: 5000,
  currency: "INR",
  deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  status: "open",
  entriesCount: 3,
  createdAt: new Date().toISOString(),
};

function renderCard(contest: Contest) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuthProvider>
          <ContestCard contest={contest} />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("ContestCard", () => {
  it("shows the contest title, category, and prize amount", () => {
    renderCard(baseContest);
    expect(screen.getByText("Design a Logo")).toBeInTheDocument();
    expect(screen.getByText("₹5,000")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Entries")).toBeInTheDocument();
  });

  it("shows up to 4 skill badges", () => {
    renderCard(baseContest);
    expect(screen.getByText("Logo Design")).toBeInTheDocument();
    expect(screen.getByText("Branding")).toBeInTheDocument();
    expect(screen.getByText("Illustrator")).toBeInTheDocument();
  });

  it("links to the contest's detail page", () => {
    renderCard(baseContest);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/contests/contest-1");
  });

  it("shows 'Closed' once the deadline has passed", () => {
    renderCard({ ...baseContest, deadline: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() });
    expect(screen.getByText("Closed")).toBeInTheDocument();
  });
});
