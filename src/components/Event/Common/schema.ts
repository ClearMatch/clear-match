import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

export const eventSchema = z.object({
  contact_id: z.string().min(1, "Contact is required"),
  organization_id: z.string().optional(),
  type: z.string().default("none"),
});

export type EventSchema = z.infer<typeof eventSchema>;

export function useEventForm() {
  const form = useForm<EventSchema>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      contact_id: "",
      organization_id: "",
      type: "none",
    },
  });

  return form;
}
