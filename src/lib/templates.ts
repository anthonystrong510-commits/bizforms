import type { QuestionType } from "./forms";

export type TemplateQuestion = {
  type: QuestionType;
  title: string;
  description?: string;
  required?: boolean;
  options?: string[];
};

export type FormTemplate = {
  id: string;
  name: string;
  blurb: string;
  theme: string;
  bannerClass: string;
  title: string;
  description: string;
  questions: TemplateQuestion[];
};

export const TEMPLATES: FormTemplate[] = [
  {
    id: "blank",
    name: "Blank form",
    blurb: "Start from scratch",
    theme: "crimson",
    bannerClass: "banner-crimson",
    title: "Untitled form",
    description: "",
    questions: [{ type: "short_text", title: "Question 1", required: false }],
  },
  {
    id: "survey",
    name: "Survey",
    blurb: "Collect opinions and feedback",
    theme: "teal",
    bannerClass: "banner-teal",
    title: "Customer feedback survey",
    description: "Tell us how we did — it takes under two minutes.",
    questions: [
      { type: "short_text", title: "Your name", required: true },
      { type: "rating", title: "How would you rate your overall experience?", required: true },
      {
        type: "choice",
        title: "How did you hear about us?",
        options: ["Social media", "A friend", "Search", "Event"],
      },
      { type: "long_text", title: "What could we do better?" },
    ],
  },
  {
    id: "registration",
    name: "Registration",
    blurb: "Sign people up for an event",
    theme: "amber",
    bannerClass: "banner-amber",
    title: "Event registration",
    description: "Reserve your place — spaces are limited.",
    questions: [
      { type: "short_text", title: "Full name", required: true },
      { type: "email", title: "Email address", required: true },
      { type: "short_text", title: "Phone number", required: true },
      {
        type: "dropdown",
        title: "Which day are you attending?",
        options: ["Friday", "Saturday", "Sunday"],
        required: true,
      },
      { type: "number", title: "Number of guests" },
    ],
  },
  {
    id: "vendor",
    name: "Market & Festival",
    blurb: "Vendor booking application",
    theme: "crimson",
    bannerClass: "banner-crimson",
    title: "Market & Festival — Vendor Booking",
    description:
      "Booking form now open. Join • Showcase • Grow. Please fill in the application form below with your correct information.",
    questions: [
      { type: "short_text", title: "Business/Personal Name", required: true },
      { type: "short_text", title: "Phone Number", required: true },
      { type: "email", title: "Email address", required: true },
      { type: "short_text", title: "Location", required: true },
      {
        type: "choice",
        title: "Booth type",
        description: "Food trucks $190/day · Tents/booth style $120/day (10x10 space)",
        options: ["Food truck — $190/day", "Tent / booth — $120/day"],
        required: true,
      },
      {
        type: "checkbox",
        title: "Which days will you attend?",
        options: ["Fri 1:00pm–5:30pm", "Sat 10:00am–5:00pm", "Sun 10:00am–6:00pm"],
        required: true,
      },
      { type: "long_text", title: "Tell us about what you sell" },
    ],
  },
  {
    id: "invitation",
    name: "Invitation",
    blurb: "RSVP for a private event",
    theme: "plum",
    bannerClass: "banner-plum",
    title: "You're invited",
    description: "Let us know if you can make it.",
    questions: [
      { type: "short_text", title: "Your name", required: true },
      { type: "choice", title: "Will you attend?", options: ["Yes, count me in", "Sorry, can't make it"], required: true },
      { type: "number", title: "How many people in your party?" },
      { type: "long_text", title: "Any dietary requirements?" },
    ],
  },
  {
    id: "quiz",
    name: "Quiz",
    blurb: "Test knowledge with choices",
    theme: "forest",
    bannerClass: "banner-forest",
    title: "Quick quiz",
    description: "Answer all questions to complete the quiz.",
    questions: [
      { type: "short_text", title: "Your name", required: true },
      { type: "choice", title: "Question 1", options: ["Option 1", "Option 2", "Option 3"], required: true },
      { type: "choice", title: "Question 2", options: ["Option 1", "Option 2", "Option 3"], required: true },
    ],
  },
];
