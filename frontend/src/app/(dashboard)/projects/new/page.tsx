import React from "react";
import ProjectWizard from "@/components/ProjectWizard";

export const dynamic = "force-dynamic";

export default function NewProjectPage() {
    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Project Ingestion Wizard</h1>
                <p className="text-slate-400">Onboard a new coastal restoration or conservation district into the Blue Carbon MRV system.</p>
            </div>

            <ProjectWizard />
        </div>
    );
}
