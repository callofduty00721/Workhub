import EmployerDashboard from "@/pages/dashboard/EmployerDashboard";

export default function ClientDashboard() {
  return <EmployerDashboard role="client" basePath="/dashboard/client" entityLabel="Project" source="project" />;
}
