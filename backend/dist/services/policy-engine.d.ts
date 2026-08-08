import { Policy, DecisionOutcome } from '@humanapi/shared';
export interface PolicyEvalResult {
    decision: DecisionOutcome | null;
    matched_policies: string[];
}
export declare function evaluatePolicies(userId: string, category: string, payload: Record<string, any>): Promise<PolicyEvalResult>;
export declare function getUserPolicies(userId: string, category?: string): Promise<Policy[]>;
export declare function createPolicy(policy: Omit<Policy, 'id' | 'created_at' | 'updated_at'>): Promise<Policy>;
export declare function updatePolicy(id: string, updates: Partial<Pick<Policy, 'name' | 'conditions' | 'action' | 'priority' | 'enabled'>>): Promise<Policy>;
export declare function deletePolicy(id: string): Promise<void>;
