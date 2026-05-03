import { Router, Request, Response } from 'express';
import { supabase } from '../supabase';
import type { AggregationResult } from '../types';

export const aggregateRouter = Router();

aggregateRouter.get('/', async (req: Request, res: Response) => {
  try {
    // Basic aggregation counts using fast counts
    const [{ count: totalEvents }, { count: processedEvents }, { count: failedEvents }] = await Promise.all([
      supabase.from('raw_events').select('*', { count: 'exact', head: true }),
      supabase.from('raw_events').select('*', { count: 'exact', head: true }).eq('status', 'processed'),
      supabase.from('raw_events').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
    ]);

    // For duplications, we assume total - processed - failed. Wait, actually we don't store 
    // duplicate status individually (it's ignored by UPSERT). A true system would have a counter,
    // but here we can't easily query duplicates since they aren't inserted. 
    // We'll leave duplicate count as 0 for this simplified demo or compute if we tracked them.
    const duplicateEvents = 0;

    // Fetch normalized events to do manual aggregation (fine for 60-min demo, 
    // but in production this should be a Postgres Materialized View or View).
    const { data: normData, error } = await supabase
      .from('normalized_events')
      .select('client_id, metric, amount');

    if (error) throw error;

    let totalAmount = 0;
    const clientMap: Record<string, { count: number; total_amount: number }> = {};
    const metricMap: Record<string, { count: number; total_amount: number }> = {};

    for (const ev of normData || []) {
      const amt = ev.amount || 0;
      totalAmount += amt;

      if (!clientMap[ev.client_id]) clientMap[ev.client_id] = { count: 0, total_amount: 0 };
      clientMap[ev.client_id].count++;
      clientMap[ev.client_id].total_amount += amt;

      if (!metricMap[ev.metric]) metricMap[ev.metric] = { count: 0, total_amount: 0 };
      metricMap[ev.metric].count++;
      metricMap[ev.metric].total_amount += amt;
    }

    const by_client = Object.entries(clientMap)
      .map(([client_id, stats]) => ({ client_id, ...stats }))
      .sort((a, b) => b.total_amount - a.total_amount);

    const by_metric = Object.entries(metricMap)
      .map(([metric, stats]) => ({ metric, ...stats }))
      .sort((a, b) => b.count - a.count);

    const unique_sources = Object.keys(clientMap).length;

    const result: AggregationResult = {
      total_events: totalEvents || 0,
      processed_events: processedEvents || 0,
      failed_events: failedEvents || 0,
      duplicate_events: duplicateEvents,
      unique_sources,
      total_amount: totalAmount,
      by_metric,
      by_client,
    };

    return res.json(result);

  } catch (err) {
    console.error('Aggregate GET error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch aggregation data' });
  }
});
