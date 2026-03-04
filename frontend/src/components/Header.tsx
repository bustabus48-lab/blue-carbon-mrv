"use client";

import { Bell, Search, User, LogOut } from "lucide-react";

export function Header() {
    return (
        <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm px-6 sticky top-0 z-10">
            <div className="flex items-center w-96 pl-2">
                <Search className="w-4 h-4 text-slate-500 absolute ml-3" />
                <input
                    type="text"
                    placeholder="Search plots, alerts, districts..."
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-full pl-10 pr-4 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-600"
                />
            </div>

            <div className="flex items-center gap-4">
                <button title="Notifications" className="relative p-2 text-slate-400 hover:text-slate-100 transition-colors rounded-full hover:bg-slate-800">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-slate-900"></span>
                </button>

                <div className="group relative">
                    <div className="h-8 w-8 rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center cursor-pointer hover:border-slate-500 transition-colors pointer-events-auto">
                        <User className="w-4 h-4 text-slate-400" />
                    </div>
                    {/* Simple dropdown for logout */}
                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-slate-800 border border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                        <a href="/api/auth/logout" className="w-full text-left px-4 py-2 flex items-center gap-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors rounded-md cursor-pointer block">
                            <LogOut className="w-4 h-4 shrink-0 inline-block mr-1" />
                            Sign out
                        </a>
                    </div>
                </div>
            </div>
        </header>
    );
}
