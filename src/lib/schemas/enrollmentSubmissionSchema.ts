import { z } from "zod";

const phoneSchema = z
  .string()
  .transform((val) => val.replace(/\D/g, ""))
  .pipe(z.string().regex(/^\d{10}$/, "Must be a valid 10-digit phone number"));

const dobSchema = z.preprocess(
  (arg) => (typeof arg === "string" || arg instanceof Date ? new Date(arg) : arg),
  z
    .date({
      required_error: "Date of birth is required",
      invalid_type_error: "Please enter a valid date",
    })
    .max(new Date(), "Date of birth must be in the past"),
);

const parseAgeBand = (ageBand: string): { min: number; max: number } | null => {
  const match = ageBand.match(/^(\d+)\s*-\s*(\d+)$/);
  if (!match) return null;
  return { min: Number(match[1]), max: Number(match[2]) };
};

const getAge = (dob: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());

  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
};

const studentSchema = z
  .object({
    dob: dobSchema,
    ageBand: z.string(),
    programSelections: z
      .array(z.string().min(1, "Program selection cannot be empty"))
      .min(1, "Select at least one program"),
  })
  .superRefine((student, ctx) => {
    const range = parseAgeBand(student.ageBand);
    if (!range) return;

    const age = getAge(student.dob);
    if (age < range.min || age > range.max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Date of birth does not match the selected age band",
        path: ["dob"],
      });
    }
  });

const consentsSchema = z.object({
  liabilityWaiver: z
    .boolean()
    .refine((v) => v === true, "Liability waiver must be accepted"),
  emergencyMedicalConsent: z
    .boolean()
    .refine((v) => v === true, "Emergency medical consent must be accepted"),
  photoRelease: z.boolean(),
});

export const enrollmentSubmissionSchema = z.object({
  parentInfo: z.object({
    phone: phoneSchema,
  }),
  emergencyContacts: z.array(
    z.object({
      phone: phoneSchema,
    }),
  ),
  students: z.array(studentSchema).min(1, "At least one student must be enrolled"),
  consents: consentsSchema,
});
