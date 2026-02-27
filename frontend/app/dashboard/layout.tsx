import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DashboardSidebar from "./_componenets/dashboard-sidebar";
import { Separator } from "@/components/ui/separator";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <SidebarProvider>
            <DashboardSidebar/>
            <main className="w-full p-2">
                <SidebarTrigger/>
                <Separator className="my-2"/>
                {children}
            </main>
        </SidebarProvider>
    );
}