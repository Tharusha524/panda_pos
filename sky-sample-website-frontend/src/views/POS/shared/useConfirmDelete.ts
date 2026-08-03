import { useCallback, useState } from "react";
import {
  CLOSED_DELETE_DIALOG,
  type PosConfirmDeleteState,
} from "./PosConfirmDeleteDialog";

export interface ConfirmDeleteRequest {
  title?: string;
  message: string;
  onConfirm: () => void;
}

export function useConfirmDelete() {
  const [dialog, setDialog] = useState<PosConfirmDeleteState>(CLOSED_DELETE_DIALOG);
  const [onConfirm, setOnConfirm] = useState<(() => void) | null>(null);
  const requestDelete = useCallback((request: ConfirmDeleteRequest) => {
    setOnConfirm(() => request.onConfirm);
    setDialog({
      open: true,
      title: request.title ?? "Confirm delete",
      message: request.message,
    });
  }, []);

  const close = useCallback(() => {
    setDialog(CLOSED_DELETE_DIALOG);
    setOnConfirm(null);
  }, []);

  const confirm = useCallback(() => {
    if (!onConfirm) return;
    const fn = onConfirm;
    setDialog(CLOSED_DELETE_DIALOG);
    setOnConfirm(null);
    fn();
  }, [onConfirm]);

  return {
    dialog,
    requestDelete,
    close,
    confirm,
  };
}
