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
  hideLikes?: boolean
  disableComments?: boolean
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
  hideLikes,
  disableComments,
  onAboutThisAccount,
}: Props) {
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)
  return (
    <>
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
                    setShowDeleteConfirm(true)
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
                  {hideLikes ? 'Show like counts to others' : 'Hide like counts to others'}
                </button>

                <button
                  onClick={() => {
                    onTurnOffCommenting?.()
                    onOpenChange(false)
                  }}
                  className="w-full text-center py-3 border-b border-border"
                >
                  {disableComments ? 'Turn on commenting' : 'Turn off commenting'}
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

    {/* Delete confirmation rendered outside the options dialog so it isn't unmounted when options close */}
    <Dialog open={showDeleteConfirm} onOpenChange={(v) => setShowDeleteConfirm(v)}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 bg-black/50 z-[70]" />
        <DialogPrimitive.Content className="fixed z-[80] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] rounded-xl bg-background border border-border p-6 text-center">
          <VisuallyHidden.Root asChild>
            <DialogTitle>Delete post</DialogTitle>
          </VisuallyHidden.Root>
          <h3 className="text-lg font-semibold text-foreground mb-2">Delete post?</h3>

          <DialogPrimitive.Description asChild>
            <p className="text-sm text-muted-foreground mb-6">Are you sure you want to delete this post?</p>
          </DialogPrimitive.Description>

          <div className="flex flex-col">
            <button
              className="text-red-500 font-semibold py-3 border-t border-border"
              onClick={() => {
                setShowDeleteConfirm(false)
                try { onDelete?.() } catch {}
              }}
            >
              Delete
            </button>

            <button
              className="py-3 border-t border-border "
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
    </>
  )
}

export default PostOptionsDialog
