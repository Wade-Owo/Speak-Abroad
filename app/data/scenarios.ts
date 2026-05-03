export type ScenarioDifficulty = "Easy" | "Medium" | "Hard";
export type ConversationStarter = "ai" | "user";

export type Scenario = {
  id: string;
  title: string;
  description: string;
  difficulty: ScenarioDifficulty;
  category: string;
  iconName: "cart" | "professor" | "party" | "calendar" | "classmate" | "doctor" | "briefcase" | "home";
  conversationStarter: ConversationStarter;
  goal: string;
  details: string;
};

export const scenarios: Scenario[] = [
  {
    id: "grocery-store-checkout",
    title: "Grocery Store Checkout",
    description: "Ask for help, answer cashier questions, and finish checkout.",
    difficulty: "Easy",
    category: "Daily Life",
    iconName: "cart",
    conversationStarter: "ai",
    goal: "Ask where an item is and complete checkout.",
    details:
      "Practice navigating a busy store conversation, from asking where to find an item to responding naturally when the cashier asks about bags, payment, or rewards.",
  },
  {
    id: "talking-to-a-professor-after-class",
    title: "Talking to a Professor After Class",
    description: "Clarify an assignment and ask a follow-up politely.",
    difficulty: "Medium",
    category: "Campus",
    iconName: "professor",
    conversationStarter: "user",
    goal: "Ask for clarification and confirm next steps.",
    details:
      "Build confidence speaking with a professor in a respectful, direct way while explaining what you need and checking that you understood the answer.",
  },
  {
    id: "talking-to-someone-at-a-party",
    title: "Talking to Someone at a Party",
    description: "Start casual small talk and keep the conversation going.",
    difficulty: "Medium",
    category: "Social",
    iconName: "party",
    conversationStarter: "user",
    goal: "Introduce yourself and ask friendly follow-up questions.",
    details:
      "Practice relaxed social English for meeting someone new, finding shared interests, and exiting a conversation without feeling awkward.",
  },
  {
    id: "making-reservations",
    title: "Making Reservations",
    description: "Call or message to book a table, appointment, or activity.",
    difficulty: "Easy",
    category: "Daily Life",
    iconName: "calendar",
    conversationStarter: "user",
    goal: "Reserve a time and confirm the important details.",
    details:
      "Rehearse the language of booking, changing, and confirming a reservation so the details are clear the first time.",
  },
  {
    id: "asking-a-classmate-for-help",
    title: "Asking a Classmate for Help",
    description: "Ask about notes, homework, or a group project.",
    difficulty: "Easy",
    category: "Campus",
    iconName: "classmate",
    conversationStarter: "user",
    goal: "Ask for help while being respectful of their time.",
    details:
      "Practice making a clear request, explaining what you already tried, and offering a simple next step.",
  },
  {
    id: "doctors-appointment",
    title: "Doctor's Appointment",
    description: "Describe symptoms and ask about care instructions.",
    difficulty: "Hard",
    category: "Health",
    iconName: "doctor",
    conversationStarter: "ai",
    goal: "Explain symptoms and repeat back the doctor instructions.",
    details:
      "Prepare for a medical visit by practicing concise symptom descriptions, timing, severity, and questions about next steps.",
  },
  {
    id: "job-interview-small-talk",
    title: "Job Interview Small Talk",
    description: "Warm up before an interview with confident conversation.",
    difficulty: "Hard",
    category: "Career",
    iconName: "briefcase",
    conversationStarter: "ai",
    goal: "Answer opening questions and transition into the interview.",
    details:
      "Practice friendly but professional small talk so the first few minutes of an interview feel steady and natural.",
  },
  {
    id: "roommate-conversation",
    title: "Roommate Conversation",
    description: "Talk through shared spaces, chores, or expectations.",
    difficulty: "Medium",
    category: "Housing",
    iconName: "home",
    conversationStarter: "user",
    goal: "Raise a concern and agree on a practical next step.",
    details:
      "Practice direct, considerate language for everyday roommate issues, including shared responsibilities and boundaries.",
  },
];

export function getScenarioById(id: string) {
  return scenarios.find((scenario) => scenario.id === id);
}
