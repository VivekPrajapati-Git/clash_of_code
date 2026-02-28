import { SidebarHeader, SidebarContent, SidebarGroup, SidebarFooter, Sidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar'
import { HeartPlus, HeartPulse, HomeIcon, LocateFixedIcon, LogsIcon, NotepadText, ToolCaseIcon, User, UsersIcon } from 'lucide-react'

const navs = [
    {
        label: "Home",
        link: "",
        icon: HomeIcon
    },
    {
        label: "Staff",
        link: "staff",
        icon: UsersIcon
    },
    {
        label: "Doctor",
        link: "doctor",
        icon: HeartPulse
    },
    {
        label: "Equipment",
        link: "equipment",
        icon: ToolCaseIcon
    },
    {
        label: "Building",
        link: "building",
        icon: LocateFixedIcon
    },
    {
        label: "Logs",
        link: "logs",
        icon: LogsIcon
    },
    {
        label: "Interaction",
        link: "interaction",
        icon: LogsIcon
    }
]

const DashboardSidebar = () => {
    return (
        <Sidebar>
            <SidebarHeader >
                <h1 className='text-2xl text-pretty font-bold flex items-center'>Health
                    <span className='text-primary'>Care</span>
                    <HeartPlus className='size-6 text-red-600'></HeartPlus>
                </h1>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {navs.map((nav) => (
                        <SidebarMenuItem key={nav.link}>
                            <SidebarMenuButton asChild>
                                <a href={"/dashboard/" + nav.link}>
                                    {nav.icon && <nav.icon />}
                                    <span>{nav.label}</span>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
                <SidebarGroup />
                <SidebarGroup />
            </SidebarContent>
            <SidebarFooter />
        </Sidebar>
    )
}

export default DashboardSidebar
