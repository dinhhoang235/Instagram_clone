"use client"

import { useRouter } from "next/navigation"
import React, { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/components/auth-provider"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"
import {
    ChevronLeft,
    Sun,
    Globe,
    ShieldCheck,
    UserCheck,
    Settings as SettingsIcon,
    QrCode,
    HelpCircle,
    AlertCircle,
    MoreHorizontal,
    LogOut,
    Home,
    Search,
    Film,
    Send,
    User,
} from "lucide-react"

export default function AccountSettingsPage() {
    const router = useRouter()
    const { logout } = useAuth()

    const [confirmOpen, setConfirmOpen] = useState(false)

    const handleLogout = () => {
        // Open confirmation dialog on mobile
        setConfirmOpen(true)
    }

    const confirmLogout = () => {
        logout()
        setConfirmOpen(false)
        router.push("/login")
    }

    type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement> & { className?: string }>

    const sectionItem = (Icon: IconComponent, label: string, onClick?: () => void) => (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-4 px-4 py-4 bg-white hover:bg-slate-50"
        >
            <Icon className="w-5 h-5 text-muted-foreground" />
            <span className="flex-1 text-left text-foreground">{label}</span>
            <span className="text-muted-foreground">›</span>
        </button>
    )

    return (
        <div className="min-h-screen bg-white text-foreground">
            <div className="flex">
                <Sidebar />
                <main className="flex-1 lg:ml-64">
                    {/* Fixed header (mobile only) */}
                    <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-border lg:hidden">
                        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center">
                            <button
                                onClick={() => router.back()}
                                className="w-8 h-8 rounded-full flex items-center justify-center bg-white hover:bg-slate-50"
                                aria-label="Back"
                            >
                                <ChevronLeft className="w-5 h-5 text-foreground" />
                            </button>
                            <h1 className="flex-1 text-center font-semibold text-foreground">Settings and privacy</h1>
                            <div className="w-8" />
                        </div>
                    </div>

                    {/* Content (offset for fixed header on mobile) */}
                    <div className="pt-16 lg:pt-8 pb-24">
                        <div className="max-w-4xl mx-auto px-4">
                            <section className="rounded-md overflow-hidden bg-white divide-y divide-border shadow-sm">
                                {sectionItem(User, "Edit profile", () => router.push('/account/edit'))}
                                {sectionItem(Sun, "Switch appearance", () => router.push('/account/switch_appearance'))}
                                {sectionItem(Globe, "Language", () => { })}
                                {sectionItem(SettingsIcon, "Website permissions", () => { })}
                            </section>

                            <section className="mt-4 rounded-md overflow-hidden bg-white divide-y divide-border shadow-sm">
                                <div className="px-4 py-2 text-muted-foreground text-xs">Family Center</div>
                                {sectionItem(ShieldCheck, "Supervision for Teen Accounts", () => { })}
                            </section>

                            <section className="mt-4 rounded-md overflow-hidden bg-white divide-y divide-border shadow-sm">
                                <div className="px-4 py-2 text-muted-foreground text-xs">For professionals</div>
                                {sectionItem(UserCheck, "Account type and tools", () => { })}
                                {sectionItem(ShieldCheck, "Meta Verified", () => { })}
                            </section>

                            <section className="mt-4 rounded-md overflow-hidden bg-white divide-y divide-border shadow-sm">
                                <div className="px-4 py-2 text-slate-400 text-xs">More info and support</div>
                                {sectionItem(QrCode, "QR code", () => { })}
                                {sectionItem(HelpCircle, "Help", () => { })}
                                {sectionItem(AlertCircle, "Account Status", () => { })}
                                {sectionItem(AlertCircle, "Report a problem", () => { })}
                                {sectionItem(MoreHorizontal, "More", () => { })}
                            </section>

                            <div className="mt-4">
                                <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-red-400 flex items-center gap-3">
                                    <LogOut className="w-5 h-5 text-red-400" />
                                    <span>Log Out</span>
                                </button>
                            </div>

                            <Dialog open={confirmOpen} onOpenChange={(isOpen) => setConfirmOpen(isOpen)}>
                                <DialogContent className="bg-transparent">
                                    <VisuallyHidden.Root asChild>
                                        <DialogTitle>Log out?</DialogTitle>
                                    </VisuallyHidden.Root>
                                    <VisuallyHidden.Root asChild>
                                        <DialogDescription>Are you sure you want to log out of your account?</DialogDescription>
                                    </VisuallyHidden.Root>

                                    <div className="flex items-center justify-center min-h-full p-4 lg:hidden" onClick={() => setConfirmOpen(false)}>
                                        <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xs bg-white text-foreground rounded-md overflow-hidden shadow-lg">
                                            <div className="px-4 py-4 text-center font-semibold">Log out?</div>
                                            <div className="px-4 pb-4 text-center text-sm text-muted-foreground">Are you sure you want to log out of your account?</div>
                                            <div className="border-t border-border">
                                                <button onClick={confirmLogout} className="w-full py-3 text-blue-600 font-medium">Log out</button>
                                            </div>
                                            <div className="border-t border-border">
                                                <button onClick={() => setConfirmOpen(false)} className="w-full py-3 text-foreground">Cancel</button>
                                            </div>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    {/* Bottom navigation (mobile only) */}
                    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border py-2 lg:hidden">
                        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
                            <button className="flex-1 text-center">
                                <Home className="w-6 h-6 text-muted-foreground mx-auto" />
                            </button>
                            <button className="flex-1 text-center">
                                <Search className="w-6 h-6 text-muted-foreground mx-auto" />
                            </button>
                            <button className="flex-1 text-center">
                                <Film className="w-6 h-6 text-muted-foreground mx-auto" />
                            </button>
                            <button className="flex-1 text-center">
                                <Send className="w-6 h-6 text-muted-foreground mx-auto" />
                            </button>
                            <button className="flex-1 text-center">
                                <User className="w-6 h-6 text-muted-foreground mx-auto rounded-full" />
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
