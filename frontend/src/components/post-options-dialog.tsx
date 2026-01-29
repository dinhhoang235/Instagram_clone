"use client"

import React from "react"
import { Dialog, DialogPortal, DialogOverlay, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  isOwner: boolean
  onDelete?: () => void
  onEdit?: () => void
  onReport?: () => void
  onUnfollow?: () => void
  onAddToFavorites?: () => void
  onShare?: () => void
  onCopyLink?: () => void
  onEmbed?: () => void
  onGoToPost?: () => void
  onToggleLikeCount?: () => void
  onTurnOffCommenting?: () => void
  onAboutThisAccount?: () => void
} 

export function PostOptionsDialog({
  open,
  onOpenChange,
  isOwner,
  onDelete,
  onEdit,
  onReport,
  onUnfollow,
  onAddToFavorites,
  onShare,
  onCopyLink,
  onEmbed,
  onGoToPost,
  onToggleLikeCount,
  onTurnOffCommenting,
  onAboutThisAccount,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 grid place-items-center p-4 sm:inset-auto sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%]"
        >
          <VisuallyHidden.Root asChild>
            <DialogTitle>Post options</DialogTitle>
          </VisuallyHidden.Root>
          <VisuallyHidden.Root asChild>
            <DialogDescription>Options and actions for this post</DialogDescription>
          </VisuallyHidden.Root>

          <div className="w-full max-w-[360px] bg-card text-foreground rounded-lg overflow-hidden h-auto max-h-[90vh] sm:w-[400px] sm:h-[439px]">
            {/* Owner actions */}
            {isOwner ? (
              <>
                <button
                  onClick={() => {
                    onDelete?.()
                    onOpenChange(false)
                  }}
                  className="w-full text-center py-3 border-b border-border text-red-500 font-semibold"
                >
                  Delete
                </button>

                <button
                  onClick={() => {
                    onEdit?.()
                    onOpenChange(false)
                  }}
                  className="w-full text-center py-3 border-b border-border"
                >
                  Edit
                </button>

                <button
                  onClick={() => {
                    onToggleLikeCount?.()
                    onOpenChange(false)
                  }}
                  className="w-full text-center py-3 border-b border-border"
                >
                  Hide like count to others
                </button>

                <button
                  onClick={() => {
                    onTurnOffCommenting?.()
                    onOpenChange(false)
                  }}
                  className="w-full text-center py-3 border-b border-border"
                >
                  Turn off commenting
                </button>

              </>
            ) : (
              // Not owner actions
              <>
                <button
                  onClick={() => {
                    onReport?.()
                    onOpenChange(false)
                  }}
                  className="w-full text-center py-3 border-b border-border text-red-500 font-semibold"
                >
                  Report
                </button>

                <button
                  onClick={() => {
                    onUnfollow?.()
                    onOpenChange(false)
                  }}
                  className="w-full text-center py-3 border-b border-border text-red-500"
                >
                  Unfollow
                </button>

                <button
                  onClick={() => {
                    onAddToFavorites?.()
                    onOpenChange(false)
                  }}
                  className="w-full text-center py-3 border-b border-border"
                >
                  Add to favorites
                </button>
              </>
            )}

            {/* Common actions */}
            <button
              onClick={() => {
                onGoToPost?.()
                onOpenChange(false)
              }}
              className="w-full text-center py-3 border-b border-border"
            >
              Go to post
            </button>

            <button
              onClick={() => {
                onShare?.()
                onOpenChange(false)
              }}
              className="w-full text-center py-3 border-b border-border"
            >
              Share to...
            </button>

            <button
              onClick={() => {
                onCopyLink?.()
                onOpenChange(false)
              }}
              className="w-full text-center py-3 border-b border-border"
            >
              Copy link
            </button>

            <button
              onClick={() => {
                onEmbed?.()
                onOpenChange(false)
              }}
              className="w-full text-center py-3 border-b border-border"
            >
              Embed
            </button>

            {!isOwner && (
              <button
                onClick={() => {
                  onAboutThisAccount?.()
                  onOpenChange(false)
                }}
                className="w-full text-center py-3 border-b border-border"
              >
                About this account
              </button>
            )}

            <button
              onClick={() => onOpenChange(false)}
              className="w-full text-center py-3 "
            >
              Cancel
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}

export default PostOptionsDialog
