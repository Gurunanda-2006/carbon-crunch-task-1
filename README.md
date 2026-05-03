# Fault-Tolerant Data Processing System

## Requirements Answers

### 1. Assumptions Made
- **No strict schema contract with clients**: I assumed clients send highly variable, unstructured JSON. The normalization layer uses defensive checks and field aliases (e.g., looking for `metric`, `type`, or `event_type`) to safely extract data.
- **Deduplication strategy**: "Duplicate" means the exact same source sending the exact same payload content. Different timestamps inside the payload yield different idempotency keys (meaning they are distinct events).
- **Non-fatal Normalization**: If normalization fails, the raw event is stored in `failed_events` rather than crashing the ingestion pipeline.
- **No authentication required**: As per the scope, no user auth is needed. The server bypasses RLS using the Supabase Service Role key.

### 2. Idempotency Strategy
- Every incoming event generates an **idempotency_key**.
- This key is computed using a **SHA-256 hash** of the `source` plus the *canonicalized* `payload` (where object keys are recursively sorted alphabetically to ensure the same data always hashes to the same string).
- The key is inserted into `raw_events` using `ON CONFLICT (idempotency_key) DO NOTHING`. This relies on Postgres's atomic unique constraints.
- If an insert affects 0 rows, it means the event is a duplicate. The API instantly returns a `200 OK` (idempotent skip) without re-running normalization or secondary inserts.

### 3. Scaling to 100,000 Events per Second
Handling 100k EPS requires moving away from synchronous HTTP/DB writes. 

- **Ingestion**: Replace the Express API with high-throughput API Gateways pushing directly to a distributed message queue (e.g., Apache Kafka or AWS Kinesis).
- **Deduplication (Idempotency)**: Moving idempotency checks out of Postgres and into an in-memory datastore like Redis cluster (using `SET NX` commands with a TTL) to ensure sub-millisecond duplicate rejection.
- **Processing**: Implement stateless worker pools (or serverless functions) consuming from Kafka, normalizing events in parallel, and writing in batches.
- **Database**: Postgres is not ideal for 100k EPS writes. I would transition to a specialized time-series or OLAP database (like ClickHouse or TimescaleDB) for storing `normalized_events`.
- **Aggregation**: Instead of querying raw data, compute running totals using streaming analytics (like Apache Flink) or materialized views in ClickHouse to serve sub-second aggregation queries.

## Getting Started

1. Create a Supabase project.
2. Run the `server/schema.sql` file in the Supabase SQL Editor.
3. Fill in `server/.env` with your Supabase URL and Service Role Key.
4. Open two terminals:
   - Terminal 1: `cd server && npm install && npm run dev`
   - Terminal 2: `cd frontend && npm install && npm run dev`
