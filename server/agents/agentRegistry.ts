import { db } from '../db/database.js';
import type { AgentDefinition, AgentStatus } from '../../shared/types.js';

export class AgentRegistry {
  static getAllAgents(): AgentDefinition[] {
    const rows = db.prepare(`SELECT * FROM agents ORDER BY name ASC`).all() as any[];
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      role: r.role,
      description: r.description,
      avatarIcon: r.avatar_icon,
      capabilities: JSON.parse(r.capabilities || '[]'),
      allowedTools: JSON.parse(r.allowed_tools || '[]'),
      dataAccessScopes: JSON.parse(r.data_access_scopes || '[]'),
      executionLimits: JSON.parse(r.execution_limits || '{}'),
      status: r.status as AgentStatus,
      modelConfig: JSON.parse(r.model_config || '{}'),
      healthScore: r.health_score,
      consecutiveFailures: r.consecutive_failures,
      lastActiveAt: r.last_active_at,
    }));
  }

  static getAgent(id: string): AgentDefinition | undefined {
    const r = db.prepare(`SELECT * FROM agents WHERE id = ?`).get(id) as any;
    if (!r) return undefined;
    return {
      id: r.id,
      name: r.name,
      role: r.role,
      description: r.description,
      avatarIcon: r.avatar_icon,
      capabilities: JSON.parse(r.capabilities || '[]'),
      allowedTools: JSON.parse(r.allowed_tools || '[]'),
      dataAccessScopes: JSON.parse(r.data_access_scopes || '[]'),
      executionLimits: JSON.parse(r.execution_limits || '{}'),
      status: r.status as AgentStatus,
      modelConfig: JSON.parse(r.model_config || '{}'),
      healthScore: r.health_score,
      consecutiveFailures: r.consecutive_failures,
      lastActiveAt: r.last_active_at,
    };
  }

  static updateAgentStatus(id: string, status: AgentStatus): AgentDefinition {
    db.prepare(`UPDATE agents SET status = ?, last_active_at = ? WHERE id = ?`)
      .run(status, new Date().toISOString(), id);
    const updated = this.getAgent(id);
    if (!updated) throw new Error(`Agent ${id} not found.`);
    return updated;
  }

  static recordAgentSuccess(id: string) {
    db.prepare(`
      UPDATE agents 
      SET consecutive_failures = 0, 
          health_score = MIN(100, health_score + 2), 
          last_active_at = ?
      WHERE id = ?
    `).run(new Date().toISOString(), id);
  }

  static recordAgentFailure(id: string) {
    db.prepare(`
      UPDATE agents 
      SET consecutive_failures = consecutive_failures + 1, 
          health_score = MAX(20, health_score - 15), 
          last_active_at = ?
      WHERE id = ?
    `).run(new Date().toISOString(), id);
  }
}
