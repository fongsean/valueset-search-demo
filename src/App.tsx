import { useState } from 'react'
import { isCanonicalValueSetUrl } from "./utils/isCanonicalValueSetUrl.ts";
import { BaseRenderer, buildForm } from "@aehrc/smart-forms-renderer";
import { createQuestionnaire } from "./utils/createQuestionnaire.ts";
import { useDebounce } from "use-debounce";
import { useQuery } from "@tanstack/react-query";
import type { OperationOutcome } from "fhir/r4";

function App() {
  const [terminologyServerUrl, setTerminologyServerUrl] = useState("https://r4.ontoserver.csiro.au/fhir");
  const [valueSetUrl, setValueSetUrl] = useState('http://hl7.org/fhir/ValueSet/observation-status');
  const [debouncedValueSetUrl] = useDebounce(valueSetUrl, 200);
  
  const inputIsValid = isCanonicalValueSetUrl(valueSetUrl)

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

  // Create questionnaire definition
  const questionnaire = createQuestionnaire(valueSetUrl, itemControl, terminologyServerUrl);


  return (
    <>
      <h1>ValueSet Search Demo</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <label>
          Terminology server URL:{' '}
          <input type="text" value={terminologyServerUrl}
                 onChange={(event) => setTerminologyServerUrl(event.target.value)}
                 style={{ minWidth: '400px' }}/>
        </label>
        <label>
          ValueSet URL:{' '}
          <input type="text" value={valueSetUrl} onChange={(event) => {
            setValueSetUrl(event.target.value)
          }}
                 style={{ minWidth: '400px' }}/>
        </label>
        <div style={{ display: 'flex' }}>
          <button disabled={!valueSetUrlIsValid}
                  style={{ cursor: valueSetUrlIsValid ? 'pointer' : 'not-allowed', marginRight: '8px' }}
                  onClick={async () => {
                    await buildForm(questionnaire)
                  }}>
            Show ValueSet search field
          </button>
          {!inputIsValid ? (<div>⚠️ Input URL is not a valid canonical ValueSet URL</div>) : null}
          {valueSetUrlIsValid === true ? (<div>✅ Canonical ValueSet URL valid</div>) : null}
          {valueSetUrlIsValid === false ? (<div>🛑 Canonical ValueSet URL invalid or HTTP error</div>) : null}
        </div>

      </div>

      <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px' }}>
        <BaseRenderer/>
      </div>
    </>
  )
}

export default App
