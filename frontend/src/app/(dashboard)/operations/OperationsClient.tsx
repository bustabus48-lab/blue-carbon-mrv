"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Activity, CheckCircle, Clock, Database, FileText, Search, ShieldAlert, SlidersHorizontal, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";

interface Job {
    id: string;
    project_id: string;
    job_type: string;
    filename: string;
    file_hash: string;
    status: string;
    validation_errors: any[];
    audit_log: any[];
    created_at: string;
    updated_at: string;
}

interface Run {
    id: string;
    project_id: string;
    run_type: string;
    status: string;
    tiles_processed: number;
    alerts_generated: number;
    cloud_cover_avg: number | null;
    error_message: string | null;
    started_at: string;
    completed_at: string | null;
    duration_seconds: number | null;
}

interface OperationsClientProps {
    projects: any[];
    initialJobs: Job[];
    initialRuns: Run[];
}

export default function OperationsClient({ projects, initialJobs, initialRuns }: OperationsClientProps) {
    const [jobs, setJobs] = useState<Job[]>(initialJobs);
    const [runs, setRuns] = useState<Run[]>(initialRuns);
    const [selectedProject, setSelectedProject] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [activeTab, setActiveTab] = useState<"ingestion" | "classification">("ingestion");

    const filteredJobs = useMemo(() => {
        return jobs.filter(job =>
            (selectedProject === "all" || job.project_id === selectedProject) &&
            (statusFilter === "all" || job.status === statusFilter)
        );
    }, [jobs, selectedProject, statusFilter]);

    const filteredRuns = useMemo(() => {
        return runs.filter(run =>
            (selectedProject === "all" || run.project_id === selectedProject) &&
            (statusFilter === "all" || run.status === statusFilter)
        );
    }, [runs, selectedProject, statusFilter]);

    const handleJobAction = async (jobId: string, action: "approved" | "rejected") => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/governance/ingestion-jobs/${jobId}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: action })
            });
            if (!res.ok) throw new Error("Failed to update status");

            toast.success(`Job marked as ${action}`);
            setJobs(jobs.map(j => j.id === jobId ? { ...j, status: action } : j));
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'completed':
            case 'approved':
            case 'success':
                return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
            case 'failed':
            case 'rejected':
                return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
            case 'queued':
            case 'pending_approval':
                return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
            case 'processing':
            case 'running':
                return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
            default:
                return 'bg-slate-800 text-slate-400 border border-slate-700';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                        <Activity className="w-6 h-6 text-emerald-500" />
                        Operations & Governance
                    </h1>
                    <p className="text-slate-400">Monitor ingestion queue, SLA metrics, and background workers.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <select
                        title="Project Filter"
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-emerald-500"
                    >
                        <option value="all">🌍 All Projects</option>
                        {projects.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>

                    <select
                        title="Status Filter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-emerald-500 capitalize"
                    >
                        <option value="all">All Statuses</option>
                        <option value="queued">Queued</option>
                        <option value="processing">Processing</option>
                        <option value="pending_approval">Pending Approval</option>
                        <option value="completed">Completed</option>
                        <option value="approved">Approved</option>
                        <option value="failed">Failed</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {/* Quick KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                    <div className="text-slate-400 text-sm font-medium mb-1">Pending QA/QC Approvals</div>
                    <div className="text-3xl font-bold text-amber-500">{jobs.filter(j => j.status === 'pending_approval').length}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                    <div className="text-slate-400 text-sm font-medium mb-1">Failed Ingestions</div>
                    <div className="text-3xl font-bold text-rose-500">{jobs.filter(j => j.status === 'failed').length}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                    <div className="text-slate-400 text-sm font-medium mb-1">Success Classification Runs</div>
                    <div className="text-3xl font-bold text-emerald-500">{runs.filter(r => r.status === 'success').length}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                    <div className="text-slate-400 text-sm font-medium mb-1">Average SLA Time</div>
                    <div className="text-3xl font-bold text-sky-500">
                        {runs.filter(r => r.duration_seconds).length > 0
                            ? `${Math.round(runs.reduce((sum, r) => sum + (r.duration_seconds || 0), 0) / runs.filter(r => r.duration_seconds).length)}s`
                            : 'N/A'
                        }
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-slate-900/50 p-1 border border-slate-800 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab("ingestion")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "ingestion" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-slate-800/50"}`}
                >
                    <Database className="w-4 h-4 inline-block mr-2" />
                    Ingestion Queue (QA/QC)
                </button>
                <button
                    onClick={() => setActiveTab("classification")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "classification" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-slate-800/50"}`}
                >
                    <SlidersHorizontal className="w-4 h-4 inline-block mr-2" />
                    Classification Subsystems
                </button>
            </div>

            {/* Main Content Pane */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                {activeTab === "ingestion" && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 border-b border-slate-800">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Job Reference</th>
                                    <th className="px-6 py-4 font-medium">Type</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium">Submitted</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {filteredJobs.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No jobs match your filters.</td></tr>
                                ) : (
                                    filteredJobs.map(job => (
                                        <tr key={job.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-white break-all max-w-xs">{job.filename}</div>
                                                <div className="text-xs text-slate-500 font-mono mt-1">ID: {job.id.slice(0, 8)}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 capitalize">{job.job_type.replace('_', ' ')}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusStyle(job.status)}`}>
                                                    {job.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                                                {format(new Date(job.created_at), "yyyy-MM-dd HH:mm:ss")}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {(job.status === 'pending_approval' || job.status === 'queued' || job.status === 'completed') && (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleJobAction(job.id, "approved")}
                                                            className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded hover:bg-emerald-500/20"
                                                            title="Approve & Publish"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleJobAction(job.id, "rejected")}
                                                            className="p-1.5 bg-rose-500/10 text-rose-500 rounded hover:bg-rose-500/20"
                                                            title="Reject Data"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                                {job.validation_errors && job.validation_errors.length > 0 && (
                                                    <span className="text-xs text-rose-400 flex items-center justify-end gap-1 mt-2">
                                                        <ShieldAlert className="w-3 h-3" /> {job.validation_errors.length} err
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === "classification" && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 border-b border-slate-800">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Run ID</th>
                                    <th className="px-6 py-4 font-medium">Type</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium text-right">Metrics (Tiles / Alerts)</th>
                                    <th className="px-6 py-4 font-medium text-right">Start Time</th>
                                    <th className="px-6 py-4 font-medium text-right">Duration</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {filteredRuns.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No scheduled runs have executed yet.</td></tr>
                                ) : (
                                    filteredRuns.map(run => (
                                        <tr key={run.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4 font-mono text-xs text-slate-400">
                                                {run.id.slice(0, 8)}
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 capitalize">
                                                {run.run_type.replace('_', ' ')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusStyle(run.status)}`}>
                                                    {run.status}
                                                </span>
                                                {run.error_message && (
                                                    <p className="text-xs text-rose-400 mt-1 max-w-xs truncate" title={run.error_message}>{run.error_message}</p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-3 text-xs">
                                                    <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{run.tiles_processed} tiles</span>
                                                    <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">{run.alerts_generated} alerts</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-xs text-slate-400">
                                                <div className="flex justify-end gap-1 items-center">
                                                    <Clock className="w-3 h-3 text-slate-500" />
                                                    {format(new Date(run.started_at), "MMM d HH:mm:ss")}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right text-slate-400 font-mono text-xs">
                                                {run.duration_seconds !== null ? `${run.duration_seconds}s` : '...'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
