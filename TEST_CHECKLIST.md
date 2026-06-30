# UniPilot – Test & Validation Checklist

## 1. Auth
- [ ] Welcome screen displays correctly
- [ ] Register with email/password → confirmation email received
- [ ] Confirm email → redirected into app
- [ ] Sign out → redirected to welcome screen
- [ ] Sign in with email/password → lands on home tab
- [ ] Forgot Password → email received, password reset works

## 2. Onboarding
- [ ] New user is taken to onboarding after first login
- [ ] Can complete all onboarding steps (name, year, semester dates, study time)
- [ ] After completing onboarding → lands on home tab
- [ ] Returning user skips onboarding

## 3. Home Tab
- [ ] Dashboard loads (stats, upcoming tasks, quick tools)
- [ ] Quick tools navigate correctly (Calendar, Budget, Projects, AI Coach)
- [ ] Pro upgrade banner shows for free users

## 4. Modules
- [ ] Add module (name, code, color, target mark, lecturer)
- [ ] Module appears in list
- [ ] Tap module → detail screen shows (stats, notes, tasks)
- [ ] Upload a file (PDF/image) to a module
- [ ] File appears in notes list
- [ ] Delete a note
- [ ] Free plan: adding 4th module shows upgrade prompt

## 5. Tasks
- [ ] Add task (title, module, priority, due date)
- [ ] Task appears in list with correct badge colors
- [ ] Tap task → detail screen
- [ ] Update progress slider → status updates
- [ ] Mark task complete
- [ ] Overdue tasks marked correctly
- [ ] Free plan: 11th active task shows upgrade prompt

## 6. Timetable
- [ ] Add timetable entry (module, day, start/end time, room)
- [ ] Entry shows on correct day
- [ ] Edit / delete entry

## 7. Grades
- [ ] Navigate to grades from module detail
- [ ] Add a grade entry (assessment name, weight, score)
- [ ] Current mark updates correctly
- [ ] Progress bar reflects grade vs target

## 8. AI Coach
- [ ] AI screen loads ("Powered by Gemini")
- [ ] Select a prompt type (Essay, Quiz, Flashcards, Study Plan)
- [ ] Enter a prompt and submit
- [ ] Response streams back
- [ ] "Open as Flashcards" / "Start Quiz" buttons appear where applicable

## 9. Calendar
- [ ] Calendar screen loads
- [ ] Tasks with due dates appear on correct dates
- [ ] Timetable entries appear correctly

## 10. Budget (Pro feature)
- [ ] Free user → sees upgrade wall when tapping Budget
- [ ] (With Pro subscription) Set monthly income and limit
- [ ] Add expense with category
- [ ] Spending chart updates
- [ ] Month navigation works

## 11. Group Projects (Pro+ feature)
- [ ] Free/Pro user → sees upgrade wall
- [ ] (With Pro+) Create a project
- [ ] Add tasks to project
- [ ] Update project status

## 12. Subscription Screen
- [ ] Opens from upgrade prompts
- [ ] Plan cards display (Free / Pro / Pro+)
- [ ] Restore Purchases button works (no crash)
- [ ] (Once RC configured) Purchase flow initiates

## 13. Settings
- [ ] Dark/Light/System theme toggle works
- [ ] Notification permission toggle works
- [ ] Sign out from settings works

## 14. Profile Tab
- [ ] Shows user email and profile info
- [ ] Navigate to Settings from profile
- [ ] Navigate to Subscription from profile

## 15. Notifications
- [ ] Adding a task with a due date schedules a notification
- [ ] Notification appears at correct time (test with near-future date)

---
## Known limitations (fix before Play Store)
- SSO (Google Sign-In) — to be re-implemented
- RevenueCat key is placeholder — subscription purchases won't process until configured
