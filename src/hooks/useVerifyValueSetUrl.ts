import { useQuery } from "@tanstack/react-query";
import type { OperationOutcome, ValueSet } from "fhir/r4";

export function useVerifyValueSetUrl(debouncedValueSetUrl: string, terminologyServerUrl: string, inputIsValid: boolean): {
  valueSet: ValueSet | null;
  valueSetUrlIsValid: boolean | null;
  itemControl: "drop-down" | "autocomplete";
} {
  let valueSet = null
  const { data: responseData } = useQuery({
    queryKey: ['verifyValueSetUrl', debouncedValueSetUrl],
    queryFn: async () => {
      if (!debouncedValueSetUrl) {
        return Promise.resolve(false);
      }

      return await fetch(`${terminologyServerUrl}/ValueSet/$expand?url=${encodeURIComponent(debouncedValueSetUrl)}`)
        .then(async (response) => {
          if (!response.ok) {
            const operationOutcome = await response.json();
            if (operationOutcome?.resourceType === 'OperationOutcome') {
              return operationOutcome as OperationOutcome;
            }

            throw Error(
              `HTTP error when performing ${debouncedValueSetUrl}. Status: ${response.status}`
            );
          }

          return await response.json();
        })
        .catch(() => {
          console.error("Error fetching ValueSet URL:", debouncedValueSetUrl);
        });
    },
    enabled: inputIsValid
  })

  let valueSetUrlIsValid: boolean | null = null;
  if (responseData && responseData.resourceType === 'ValueSet') {
    valueSetUrlIsValid = true;

    // Set valueSet var to the fetched ValueSet
    valueSet = responseData;
  }

  if (responseData && responseData.resourceType === 'OperationOutcome') {
    valueSetUrlIsValid = false;
  }

  // If valueSet expansion more than 150000 items, change itemControl to "autocomplete"
  let itemControl: "drop-down" | "autocomplete" = "drop-down";
  if (responseData && responseData.resourceType === 'OperationOutcome') {
    const tooCostlyIssue = (responseData as OperationOutcome).issue.find(issue => issue.severity === 'error' && issue.code === 'too-costly');
    if (tooCostlyIssue) {
      itemControl = "autocomplete";
      valueSetUrlIsValid = true;
    }
  }

  return { valueSet, valueSetUrlIsValid, itemControl }
}
