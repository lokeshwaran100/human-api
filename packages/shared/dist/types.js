"use strict";
// ============================================================
// HumanAPI — Shared Types
// Central type definitions used by both frontend and backend
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecisionRequestStatus = exports.AgentStatus = exports.SuggestionStatus = exports.PolicyAction = exports.DecisionOutcome = exports.PreferenceImportance = exports.PreferenceStatus = exports.PreferenceSource = void 0;
// --- Enums ---
var PreferenceSource;
(function (PreferenceSource) {
    PreferenceSource["USER_EXPLICIT"] = "USER_EXPLICIT";
    PreferenceSource["USER_CORRECTION"] = "USER_CORRECTION";
    PreferenceSource["AI_INFERRED"] = "AI_INFERRED";
    PreferenceSource["IMPORTED"] = "IMPORTED";
})(PreferenceSource || (exports.PreferenceSource = PreferenceSource = {}));
var PreferenceStatus;
(function (PreferenceStatus) {
    PreferenceStatus["PROPOSED"] = "PROPOSED";
    PreferenceStatus["ACTIVE"] = "ACTIVE";
    PreferenceStatus["ARCHIVED"] = "ARCHIVED";
    PreferenceStatus["REJECTED"] = "REJECTED";
})(PreferenceStatus || (exports.PreferenceStatus = PreferenceStatus = {}));
var PreferenceImportance;
(function (PreferenceImportance) {
    PreferenceImportance["LOW"] = "LOW";
    PreferenceImportance["MEDIUM"] = "MEDIUM";
    PreferenceImportance["HIGH"] = "HIGH";
    PreferenceImportance["CRITICAL"] = "CRITICAL";
})(PreferenceImportance || (exports.PreferenceImportance = PreferenceImportance = {}));
var DecisionOutcome;
(function (DecisionOutcome) {
    DecisionOutcome["APPROVE"] = "APPROVE";
    DecisionOutcome["REJECT"] = "REJECT";
    DecisionOutcome["ASK_USER"] = "ASK_USER";
})(DecisionOutcome || (exports.DecisionOutcome = DecisionOutcome = {}));
var PolicyAction;
(function (PolicyAction) {
    PolicyAction["AUTO_APPROVE"] = "AUTO_APPROVE";
    PolicyAction["ASK_USER"] = "ASK_USER";
    PolicyAction["REJECT"] = "REJECT";
})(PolicyAction || (exports.PolicyAction = PolicyAction = {}));
var SuggestionStatus;
(function (SuggestionStatus) {
    SuggestionStatus["PENDING"] = "PENDING";
    SuggestionStatus["ACCEPTED"] = "ACCEPTED";
    SuggestionStatus["IGNORED"] = "IGNORED";
})(SuggestionStatus || (exports.SuggestionStatus = SuggestionStatus = {}));
var AgentStatus;
(function (AgentStatus) {
    AgentStatus["ACTIVE"] = "ACTIVE";
    AgentStatus["INACTIVE"] = "INACTIVE";
    AgentStatus["REVOKED"] = "REVOKED";
})(AgentStatus || (exports.AgentStatus = AgentStatus = {}));
var DecisionRequestStatus;
(function (DecisionRequestStatus) {
    DecisionRequestStatus["PENDING"] = "PENDING";
    DecisionRequestStatus["COMPLETED"] = "COMPLETED";
    DecisionRequestStatus["AWAITING_USER"] = "AWAITING_USER";
    DecisionRequestStatus["EXPIRED"] = "EXPIRED";
})(DecisionRequestStatus || (exports.DecisionRequestStatus = DecisionRequestStatus = {}));
