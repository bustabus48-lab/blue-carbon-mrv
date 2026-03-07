"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, AlertCircle, Database, Settings, Map as MapIcon, Leaf, LogOut, TreePine, Users, Microscope, Calculator, ShieldAlert, HeartHandshake, ShieldCheck, DownloadCloud, MapPin, Activity } from "lucide-react";

export function Sidebar({ userRole = 'crema_agent' }: { userRole?: string }) {
    const pathname = usePathname();

    const navItems = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Projects Setup", href: "/projects/new", icon: MapPin },
        { name: "Maps & Polygons", href: "/maps", icon: MapIcon },
        { name: "Alerts", href: "/alerts", icon: AlertCircle },
        { name: "Plots", href: "/plots", icon: TreePine },
        { name: "Soil Lab", href: "/soil", icon: Microscope },
        { name: "Carbon Accounting", href: "/accounting", icon: Calculator },
        { name: "Leakage & Buffer", href: "/leakage", icon: ShieldAlert },
        { name: "Safeguards", href: "/safeguards", icon: HeartHandshake },
        { name: "Compliance", href: "/compliance", icon: ShieldCheck },
        { name: "Registry & Exports", href: "/registry", icon: DownloadCloud },
        { name: "Database", href: "/database", icon: Database },
        ...(userRole === 'admin' ? [{ name: "Users", href: "/users", icon: Users }] : []),
        { name: "Settings", href: "/settings", icon: Settings },
        { name: "Operations & QA", href: "/operations", icon: Activity },
    ];

    return (
        <div className="flex h-screen w-64 flex-col bg-slate-900 border-r border-slate-800">
            <div className="flex h-16 items-center px-6 border-b border-slate-800 shrink-0">
                <Leaf className="w-6 h-6 text-emerald-500 mr-3" />
                <span className="text-lg font-bold text-slate-100 tracking-tight">Blue Carbon</span>
            </div>

            <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/");
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                                }`}
                        >
                            <item.icon className={`w-5 h-5 ${isActive ? "text-emerald-400" : "text-slate-500"}`} />
                            {item.name}
                        </Link>
                    );
                })}
            </div>

            <div className="p-4 border-t border-slate-800">
                <a href="/api/auth/logout" className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer block">
                    <LogOut className="w-5 h-5 text-slate-500 group-hover:text-rose-400 shrink-0 inline-block mr-1" />
                    Sign out
                </a>
            </div>
        </div>
    );
}
