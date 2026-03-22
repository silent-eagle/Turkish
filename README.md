# Turkish language study guide

## Description

This study guide supports intensive Turkish for Russian-speaking learners from zero to a level sufficient for comfortable spoken and written communication with native speakers.

## Recommended: study in the web app

**The main way to work through this course is the local web app** — a reader for all Markdown chapters, exercises, and resources, with **SQLite-backed progress** (status per page, notes, last opened). You browse the same material that lives in this repo, but with navigation, a course map, and interactive grammar/vocabulary exercises where the format allows.

- **Setup, dev server, production build, env vars, troubleshooting:** [docs/web-app.md](docs/web-app.md)

From the repo root after `npm install`:

```bash
npm run dev
```

Then open the UI (Vite prints the URL, typically `http://localhost:5173`). The API serves content and progress on port **3001** in development.

You can still edit or read Markdown directly in Git; the app reads those files via `CONTENT_ROOT`. For day-to-day study, prefer the app so progress and navigation stay in one place.

## Learning goals

After completing the 3-month course, the learner should be able to:

- Hold conversational Turkish on everyday and general topics
- Understand native speakers in typical situations
- Write in Turkish (messages, letters, short essays)
- Read and understand texts of moderate difficulty
- Use grammar patterns in speech and writing

## Repository structure (course content)

All study materials and planning docs live under **[`course/`](course/)**.

- **[Table of contents](course/content.md)** — full outline of the guide
- **[Study plan](course/plan.md)** — detailed 3-month intensive plan
- **[Progress log](course/progress.md)** — printable / manual daily tracking (optional if you use the app’s progress)
- **[Development plan](course/development-plan.md)** — implementation / tooling notes for this repo (optional)
- **[Month 1](course/month-01/)** — Turkish basics
- **[Month 2](course/month-02/)** — developing communication skills
- **[Month 3](course/month-03/)** — deepening and practice
- **[Exercises](course/exercises/)** — tests and exercises — see [course/exercises/README.md](course/exercises/README.md)
- **[Resources](course/resources/)** — extra materials — see [course/resources/README.md](course/resources/README.md)

## Teaching approach

The guide uses a combined approach:

- Communicative method
- Structural–functional approach
- Audiolingual method
- Full immersion where possible
- **Integrated tooling:** the web app ties reading, exercises, and progress together on your machine

## How to use the guide

1. **Run the [web app](docs/web-app.md)** and use the course map to open chapters and exercises in order.
2. Mark sections complete and add notes in the app as you go (or keep [course/progress.md](course/progress.md) if you want a paper-style log in parallel).
3. Read [course/plan.md](course/plan.md) whenever you need the big-picture schedule.
4. Complete exercises after each topic; interactive items are scored in the app where supported.
5. Use [additional resources](course/resources/README.md) to reinforce material.
6. Practice daily for at least 2–3 hours.

## Expectations for the learner

- Daily study (2–3 hours per day)
- Completing the exercises
- Regular speaking practice
- Work with audio materials
- Keeping vocabulary and grammar notes
