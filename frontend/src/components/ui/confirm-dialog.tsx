"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Emin misiniz?",
  description = "Bu işlem geri alınamaz. Silmek istediğinizden emin misiniz?",
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-zinc-900 border-zinc-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-zinc-100">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 border-none"
            onClick={onClose}
          >
            İptal
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-500 text-white hover:bg-red-600 focus:ring-red-500"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Sil
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
