"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Globe } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface ProjectOption {
    id: string;
    name: string;
    region: string;
}

interface ProjectFilterProps {
    selectedProjectId: string;
    onProjectChange: (projectId: string) => void;
    projects: ProjectOption[];
    showAllOption?: boolean;
    className?: string;
}

export function ProjectFilter({
    selectedProjectId,
    onProjectChange,
    projects,
    showAllOption = true,
    className = "",
}: ProjectFilterProps) {
    return (
        <div className={`relative ${className}`}>
            <select
                value={selectedProjectId}
                onChange={(e) => onProjectChange(e.target.value)}
                className="appearance-none bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 pr-10 text-white text-sm font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all w-full min-w-[220px]"
            >
                {showAllOption && (
                    <option value="all">🌍 All Projects</option>
                )}
                {projects.length === 0 && !showAllOption && (
                    <option value="">No projects found</option>
                )}
                {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                        📍 {p.name} — {p.region}
                    </option>
                ))}
            </select>
            <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-500 pointer-events-none" />
        </div>
    );
}

export function useProjects() {
    const [projects, setProjects] = useState<ProjectOption[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState("all");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/v1/projects/`)
            .then((res) => res.json())
            .then((data) => {
                setProjects(data);
                setLoading(false);
            });
    }, []);

    return { projects, selectedProjectId, setSelectedProjectId, loading };
}

export function useProjectSelection(defaultVal = "all") {
    const [selectedProjectId, setSelectedProjectId] = useState(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("bluecarbon_project_id");
            // Also checking if the user had it set to empty or something invalid
            return saved !== null ? saved : defaultVal;
        }
        return defaultVal;
    });

    useEffect(() => {
        if (selectedProjectId && typeof window !== "undefined") {
            localStorage.setItem("bluecarbon_project_id", selectedProjectId);
        }
    }, [selectedProjectId]);

    return [selectedProjectId, setSelectedProjectId] as const;
}
