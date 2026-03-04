import { login, signup } from "./actions";

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message: string }>;
}) {
    const params = await searchParams;

    return (
        <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto mt-20 md:mt-32">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-white">
                    Blue Carbon MRV
                </h1>
                <p className="text-emerald-400 mt-2">Secure access for verification.</p>
            </div>

            <form className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-slate-300">
                <label className="text-md" htmlFor="email">
                    Email
                </label>
                <input
                    className="rounded-md px-4 py-2 bg-slate-800 border mb-6 border-slate-700 bg-inherit text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    name="email"
                    placeholder="officer@crema.org"
                    required
                />
                <label className="text-md" htmlFor="password">
                    Password
                </label>
                <input
                    className="rounded-md px-4 py-2 bg-slate-800 border mb-6 border-slate-700 bg-inherit text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    required
                />
                <button
                    formAction={login}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-md px-4 py-2 text-foreground mb-2 shadow-md transition-colors"
                >
                    Sign In
                </button>
                <button
                    formAction={signup}
                    className="border border-slate-600 hover:bg-slate-700 text-slate-300 rounded-md px-4 py-2 text-foreground mb-2 transition-colors"
                >
                    Request Access
                </button>
                {params?.message && (
                    <p className="mt-4 p-4 bg-red-900/50 text-red-300 text-center rounded">
                        {params.message}
                    </p>
                )}
            </form>
        </div>
    );
}
