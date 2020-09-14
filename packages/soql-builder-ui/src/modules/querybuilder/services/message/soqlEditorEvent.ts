import { ToolingModelJson } from '../toolingModelService';

export enum MessageType {
  UI_ACTIVATED = 'ui_activated',
  UI_SOQL_CHANGED = 'ui_soql_changed',
  SOBJECT_METADATA_REQUEST = 'sobject_metadata_request',
  SOBJECT_METADATA_RESPONSE = 'sobject_metadata_response',
  SOBJECTS_REQUEST = 'sobjects_request',
  SOBJECTS_RESPONSE = 'sobjects_response',
  TEXT_SOQL_CHANGED = 'text_soql_changed'
}

export interface SoqlEditorEvent {
  type: MessageType;
  payload?: string | string[] | ToolingModelJson;
}
