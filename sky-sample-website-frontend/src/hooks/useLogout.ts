import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { signOut } from "../utils/authSession";

export default function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return async () => {
    await signOut(queryClient);
    navigate("/", { replace: true });
  };
}
