import { DefaultOptions, QueryClient } from "@tanstack/react-query";

const defaultOptions: DefaultOptions = {
  queries: {
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 1,
    networkMode: "online",
  },
  mutations: {
    networkMode: "offlineFirst",
  },
};

const queryClient = new QueryClient({ defaultOptions });

export default queryClient;
