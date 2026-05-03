import { Router, Request, Response } from 'express';
import { supabase } from '../supabase';

export const eventsRouter = Router();

eventsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const status = (req.query.status as string) || 'all';
    const limit = parseInt(req.query.limit as string) || 50;

    if (status === 'processed') {
      // Return normalized events, joined with some raw info
      const { data, error } = await supabase
        .from('normalized_events')
        .select(`
          id, raw_event_id, client_id, metric, amount, timestamp, normalized_at, normalized_payload,
          raw_events!inner(source, received_at, raw_payload)
        `)
        .order('normalized_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      const mapped = data.map((d: any) => ({
        ...d,
        source: Array.isArray(d.raw_events) ? d.raw_events[0]?.source : d.raw_events?.source,
        raw_payload: Array.isArray(d.raw_events) ? d.raw_events[0]?.raw_payload : d.raw_events?.raw_payload,
      }));
      return res.json(mapped);
    }
    
    if (status === 'failed') {
      // Return failed events, joined with raw info
      const { data, error } = await supabase
        .from('failed_events')
        .select(`
          id, raw_event_id, error_message, failed_at,
          raw_events!inner(source, raw_payload)
        `)
        .order('failed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      // Flatten the response slightly for the frontend
      const mapped = data.map((d: any) => ({
        id: d.id,
        raw_event_id: d.raw_event_id,
        error_message: d.error_message,
        failed_at: d.failed_at,
        source: Array.isArray(d.raw_events) ? d.raw_events[0]?.source : d.raw_events?.source,
        raw_payload: Array.isArray(d.raw_events) ? d.raw_events[0]?.raw_payload : d.raw_events?.raw_payload,
      }));
      return res.json(mapped);
    }

    // Default: raw_events
    const { data, error } = await supabase
      .from('raw_events')
      .select('*')
      .order('received_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return res.json(data);

  } catch (err) {
    console.error('Events GET error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch events' });
  }
});
