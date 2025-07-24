import { useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import {
  calculateTaskPriorityForForm,
  PriorityCalculationResult,
} from "./priorityCalculation";
import { TaskSchema } from "./schema";

interface UsePriorityCalculationProps {
  form: UseFormReturn<TaskSchema>;
}

interface UsePriorityCalculationReturn {
  calculationResult: PriorityCalculationResult | null;
  isCalculating: boolean;
  calculationError: string | null;
}

export function usePriorityCalculation({
  form,
}: UsePriorityCalculationProps): UsePriorityCalculationReturn {
  const [calculationResult, setCalculationResult] =
    useState<PriorityCalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  // Watch for changes in contact_id and type (activity type)
  const contactId = form.watch("contact_id");
  const activityType = form.watch("type");

  useEffect(() => {
    // Only calculate if both contact and activity type are selected
    if (!contactId || !activityType) {
      setCalculationResult(null);
      setCalculationError(null);
      return;
    }

    let isCancelled = false;

    async function calculatePriority() {
      setIsCalculating(true);
      setCalculationError(null);

      try {
        const result = await calculateTaskPriorityForForm(
          contactId,
          activityType
        );

        if (!isCancelled) {
          setCalculationResult(result);

          // Automatically update the priority field in the form
          form.setValue("priority", result.priorityLevel, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
          });
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Priority calculation error:", error);
          setCalculationError("Failed to calculate priority");
          setCalculationResult(null);
        }
      } finally {
        if (!isCancelled) {
          setIsCalculating(false);
        }
      }
    }

    calculatePriority();

    return () => {
      isCancelled = true;
    };
  }, [contactId, activityType, form]);

  return {
    calculationResult,
    isCalculating,
    calculationError,
  };
}
