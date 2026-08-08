import { ClaudeDecisionOutput, DecisionRequestBody, ExtractedPreference, OnboardingMessage, Preference, Policy } from '@humanapi/shared';
export declare function makeDecision(request: DecisionRequestBody, preferences: Preference[], policies: Policy[]): Promise<ClaudeDecisionOutput>;
export declare function extractPreferences(messages: OnboardingMessage[]): Promise<ExtractedPreference[]>;
export declare function onboardingChat(messages: OnboardingMessage[]): Promise<{
    reply: string;
    is_complete: boolean;
}>;
