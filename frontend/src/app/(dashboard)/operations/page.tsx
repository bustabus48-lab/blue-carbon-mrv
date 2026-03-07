import OperationsClient from "./OperationsClient";
import { headers } from "next/headers";

export const metadata = {
    title: "Operations & Governance | Blue Carbon MRV",
    description: "Manage ingestion jobs and classification runs.",
};

async function getGovernanceData() {
    try {
        const _headers = await headers();
        const cookieHeader = _headers.get("cookie") || "";
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

        // In a real app we would pass the cookie, but for MVP we just fetch directly
        const [projectsRes, jobsRes, runsRes] = await Promise.all([
            fetch(`${apiUrl}/api/v1/projects`, { cache: "no-store", headers: { cookie: cookieHeader } }),
            fetch(`${apiUrl}/api/v1/governance/ingestion-jobs?limit=100`, { cache: "no-store", headers: { cookie: cookieHeader } }),
            fetch(`${apiUrl}/api/v1/governance/classification-runs?limit=50`, { cache: "no-store", headers: { cookie: cookieHeader } })
        ]);

        const projects = projectsRes.ok ? await projectsRes.json() : [];
        const jobs = jobsRes.ok ? await jobsRes.json() : [];
        const runs = runsRes.ok ? await runsRes.json() : [];

        return { projects, jobs, runs };
    } catch (error) {
        console.error("Error fetching governance data:", error);
        return { projects: [], jobs: [], runs: [] };
    }
}

export default async function OperationsPage() {
    const { projects, jobs, runs } = await getGovernanceData();
    return <OperationsClient projects={projects} initialJobs={jobs} initialRuns={runs} />;
}
