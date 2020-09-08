import { ToolingModelJson } from '../toolingModelService';

export enum MessageType {
  ACTIVATED = 'activated',
  QUERY = 'query',
  SOBJECT_METADATA_REQUEST = 'sobject_metadata_request',
  SOBJECT_METADATA_RESPONSE = 'sobject_metadata_response',
  SOBJECTS_REQUEST = 'sobjects_request',
  SOBJECTS_RESPONSE = 'sobjects_response',
  UPDATE = 'update'
}

export interface SoqlEditorEvent {
  type: MessageType;
  message?: string | string[] | ToolingModelJson;
}
