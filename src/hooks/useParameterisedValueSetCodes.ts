import { useQuery } from '@tanstack/react-query';
import type { CodeSystem, ValueSet } from 'fhir/r4';
import { transformUrlWithVersion } from '../utils/transformUrlWithVersion.ts';

export function useParameterisedValueSetCodes(
  valueSet: ValueSet | null,
  terminologyServerUrl: string
): { parameterisedValueSetCodeName: string | null; parameterisedValueSetCodes: string[] } {
  // Get ValueSet "used-codesystem" URL
  let codeSystemUrl: string | null = null;
  let parameterCodeName: string | null = null;
  if (valueSet) {
    // This demo only looks at the first "valueset-parameter" extension
    const valueSetParameter = valueSet.extension?.find(
      (ext) =>
        ext.url === 'http://hl7.org/fhir/tools/StructureDefinition/valueset-parameter' &&
        ext.extension &&
        ext.extension.length > 0
    );
    if (valueSetParameter) {
      const parameterValueCode = valueSetParameter.extension?.find(
        (ext) => ext.url === 'name' && ext.valueCode !== ''
      )?.valueCode;
      if (
        parameterValueCode &&
        valueSet.expansion &&
        valueSet.expansion.parameter &&
        valueSet.expansion.parameter.length > 0
      ) {
        // Find the used-codesystem parameter
        const usedCodeSystemUrl = valueSet.expansion.parameter.find(
          (param) => param.name === 'used-codesystem' && param.valueUri !== ''
        )?.valueUri;
        if (usedCodeSystemUrl) {
          codeSystemUrl = usedCodeSystemUrl;
          parameterCodeName = parameterValueCode.replace(/^p-/, '');
        }
      }
    }
  }

  // Get CodeSystem resource from ValueSet "used-codesystem" URL
  const { data: responseData } = useQuery({
    queryKey: ['getValueSetCodeSystem', codeSystemUrl],
    queryFn: async () => {
      if (!codeSystemUrl) {
        return Promise.resolve(false);
      }

      const searchResult = await fetch(
        `${terminologyServerUrl}/CodeSystem/?url=${transformUrlWithVersion(codeSystemUrl)}`
      );

      if (!searchResult.ok) {
        throw Error(`Search failed for ${codeSystemUrl}. Status: ${searchResult.status}`);
      }

      const bundle = await searchResult.json();

      const codeSystem = bundle?.entry?.[0]?.resource;
      const codeSystemId = codeSystem?.id;
      if (!codeSystemId) {
        throw new Error('CodeSystem not found in Bundle');
      }

      // Step 2: Fetch full CodeSystem resource by ID
      const fullRes = await fetch(`${terminologyServerUrl}/CodeSystem/${codeSystemId}`);
      if (!fullRes.ok) {
        throw Error(`Fetching full CodeSystem failed: ${fullRes.status}`);
      }

      return await fullRes.json();
    },
    enabled: !!codeSystemUrl
  });

  // Do not proceed without all necessary data
  if (!responseData || codeSystemUrl === null || parameterCodeName === null) {
    return { parameterisedValueSetCodeName: null, parameterisedValueSetCodes: [] };
  }

  // Get parameter codes from CodeSystem resource
  let parameterCodes: string[] = [];
  if (responseData.resourceType === 'CodeSystem') {
    const codeSystem = responseData as CodeSystem;
    if (codeSystem.concept) {
      // Get all codes that matches the parameterCodeName
      const parameterCodesWithDuplicates = codeSystem.concept
        ?.map((concept) => {
          return concept.property?.find((prop) => prop.code === parameterCodeName)?.valueCode;
        })
        .filter((code) => code !== undefined);

      // Remove duplicates
      parameterCodes = [...new Set(parameterCodesWithDuplicates)];
    }
  }

  return {
    parameterisedValueSetCodeName: parameterCodeName,
    parameterisedValueSetCodes: parameterCodes
  };
}
