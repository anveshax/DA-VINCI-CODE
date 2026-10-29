import crypto from 'node:crypto';
import { db } from '../db/database.js';
import type { FlightRecorderEvent } from '../../shared/types.js';

export class FlightRecorderService {
  /**
   * Standardized hash computation for block integrity
   */
  static computeHash(params: {
    sequenceNumber: number;
    timestamp: string;
    correlationId: string;
    eventType: string;
    agentId?: string | null;
    payloadJson: string;
    previousHash: string;
  }): string {
    return crypto.createHash('sha256')
      .update(`${params.sequenceNumber}|${params.timestamp}|${params.correlationId}|${params.eventType}|${params.agentId ?? 'NONE'}|${params.payloadJson}|${params.previousHash}`)
      .digest('hex');
  }

  /**
   * Append an audit event to the append-only log with SHA-256 hash chaining
   */
  static logEvent(params: {
    correlationId: string;
    eventType: FlightRecorderEvent['eventType'];
    agentId?: string;
    taskId?: string;
    subTaskId?: string;
    payload: Record<string, any>;
  }): FlightRecorderEvent {
    // Get the most recent event to obtain its hash
    const lastEventRow = db.prepare(`
      SELECT sequence_number, hash 
      FROM flight_recorder_events 
      ORDER BY sequence_number DESC 
      LIMIT 1
    `).get() as { sequence_number: number; hash: string } | undefined;

    const sequenceNumber = (lastEventRow?.sequence_number ?? 0) + 1;
    const previousHash = lastEventRow?.hash ?? '0000000000000000000000000000000000000000000000000000000000000000';
    const timestamp = new Date().toISOString();
    const id = `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const payloadJson = JSON.stringify(params.payload);

    const hash = this.computeHash({
      sequenceNumber,
      timestamp,
      correlationId: params.correlationId,
      eventType: params.eventType,
      agentId: params.agentId,
      payloadJson,
      previousHash,
    });

    db.prepare(`
      INSERT INTO flight_recorder_events (
        id, correlation_id, timestamp, event_type, agent_id, task_id, subtask_id,
        payload_json, previous_hash, hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      params.correlationId,
      timestamp,
      params.eventType,
      params.agentId ?? null,
      params.taskId ?? null,
      params.subTaskId ?? null,
      payloadJson,
      previousHash,
      hash
    );

    return {
      sequenceNumber,
      id,
      correlationId: params.correlationId,
      timestamp,
      eventType: params.eventType,
      agentId: params.agentId,
      taskId: params.taskId,
      subTaskId: params.subTaskId,
      payload: params.payload,
      previousHash,
      hash,
    };
  }

  /**
   * Query events with filters
   */
  static getEvents(filters?: {
    correlationId?: string;
    taskId?: string;
    agentId?: string;
    eventType?: string;
    limit?: number;
  }): FlightRecorderEvent[] {
    let query = 'SELECT * FROM flight_recorder_events WHERE 1=1';
    const params: any[] = [];

    if (filters?.correlationId) {
      query += ' AND correlation_id = ?';
      params.push(filters.correlationId);
    }
    if (filters?.taskId) {
      query += ' AND task_id = ?';
      params.push(filters.taskId);
    }
    if (filters?.agentId) {
      query += ' AND agent_id = ?';
      params.push(filters.agentId);
    }
    if (filters?.eventType) {
      query += ' AND event_type = ?';
      params.push(filters.eventType);
    }

    query += ' ORDER BY sequence_number DESC';
    if (filters?.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    } else {
      query += ' LIMIT 100';
    }

    const rows = db.prepare(query).all(...params) as any[];
    return rows.map(r => ({
      sequenceNumber: r.sequence_number,
      id: r.id,
      correlationId: r.correlation_id,
      timestamp: r.timestamp,
      eventType: r.event_type,
      agentId: r.agent_id,
      taskId: r.task_id,
      subTaskId: r.subtask_id,
      payload: JSON.parse(r.payload_json || '{}'),
      previousHash: r.previous_hash,
      hash: r.hash,
    }));
  }

  /**
   * Verify the cryptographic hash chain integrity across all events
   */
  static verifyIntegrity(): {
    isValid: boolean;
    totalEventsVerified: number;
    brokenEventSequence?: number;
    error?: string;
  } {
    const rows = db.prepare(`
      SELECT sequence_number, id, correlation_id, timestamp, event_type, agent_id,
             payload_json, previous_hash, hash
      FROM flight_recorder_events
      ORDER BY sequence_number ASC
    `).all() as any[];

    if (rows.length === 0) {
      return { isValid: true, totalEventsVerified: 0 };
    }

    let expectedPrevHash = '0000000000000000000000000000000000000000000000000000000000000000';

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (i > 0 && row.previous_hash !== expectedPrevHash) {
        return {
          isValid: false,
          totalEventsVerified: i,
          brokenEventSequence: row.sequence_number,
          error: `Broken chain link at sequence ${row.sequence_number}: expected previous hash ${expectedPrevHash}, got ${row.previous_hash}`,
        };
      }

      const computedHash = this.computeHash({
        sequenceNumber: row.sequence_number,
        timestamp: row.timestamp,
        correlationId: row.correlation_id,
        eventType: row.event_type,
        agentId: row.agent_id,
        payloadJson: row.payload_json,
        previousHash: row.previous_hash,
      });

      if (computedHash !== row.hash) {
        return {
          isValid: false,
          totalEventsVerified: i,
          brokenEventSequence: row.sequence_number,
          error: `Cryptographic payload mismatch at sequence ${row.sequence_number}: computed ${computedHash} !== stored ${row.hash}`,
        };
      }

      expectedPrevHash = row.hash;
    }

    return {
      isValid: true,
      totalEventsVerified: rows.length,
    };
  }
}
