// src/components/ui/use-toast.ts
import * as React from "react";
import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

/* -----------------------------------------------------------
   CONFIG
----------------------------------------------------------- */
const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 4000;

/* -----------------------------------------------------------
   TYPES
----------------------------------------------------------- */
export type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

/* -----------------------------------------------------------
   REDUCER ACTION TYPES
----------------------------------------------------------- */
const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

type ActionType = typeof actionTypes;

type Action =
  | { type: ActionType["ADD_TOAST"]; toast: ToasterToast }
  | { type: ActionType["UPDATE_TOAST"]; toast: Partial<ToasterToast> }
  | { type: ActionType["DISMISS_TOAST"]; toastId?: string }
  | { type: ActionType["REMOVE_TOAST"]; toastId?: string };

interface State {
  toasts: ToasterToast[];
}

/* -----------------------------------------------------------
   INTERNAL STATE MANAGEMENT
----------------------------------------------------------- */
let memoryState: State = { toasts: [] };
let listeners: Array<(state: State) => void> = [];

/* ID generator */
let idCounter = 0;
function genId() {
  idCounter = (idCounter + 1) % Number.MAX_SAFE_INTEGER;
  return idCounter.toString();
}

/* Toast removal queue */
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleRemoval(toastId: string) {
  if (toastTimeouts.has(toastId)) return;

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({ type: "REMOVE_TOAST", toastId });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
}

/* -----------------------------------------------------------
   REDUCER
----------------------------------------------------------- */
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case "DISMISS_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) => {
          if (t.id === action.toastId || action.toastId === undefined) {
            scheduleRemoval(t.id);
            return { ...t, open: false };
          }
          return t;
        }),
      };

    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };

    default:
      return state;
  }
}

/* -----------------------------------------------------------
   DISPATCH
----------------------------------------------------------- */
function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((l) => l(memoryState));
}

/* -----------------------------------------------------------
   PUBLIC toast() FUNCTION
----------------------------------------------------------- */
export function toast(props: Omit<ToasterToast, "id">) {
  const id = genId();

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dispatch({ type: "DISMISS_TOAST", toastId: id });
      },
    },
  });

  return {
    id,
    dismiss: () => dispatch({ type: "DISMISS_TOAST", toastId: id }),
    update: (toastProps: ToasterToast) =>
      dispatch({
        type: "UPDATE_TOAST",
        toast: { ...toastProps, id },
      }),
  };
}

/* -----------------------------------------------------------
   useToast HOOK — STRICT MODE SAFE
----------------------------------------------------------- */
export function useToast() {
  const [state, setState] = React.useState(memoryState);

  // ❗ StrictMode SAFE: listener sadece 1 kez eklenir (dependencies = [])
  React.useEffect(() => {
    listeners.push(setState);

    return () => {
      const idx = listeners.indexOf(setState);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }, []); // ← ASLA dependency eklenmez!!!

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) =>
      dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}
