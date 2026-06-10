import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createOrder,
  getOrder,
  getOrders,
  type OrdersParams,
} from "@/lib/api";

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: () => getOrder(id),
    enabled: !!id,
  });
}

export function useOrders(params?: OrdersParams) {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: () => getOrders(params),
  });
}
