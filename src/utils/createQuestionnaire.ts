import type { Questionnaire } from "fhir/r4";

export function createQuestionnaire(
  valueSetUrl: string,
  itemControl: "drop-down" | "autocomplete",
  terminologyServerUrl: string
): Questionnaire {
  return {
    resourceType: "Questionnaire",
    id: "valueset-questionnaire",
    status: "active",
    name: "ValueSetChoiceQuestionnaire",
    title: "Questionnaire with ValueSet-based Choices",
    date: "2025-06-13",
    publisher: "Example Publisher",
    extension: [
      {
        url: "http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-preferredTerminologyServer",
        valueUrl: terminologyServerUrl
      }
    ],
    item: [
      {
        extension: [
          {
            url: "http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl",
            valueCodeableConcept: {
              coding: [{
                system: "http://hl7.org/fhir/questionnaire-item-control",
                version: "1.0.0",
                code: itemControl
              }]
            }
          }
        ],
        linkId: "valueset-search",
        text: valueSetUrl,
        type: itemControl === "autocomplete" ? "open-choice" : "choice",
        answerValueSet: valueSetUrl
      }
    ]
  }
}
