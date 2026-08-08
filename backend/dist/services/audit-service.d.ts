import { DecisionResult, DecisionOutcome } from '@humanapi/shared';
export declare function logDecision(decision: {
    request_id: string;
    decision: DecisionOutcome;
    confidence: number;
    reason: string;
    matched_policies: string[];
    matched_preferences: string[];
    requires_user_action: boolean;
}): Promise<DecisionResult>;
export declare function logOverride(override: {
    decision_id: string;
    user_id: string;
    original_decision: DecisionOutcome;
    override_decision: DecisionOutcome;
    reason?: string;
    remember_preference: boolean;
}): Promise<void>;
export declare function getDecisionByRequestId(requestId: string): Promise<DecisionResult | null>;
export declare function getUserDecisions(userId: string, limit?: number): Promise<any[]>;
