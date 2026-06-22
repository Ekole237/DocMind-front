import { Confidentiality } from './confidentiality';

export const CONFIDENTIALITY_ROLE_REQUIRED: Record<Confidentiality, number> = {
  [Confidentiality.PUBLIC]:       0,
  [Confidentiality.INTERNAL]:     0,
  [Confidentiality.CONFIDENTIAL]: 1,
  [Confidentiality.RESTRICTED]:   1,
};
