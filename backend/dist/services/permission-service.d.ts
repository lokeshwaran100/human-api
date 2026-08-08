import { AgentPermission } from '@humanapi/shared';
export declare function checkPermission(agentId: string, decisionType: string): Promise<boolean>;
export declare function getAgentPermissions(agentId: string): Promise<AgentPermission[]>;
export declare function grantPermission(agentId: string, permission: string): Promise<AgentPermission>;
export declare function revokePermission(agentId: string, permission: string): Promise<void>;
