import { ToolingModelJson } from '../toolingModelService';

export interface SoqlEditorEvent {
  type: string;
  message: string | ToolingModelJson;
}
