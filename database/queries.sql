-- ═══════════════════════════════════════════════════
-- ScriptMD Analytics Queries
-- Run these in any PostgreSQL client
-- ═══════════════════════════════════════════════════

-- ── QUERY 1: Disease trends with rolling 3-month window ──
-- What it does: shows how many cases of each disease per month
-- AND a running 3-month total so you can see trends over time
-- Window function: SUM() OVER() calculates rolling total

SELECT
  symptoms,
  -- DATE_TRUNC rounds the date down to the month
  -- e.g. 2025-03-15 becomes 2025-03-01
  DATE_TRUNC('month', created_at) as month,
  
  -- COUNT how many prescriptions for this symptom this month
  COUNT(*) as monthly_cases,
  
  -- WINDOW FUNCTION: rolling 3-month total
  -- PARTITION BY symptoms = only look at rows with same symptom
  -- ORDER BY month = go in date order
  -- ROWS BETWEEN 2 PRECEDING AND CURRENT ROW = 
  --   add up current month + 2 months before it
  SUM(COUNT(*)) OVER (
    PARTITION BY symptoms
    ORDER BY DATE_TRUNC('month', created_at)
    ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
  ) as rolling_3month_total

FROM prescriptions
-- GROUP BY needed because we used COUNT(*)
GROUP BY symptoms, DATE_TRUNC('month', created_at)
ORDER BY monthly_cases DESC;


-- ── QUERY 2: Doctor performance using CTE ──
-- What it does: shows how many prescriptions each doctor wrote
-- and their average per working day
-- CTE: first calculates stats, then formats the output

-- Step 1: Create temporary table called "doctor_stats"
WITH doctor_stats AS (
  SELECT
    d.name as doctor_name,
    -- COUNT total prescriptions this doctor wrote
    COUNT(p.id) as total_prescriptions,
    -- COUNT DISTINCT = count unique patients (not same patient twice)
    COUNT(DISTINCT p.patient_id) as unique_patients,
    -- COUNT DISTINCT days worked (days they wrote at least one prescription)
    COUNT(DISTINCT DATE_TRUNC('day', p.created_at)) as days_worked
  FROM prescriptions p
  -- JOIN connects prescriptions table to doctors table
  -- p.doctor_id must match d.id
  JOIN doctors d ON p.doctor_id = d.id
  GROUP BY d.id, d.name
)

-- Step 2: Use the temporary table
SELECT
  doctor_name,
  total_prescriptions,
  unique_patients,
  days_worked,
  -- ROUND to 1 decimal place
  -- :: numeric = convert to decimal number
  -- NULLIF(days_worked, 0) = prevent divide by zero error
  ROUND(total_prescriptions::numeric / NULLIF(days_worked, 0), 1) as avg_per_day
FROM doctor_stats
ORDER BY total_prescriptions DESC;


-- ── QUERY 3: Patient visit frequency ──
-- What it does: shows which patients visit most often
-- and how long they have been a patient

SELECT
  pa.name as patient_name,
  -- COUNT how many prescriptions this patient has
  COUNT(p.id) as total_visits,
  -- Most recent prescription date
  MAX(p.created_at) as last_visit,
  -- First prescription date
  MIN(p.created_at) as first_visit,
  -- How many days between first and last visit
  EXTRACT(DAY FROM MAX(p.created_at) - MIN(p.created_at)) as days_as_patient,
  -- Most common medicine for this patient
  MODE() WITHIN GROUP (ORDER BY p.medicine) as most_prescribed_medicine

FROM prescriptions p
-- JOIN prescriptions to patients table
JOIN patients pa ON p.patient_id = pa.id
GROUP BY pa.id, pa.name
-- HAVING filters AFTER grouping (WHERE filters before)
-- Only show patients with more than 1 visit
HAVING COUNT(p.id) > 1
ORDER BY total_visits DESC
-- Show top 20 most frequent patients
LIMIT 20;


-- ── BONUS QUERY 4: Top medicines by condition ──
-- What it does: for each condition, what is the most prescribed medicine?

SELECT
  symptoms as condition,
  medicine,
  COUNT(*) as times_prescribed,
  -- RANK() assigns rank 1 to most prescribed within each condition
  RANK() OVER (
    PARTITION BY symptoms
    ORDER BY COUNT(*) DESC
  ) as rank_within_condition
FROM prescriptions
GROUP BY symptoms, medicine
-- Only show rank 1 = most prescribed per condition
HAVING RANK() OVER (PARTITION BY symptoms ORDER BY COUNT(*) DESC) = 1
ORDER BY times_prescribed DESC;