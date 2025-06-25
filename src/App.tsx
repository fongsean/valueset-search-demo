import { useState } from 'react';
import { isCanonicalValueSetUrl } from './utils/isCanonicalValueSetUrl.ts';
import { BaseRenderer, buildForm } from '@aehrc/smart-forms-renderer';
import { createQuestionnaire } from './utils/createQuestionnaire.ts';
import { useDebounce } from 'use-debounce';
import { useVerifyValueSetUrl } from './hooks/useVerifyValueSetUrl.ts';
import { useParameterisedValueSetCodes } from './hooks/useParameterisedValueSetCodes.ts';

function App() {
  const [terminologyServerUrl, setTerminologyServerUrl] = useState(
    'https://r4.ontoserver.csiro.au/fhir'
  );
  const [valueSetUrl, setValueSetUrl] = useState('http://hl7.org/fhir/ValueSet/observation-status');
  const [debouncedValueSetUrl] = useDebounce(valueSetUrl, 200);

  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

  const inputIsValid = isCanonicalValueSetUrl(valueSetUrl);

  const { valueSet, valueSetUrlIsValid, itemControl } = useVerifyValueSetUrl(
    debouncedValueSetUrl,
    terminologyServerUrl,
    inputIsValid
  );

  const { parameterisedValueSetCodeName, parameterisedValueSetCodes } =
    useParameterisedValueSetCodes(valueSet, terminologyServerUrl);

  // Create questionnaire definition
  const questionnaire = createQuestionnaire(
    valueSetUrl,
    itemControl,
    terminologyServerUrl,
    parameterisedValueSetCodeName,
    parameterisedValueSetCodes
  );

  return (
    <>
      <h1>ValueSet Search Demo</h1>

      <section style={{ marginBottom: '35px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Inputs</div>
        <div style={{ marginBottom: '10px' }}>
          <label>
            Terminology server URL:{' '}
            <input
              type="text"
              value={terminologyServerUrl}
              onChange={(event) => setTerminologyServerUrl(event.target.value)}
              style={{ minWidth: '400px' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>
            ValueSet URL:{' '}
            <input
              type="text"
              value={valueSetUrl}
              onChange={(event) => {
                setValueSetUrl(event.target.value);
              }}
              style={{ minWidth: '400px' }}
            />
          </label>
        </div>

        <div style={{ display: 'flex' }}>
          <button
            disabled={!valueSetUrlIsValid}
            style={{ cursor: valueSetUrlIsValid ? 'pointer' : 'not-allowed', marginRight: '8px' }}
            onClick={async () => {
              await buildForm(questionnaire);
            }}>
            Show ValueSet search field
          </button>
          {!inputIsValid ? <div>⚠️ Input URL is not a valid canonical ValueSet URL</div> : null}
          {valueSetUrlIsValid === true ? <div>✅ Canonical ValueSet URL valid</div> : null}
          {valueSetUrlIsValid === false ? (
            <div>🛑 Canonical ValueSet URL invalid or HTTP error</div>
          ) : null}
        </div>
      </section>

      <section style={{ marginBottom: '35px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Renderer</div>
        <div style={{ border: '1px solid #ccc', padding: '10px' }}>
          <BaseRenderer />
        </div>
      </section>

      <section style={{ marginBottom: '35px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Questionnaire definition</div>
        <div
          style={{
            border: '1px solid #ccc',
            padding: '8px'
          }}>
          <button
            style={{ cursor: 'pointer' }}
            onClick={() => setShowQuestionnaire(!showQuestionnaire)}>
            {showQuestionnaire ? 'Collapse ▲' : 'Show Questionnaire JSON ▼'}
          </button>
        </div>

        {showQuestionnaire ? (
          <pre
            style={{
              marginTop: '8px',
              background: '#f5f5f5',
              padding: '10px',
              overflowX: 'auto'
            }}>
            <code>
              <>{JSON.stringify(questionnaire, null, 2)}</>
            </code>
          </pre>
        ) : null}
      </section>

      <section>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>ValueSet URL suggestions:</div>
        <ol>
          {[
            'http://hl7.org/fhir/ValueSet/observation-status',
            'http://hl7.org/fhir/ValueSet/administrative-gender',
            'http://hl7.org/fhir/ValueSet/observation-codes (>150000 entries)',
            'http://example.com/limited-states/vs (Parameterised ValueSet)'
          ].map((url) => (
            <li
              key={url}
              style={{
                marginBottom: '8px'
              }}>
              {url}
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

export default App;
