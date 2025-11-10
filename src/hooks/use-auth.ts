import { useContext } from "react";

import { AuthActionsContext, AuthStateContext } from "@/contexts/auth-context.shared";

export const useAuth = () => {
  const context = useContext(AuthStateContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

export const useAuthActions = () => {
  const context = useContext(AuthActionsContext);

  if (!context) {
    throw new Error("useAuthActions must be used within an AuthProvider");
  }

  return context;
};
