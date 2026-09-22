import Sidebar from "./Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex bg-black min-h-screen font-sans text-zinc-100 antialiased selection:bg-indigo-500 selection:text-white">
            <Sidebar />

            <main className="flex-1 p-8 md:p-12 overflow-y-auto max-h-screen">
                <div className="max-w-5xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}