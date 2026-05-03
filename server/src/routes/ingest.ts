import { Router, Request, Response } from 'express';
import { supabase } from '../supabase';
import { computeIdempotencyKey } from '../lib/idempotency';
import { normalizeEvent } from '../lib/normalize';
import type { IngestRequest, IngestResponse } from '../types';

export const ingestRouter = Router();

// Small helper to simulate random delays or failures based on user input
const simulateFailure = async (type: string | undefined | null) => {
  if (!type) return;
  if (type === 'timeout') {
    await new Promise(resolve => setTimeout(resolve, 3000));
    throw new Error('SIMULATED_TIMEOUT: The database request timed out.');
  }
  if (type === 'db_error') {
    throw new Error('SIMULATED_DB_ERROR: Connection to Postgres was lost during transaction.');
  }
  if (type === 'validation') {
    throw new Error('SIMULATED_VALIDATION_ERROR: The payload failed strict schema validation.');
  }
};

ingestRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { source, payload, simulate_failure } = req.body as IngestRequest;

    if (!source || !payload || typeof payload !== 'object') {
      return res.status(400).json({
        success: false,
        status: 'failed',
        message: 'Invalid request: "source" and "payload" object are required',
      });
    }

    // 1. Compute Idempotency Key
    // This is purely based on the source and the contents of the payload.
    const idempotencyKey = computeIdempotencyKey(source, payload);

    // 2. Safe Write to raw_events (ON CONFLICT DO NOTHING)
    // This prevents double-processing if the client retries a request that already succeeded.
    const { data: rawEvent, error: insertError } = await supabase
      .from('raw_events')
      .upsert(
        {
          idempotency_key: idempotencyKey,
          source: source,
          raw_payload: payload,
          status: 'pending',
        },
        { onConflict: 'idempotency_key', ignoreDuplicates: true }
      )
      .select()
      .maybeSingle();

    // If ignoreDuplicates hit, the upsert returns null data (no rows affected).
    // Let's query it to see if it actually exists.
    if (!rawEvent && !insertError) {
      // It was a duplicate! Safe idempotent return.
      const { data: existing } = await supabase
        .from('raw_events')
        .select('id')
        .eq('idempotency_key', idempotencyKey)
        .single();
        
      return res.status(200).json({
        success: true,
        status: 'duplicate',
        message: 'Event already processed (idempotent skip)',
        idempotency_key: idempotencyKey,
        event_id: existing?.id,
      } as IngestResponse);
    }

    if (insertError || !rawEvent) {
      console.error('Raw insert error:', insertError);
      return res.status(500).json({
        success: false,
        status: 'failed',
        message: 'Database error during raw event ingestion',
      });
    }

    const rawEventId = rawEvent.id;

    // ─── 3. Process the Event (Normalization + Simulation) ───
    try {
      // Simulate failure if requested (will throw)
      await simulateFailure(simulate_failure);

      // Normalize
      const normResult = normalizeEvent(source, payload);
      if (!normResult.ok) {
        throw new Error(normResult.error);
      }

      // Insert normalized event
      const { error: normInsertError } = await supabase
        .from('normalized_events')
        .insert({
          raw_event_id: rawEventId,
          client_id: normResult.data.client_id,
          metric: normResult.data.metric,
          amount: normResult.data.amount,
          timestamp: normResult.data.timestamp,
          normalized_payload: normResult.data,
        });

      if (normInsertError) throw normInsertError;

      // Mark raw event as processed
      await supabase
        .from('raw_events')
        .update({ status: 'processed' })
        .eq('id', rawEventId);

      return res.status(201).json({
        success: true,
        status: 'created',
        message: 'Event processed successfully',
        event_id: rawEventId,
        idempotency_key: idempotencyKey,
        corrections: normResult.corrections,
      } as IngestResponse);

    } catch (processError: unknown) {
      // ─── 4. Handle Partial/Process Failure ───
      const errorMessage = processError instanceof Error ? processError.message : String(processError);
      
      // Log failure to failed_events
      await supabase.from('failed_events').insert({
        raw_event_id: rawEventId,
        error_message: errorMessage,
      });

      // Mark raw event as failed
      await supabase
        .from('raw_events')
        .update({ status: 'failed' })
        .eq('id', rawEventId);

      return res.status(422).json({
        success: false,
        status: 'failed',
        message: errorMessage,
        event_id: rawEventId,
      } as IngestResponse);
    }

  } catch (err: unknown) {
    console.error('Fatal ingest error:', err);
    res.status(500).json({ success: false, status: 'failed', message: 'Internal Server Error' });
  }
});
