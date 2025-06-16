import type { Questionnaire } from 'fhir/r4';

export function createQuestionnaire(
  valueSetUrl: string,
  itemControl: 'drop-down' | 'autocomplete',
  terminologyServerUrl: string,
  parameterisedValueSetCodeName: string | null,
  parameterisedValueSetCodes: string[]
): Questionnaire {
  // Parameterised ValueSet Search Questionnaire
  if (parameterisedValueSetCodes.length > 0 && parameterisedValueSetCodeName) {
    return {
      resourceType: 'Questionnaire',
      id: 'parameterised-valueset-search-demo-questionnaire',
      status: 'draft',
      name: 'ParameterisedValueSetSearchDemo',
      title: 'Parameterised ValueSet Search Demo Questionnaire',
      extension: [
        {
          url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-preferredTerminologyServer',
          valueUrl: terminologyServerUrl
        }
      ],
      item: [
        {
          extension: [
            {
              url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
              valueCodeableConcept: {
                coding: [
                  {
                    system: 'http://hl7.org/fhir/questionnaire-item-control',
                    code: 'radio-button',
                    display: 'Radio Button'
                  }
                ]
              }
            }
          ],
          linkId: 'parameterised-valueset-param-controller',
          text: `p-${parameterisedValueSetCodeName}`,
          type: itemControl === 'autocomplete' ? 'open-choice' : 'choice',
          answerOption: parameterisedValueSetCodes.map((code) => ({ valueString: code }))
        },
        {
          linkId: 'parameterised-valueset-search',
          text: valueSetUrl,
          type: 'choice',
          answerValueSet: valueSetUrl,
          _answerValueSet: {
            extension: [
              {
                url: 'http://hl7.org/fhir/tools/StructureDefinition/binding-parameter',
                extension: [
                  {
                    url: 'name',
                    valueString: `p-${parameterisedValueSetCodeName}`
                  },
                  {
                    url: 'expression',
                    valueExpression: {
                      language: 'text/fhirpath',
                      expression:
                        "%resource.item.where(linkId='parameterised-valueset-param-controller').answer.value"
                    }
                  }
                ]
              }
            ]
          }
        }
      ]
    };
  }

  // Simple Questionnaire
  return {
    resourceType: 'Questionnaire',
    id: 'valueset-search-demo-questionnaire',
    status: 'draft',
    name: 'ValueSetSearchDemo',
    title: 'ValueSet Search Demo Questionnaire',
    extension: [
      {
        url: 'http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-preferredTerminologyServer',
        valueUrl: terminologyServerUrl
      }
    ],
    item: [
      {
        extension: [
          {
            url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
            valueCodeableConcept: {
              coding: [
                {
                  system: 'http://hl7.org/fhir/questionnaire-item-control',
                  code: itemControl
                }
              ]
            }
          }
        ],
        linkId: 'valueset-search',
        text: valueSetUrl,
        type: itemControl === 'autocomplete' ? 'open-choice' : 'choice',
        answerValueSet: valueSetUrl
      }
    ]
  };
}
