export interface Message {
  to: string;
  template: string;
  subject: string;
  templateVariables: any;
}
