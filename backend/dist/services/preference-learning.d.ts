import { DecisionOutcome } from '@humanapi/shared';
export declare function processOverride(userId: string, requestId: string, originalDecision: DecisionOutcome, overrideDecision: DecisionOutcome, reason: string | undefined, rememberPreference: boolean): Promise<void>;
