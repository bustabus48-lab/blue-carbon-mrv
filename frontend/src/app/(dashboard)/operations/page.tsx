import OperationsClient from "./OperationsClient";
import { headers } from "next/headers";
import { API_BASE_URL } from "@/lib/api";

export const metadata = {
    title: "Operations & Governance | Blue Carbon MRV",
    description: "Manage ingestion jobs and classification runs.",
};

async function getGovernanceData() {
    try {
        const _headers = await headers();
        const cookieHeader = _headers.get("cookie") || "";

        // In a real app we would pass the cookie, but for MVP we just fetch directly
        const [projectsRes, jobsRes, runsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/v1/projects`, { cache: "no-store", headers: { cookie: cookieHeader } }),
            fetch(`${API_BASE_URL}/api/v1/governance/ingestion-jobs?limit=100`, { cache: "no-store", headers: { cookie: cookieHeader } }),
            fetch(`${API_BASE_URL}/api/v1/governance/classification-runs?limit=50`, { cache: "no-store", headers: { cookie: cookieHeader } })
        ]);

        return {
            projects: projects ?? [],
            jobs: jobs ?? [],
            runs: runs ?? [],
        };
    } catch (error) {
        console.error("Error fetching governance data:", error);
        return { projects: [], jobs: [], runs: [] };
    }
}

export default async function OperationsPage() {
    const { projects, jobs, runs } = await getGovernanceData();
    return <OperationsClient projects={projects} initialJobs={jobs} initialRuns={runs} />;
}
