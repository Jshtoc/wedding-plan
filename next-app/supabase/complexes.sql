-- ════════════════════════════════════════════════════════════════
-- Wedding Plan — Housing Complexes (2026-04-12)
-- ════════════════════════════════════════════════════════════════
-- Depends on: nothing (standalone table)
-- Stores apartment complex comparison data based on the 월부
-- "내집마련보고서" spreadsheet. Each row is one 단지 (complex).
--
-- Idempotent & safe to re-run.

CREATE TABLE IF NOT EXISTS public.complexes (
  id               BIGSERIAL PRIMARY KEY,

  -- 단지정보 (basic info)
  name             TEXT NOT NULL,                -- 단지명
  city             TEXT DEFAULT '',              -- 시
  district         TEXT DEFAULT '',              -- 구
  dong             TEXT DEFAULT '',              -- 동
  year_units       TEXT DEFAULT '',              -- 연식 / 세대수 (e.g. "1993 / 598")
  area             TEXT DEFAULT '',              -- 공급/전용면적 (e.g. "97 / 78")
  sale_price       INT  DEFAULT 0,              -- 매매가 (호가), 만원
  jeonse_price     INT  DEFAULT 0,              -- 전세가, 만원
  peak_price       INT  DEFAULT 0,              -- 전고점, 만원
  low_price        INT  DEFAULT 0,              -- 전저점, 만원
  last_trade_price INT  DEFAULT 0,              -- 직전 실거래가, 만원

  -- 입지분석 (location analysis)
  commute_time     TEXT DEFAULT '',              -- 강남역까지 소요시간
  subway_line      TEXT DEFAULT '',              -- 전철 노선
  workplace1       TEXT DEFAULT '',              -- 직장1 (본인)
  workplace2       TEXT DEFAULT '',              -- 직장2 (배우자)
  school_score     TEXT DEFAULT '',              -- 근처 중학교 학업성취도
  hazard           TEXT DEFAULT '',              -- 유해시설 여부
  amenities        TEXT DEFAULT '',              -- 편의시설 (백화점, 마트, 병원 등)
  is_new_build     TEXT DEFAULT '',              -- 5년 이내 신축 여부
  is_candidate     BOOLEAN DEFAULT FALSE,        -- 임장 후보 아파트 여부
  note             TEXT DEFAULT '',              -- 메모

  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.complexes DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS complexes_sale_price_idx ON public.complexes (sale_price);

NOTIFY pgrst, 'reload schema';

-- ── Realtime publication ───────────────────────────────────────
-- Pooler 연결에서는 ALTER PUBLICATION 권한이 없으므로,
-- Supabase Dashboard → Database → Replication 에서
-- complexes 테이블을 supabase_realtime publication에 수동 추가할 것.
--
-- 또는 Direct connection (IPv6) 이 가능한 환경에서 아래를 실행:
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.complexes;
