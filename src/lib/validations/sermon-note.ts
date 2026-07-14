import { z } from "zod";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Field caps keep autosaved input bounded — the PATCH route is not
// rate-limited (autosave fires every few seconds during live note-taking),
// so size limits are its protection.
const fields = {
  title: z.string().max(200),
  date: z.string().regex(DATE_RE, "Expected YYYY-MM-DD"),
  speaker: z.string().max(200),
  location: z.string().max(200),
  notes: z.string().max(50_000),
};

export const sermonNoteUpdateSchema = z.object(fields).partial();

export const sermonNoteCreateSchema = z.object({
  title: fields.title.default("Untitled Sermon"),
  date: fields.date.optional(),
  speaker: fields.speaker.default(""),
  location: fields.location.default(""),
  notes: fields.notes.default(""),
});

export type SermonNoteUpdate = z.infer<typeof sermonNoteUpdateSchema>;
export type SermonNoteCreate = z.infer<typeof sermonNoteCreateSchema>;
