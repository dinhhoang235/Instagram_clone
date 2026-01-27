"use client"

import React from "react"
import { useRouter, usePathname } from "next/navigation"
import { ShieldCheck, UserCheck, QrCode, HelpCircle, AlertCircle, MoreHorizontal, User, Sun, Globe, Settings as SettingsIcon, Lock } from "lucide-react"

export default function AccountNav() {
  const router = useRouter()
  const pathname = usePathname() || ""

  type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement> & { className?: string }>

  const sectionItem = (Icon: IconComponent, label: string, to?: string) => {
    const isActive = to ? pathname.startsWith(to) : false
    return (
      <button
        key={label}
        onClick={() => to && router.push(to)}
        className={
          `w-full flex items-center gap-4 px-4 py-4 ${isActive ? "bg-muted" : "bg-card hover:bg-muted/50"}`
        }
      >
        <Icon className="w-5 h-5 text-muted-foreground" />
        <span className="flex-1 text-left text-foreground">{label}</span>
        <span className="text-muted-foreground">›</span>
      </button>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Settings</h2>

      <section className="rounded-md overflow-hidden bg-card divide-y divide-border shadow-sm">
        {sectionItem(User, "Edit profile", "/account/edit")}
        {sectionItem(ShieldCheck, "Privacy", "/account/privacy")}
        {sectionItem(Lock, "Security", "/account/security")}
        {sectionItem(Sun, "Switch appearance", "/account/switch_appearance")}
        {sectionItem(Globe, "Language")}
        {sectionItem(SettingsIcon, "Website permissions")}
      </section>

      <section className="mt-4 rounded-md overflow-hidden bg-card divide-y divide-border shadow-sm">
        <div className="px-4 py-2 text-muted-foreground text-xs">Family Center</div>
        {sectionItem(ShieldCheck, "Supervision for Teen Accounts")}
      </section>

      <section className="mt-4 rounded-md overflow-hidden bg-card divide-y divide-border shadow-sm">
        <div className="px-4 py-2 text-muted-foreground text-xs">For professionals</div>
        {sectionItem(UserCheck, "Account type and tools")}
        {sectionItem(ShieldCheck, "Meta Verified")}
      </section>

      <section className="mt-4 rounded-md overflow-hidden bg-card divide-y divide-border shadow-sm">
        <div className="px-4 py-2 text-muted-foreground text-xs">More info and support</div>
        {sectionItem(QrCode, "QR code")}
        {sectionItem(HelpCircle, "Help")}
        {sectionItem(AlertCircle, "Account Status")}
        {sectionItem(AlertCircle, "Report a problem")}
        {sectionItem(MoreHorizontal, "More")}
      </section>
    </div>
  )
}
