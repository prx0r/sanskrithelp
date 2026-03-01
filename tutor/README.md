# Proactive Tutor

Objective-driven sessions, weekly arc, daily brief. See [docs/PROACTIVE_TUTOR_DESIGN.md](../docs/PROACTIVE_TUTOR_DESIGN.md).

## API (sabdakrida, port 8010)

- `GET /tutor/daily-brief/{user_id}` — Today's plan
- `GET /tutor/weekly-arc/{user_id}` — Weekly goals
- `GET /tutor/session/spec/{zone_id}/{level}` — Session spec
- `POST /tutor/session/start` — Start (Form: user_id, zone_id, level)
- `POST /tutor/session/submit` — Submit (Form: user_id, zone_id, level, user_input; optional audio)

## Structure

- `config/zones.json` — Level counts, prerequisites
- `config/session_specs/*.json` — Per-zone level specs (objectives, pass criteria)
- `assessment/` — Grammar (deterministic), Pronunciation (probabilistic), Conceptual (LLM+rubric)
- `navigator.py` — Weekly arc, daily brief
- `conductor.py` — Session start, submit, assess
- `profile.py` — zone_levels, retry_counts, weekly_arc

## Adding Session Specs

Create `config/session_specs/{zone_id}.json` following the roots.json schema. Each level has:

- `objectives`, `pass_criteria` (conceptual rubric or production rules)
- `assessment_type`: conceptual | production
- `remedial_on_fail` for 3-attempts path
