import { createClient } from "@/utils/supabase/server";
import {
    HeartHandshake,
    FileText,
    Users,
    AlertCircle,
    CheckCircle2,
    MessageSquare,
    Download
} from "lucide-react";
import { format } from "date-fns";
import GrievanceModal from "./GrievanceModal";
import DocumentUploadModal from "./DocumentUploadModal";

export const dynamic = "force-dynamic";

export default async function SafeguardsDashboardPage() {
    const supabase = await createClient();

    // Fetch Grievances
    const { data: grievances } = await supabase
        .from("grievances")
        .select("*")
        .order("date_reported", { ascending: false });

    // Fetch Safeguard Documents
    const { data: documents } = await supabase
        .from("safeguard_documents")
        .select("*")
        .order("created_at", { ascending: false });

    // KPIs
    const openGrievances = grievances?.filter(g => g.status === 'Open' || g.status === 'Under Investigation').length || 0;
    const verifiedDocs = documents?.filter(d => d.verification_status === 'Verified').length || 0;

    // Unique Communities Engaged
    const communities = new Set();
    grievances?.forEach(g => communities.add(g.community_name));
    documents?.forEach(d => communities.add(d.community_name));
    const uniqueCommunities = communities.size;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                        <HeartHandshake className="w-8 h-8 text-indigo-400" />
                        Safeguards & Social
                    </h1>
                    <p className="text-gray-400 mt-1">
                        Track Free Prior Informed Consent (FPIC), compliance documents, and community grievances.
                    </p>
                </div>
                <div className="flex items-center gap-3 mt-4 sm:mt-0">
                    <DocumentUploadModal />
                    <GrievanceModal />
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-400">Open Grievances</p>
                            <h3 className="text-2xl font-bold text-white mt-1">
                                {openGrievances}
                            </h3>
                        </div>
                        <div className="p-2 bg-rose-500/10 rounded-lg">
                            <AlertCircle className={`w-5 h-5 ${openGrievances > 0 ? 'text-rose-400' : 'text-slate-400'}`} />
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-400">Verified Documents</p>
                            <h3 className="text-2xl font-bold text-white mt-1">
                                {verifiedDocs}
                            </h3>
                        </div>
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <FileText className="w-5 h-5 text-indigo-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-400">Communities Engaged</p>
                            <h3 className="text-2xl font-bold text-white mt-1">
                                {uniqueCommunities}
                            </h3>
                        </div>
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <Users className="w-5 h-5 text-emerald-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Document Repository */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-sm flex flex-col">
                    <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800/80">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-indigo-400" />
                            Document Repository
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-300 uppercase bg-slate-900/50">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Community Context</th>
                                    <th className="px-6 py-4 font-semibold">Type</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">File</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {(!documents || documents.length === 0) ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-slate-400 bg-slate-800/50">
                                            No compliance documents uploaded yet.
                                        </td>
                                    </tr>
                                ) : (
                                    documents.map((doc) => (
                                        <tr key={doc.id} className="hover:bg-slate-700/30 transition-colors">
                                            <td className="px-6 py-4 text-white">
                                                <div className="font-medium">{doc.community_name}</div>
                                                <div className="text-xs text-slate-400 mt-1">{format(new Date(doc.created_at), 'MMM d, yyyy')}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-300">
                                                {doc.document_type}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${doc.verification_status === 'Verified' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                                    doc.verification_status === 'Rejected' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                                                        "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                                    }`}>
                                                    {doc.verification_status === 'Verified' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                                    {doc.verification_status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <a
                                                    href={doc.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center justify-center p-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-indigo-600 hover:text-white transition-colors"
                                                    title={`Download ${doc.file_url}`}
                                                >
                                                    <Download className="w-4 h-4" />
                                                </a>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Grievance Ticketing System */}
                <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-sm flex flex-col">
                    <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800/80">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-rose-400" />
                            Grievance Inbox
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-300 uppercase bg-slate-900/50">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Date & Source</th>
                                    <th className="px-6 py-4 font-semibold">Category</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {(!grievances || grievances.length === 0) ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-8 text-center text-slate-400 bg-slate-800/50">
                                            No grievance tickets logged. Good job!
                                        </td>
                                    </tr>
                                ) : (
                                    grievances.map((ticket) => (
                                        <tr key={ticket.id} className="hover:bg-slate-700/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-white font-medium">{ticket.community_name}</div>
                                                <div className="text-xs text-slate-400 mt-1">{format(new Date(ticket.date_reported), 'MMM d, yyyy')}</div>
                                                <div className="text-xs text-slate-500 mt-0.5 line-clamp-1 max-w-[200px]" title={ticket.description}>
                                                    {ticket.description}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2 py-1 rounded bg-slate-700 text-slate-300 text-xs">
                                                    {ticket.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${ticket.status === 'Open' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                                                    ticket.status === 'Resolved' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                                        "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                                    }`}>
                                                    {ticket.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
