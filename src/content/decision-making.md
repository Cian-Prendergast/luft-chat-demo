# Decision Making Framework

## Purpose & Why This Matters
* **Purpose:** This framework empowers UX designers to make confident decisions at the correct level while ensuring alignment on critical choices impacting strategy, brand, or technical architecture [cite: 91].
* **Objective:** It aims to eliminate "can I decide this?" anxiety and accelerate delivery by clarifying decision rights [cite: 92].
* **Risk of No Framework:** Without clear rights, designers may wait too long for approvals (killing velocity), make decisions that get overturned (wasting effort), or feel anxious (reducing quality) [cite: 98, 99, 100, 101].
* **Benefits:** Clear rights allow designers to move fast, escalate at the right time to prevent mistakes, and improve overall satisfaction [cite: 103, 104].

---

## Decision Levels Overview
Decisions are organized into four levels based on impact, reversibility, and scope [cite: 106].

| Level | Decision Scope | Who Decides | Approval Needed |
| :--- | :--- | :--- | :--- |
| **Level 1: Component** | Individual UI elements, micro-interactions, local patterns [cite: 107] | Designer (autonomous) [cite: 107] | None - just do [cite: 107] |
| **Level 2: Feature** | Feature-level flows, patterns affecting one product area [cite: 107] | Designer + Peer Review [cite: 107] | UX Lead / Design System (for new patterns) [cite: 107] |
| **Level 3: Journey** | Cross-feature experiences, multi-touchpoint flows [cite: 107] | Designer + Team Alignment [cite: 107] | Product Owner & Relevant Stakeholders [cite: 107] |
| **Level 4: Strategic** | Platform-wide changes, brand expression, architectural shifts [cite: 107] | Leadership Decision [cite: 107] | VP/Director Level & Functional Leads [cite: 107] |

---

## Level 1: Component Decisions (Designer Autonomous)

### What You Can Decide Independently
* **UI Component Selection & Adaptation:** Choosing design system components, sizing/spacing within guidelines, color selection from approved palettes, and icon selection [cite: 114, 115].
* **Layout & Responsiveness:** Minor layout adjustments and responsive behavior within established patterns [cite: 116, 117].
* **Microcopy & Content:** Button labels, tooltips, error messages, field labels, and instructional copy under 2 sentences [cite: 119, 120, 121, 122, 123].
* **Interaction Details:** States (hover, focus, active), transition timing, loading indicators, and input validation [cite: 125, 126, 127, 129].
* **Visual Refinements:** Typography hierarchy, whitespace, alignment, and image cropping [cite: 131, 132, 133, 134].

### Guidelines for Level 1
* **Decide independently when:** The solution follows established patterns, the impact is contained to a single screen, it is easily reversible, and there are no accessibility or technical concerns [cite: 137, 138].
* **Get a peer review when:** You are uncertain, multiple valid options exist, or you are "bending" (but not breaking) guidelines [cite: 144, 145, 146].
* **Documentation:** Document in Figma via annotations. If guidelines are bent, explain the rationale [cite: 149, 151].

---

## Level 2: Feature Decisions (Designer + Peer Review)

### What Requires Peer Review / Team Alignment
* **Feature-Level Patterns:** User flows within a feature, new interaction patterns, and navigation structure within a product area [cite: 165, 166].
* **Component Creation:** New components not in the design system or significant modifications of existing ones [cite: 173, 174].
* **Content & Accessibility:** Page/screen structure, keyboard navigation approach, screen reader experience, and ARIA implementation [cite: 178, 183, 184, 186].

### Decision Process
1.  **Design & Document:** Create designs with clear rationale and prepare 2-3 alternatives if uncertain [cite: 188, 189].
2.  **Peer Critique:** Present in a 30-45 minute critique with 2-3 other designers [cite: 191, 192].
3.  **Pattern Approval:** If the pattern is reusable, escalate to the Design System Team; if feature-specific, document it for potential future use [cite: 196, 197].
4.  **Document & Proceed:** Update designs based on feedback and proceed to implementation [cite: 199, 200].

* **Timeline:** 2-5 days (Typical); same day for urgent cases [cite: 205, 208].

---

## Level 3: Journey Decisions (Team Alignment Required)

### What Requires Cross-Functional Alignment
* **Cross-Feature Experiences:** Flows spanning multiple features or products and changes to established user journeys [cite: 221, 222].
* **Experience Strategy:** Feature prioritization (MVP vs. full) and trade-offs between user needs and technical constraints [cite: 226, 227].
* **Data & Metrics:** Identifying metrics to track and A/B test designs [cite: 232, 233].
* **Integration Points:** Handoffs between product areas and shared components [cite: 239, 240].

### Stakeholder Involvement Matrix
| Decision Type | Required Stakeholders |
| :--- | :--- |
| **Journey/Flow changes** | Product Owner, DX Lead, Service Designer, Channel PM (if multi-channel) [cite: 282] |
| **Cross-channel journeys** | Product Owner, DX Lead, Channel PM, Service Designer [cite: 282] |
| **Technical trade-offs** | Tech Lead, Product Owner, UX Designer, DX Lead, Channel PM [cite: 282] |
| **Phasing/MVP decisions** | Product Owner, DX Lead, Tech Lead [cite: 282] |

* **Timeline:** 1-2 weeks (Typical); 3-5 days for urgent alignment [cite: 269, 270].

---

## Level 4: Strategic Decisions (Leadership Approval)

### What Requires Leadership Decision
* **Platform-Wide Changes:** Core navigation paradigms, new design language, or fundamental interaction shifts [cite: 286].
* **Brand & Identity:** Visual identity evolution and tone of voice shifts [cite: 293, 294].
* **Architecture & Resources:** Design system architecture, major tool investments, and team structure decisions [cite: 297, 301, 302].
* **Strategic Direction:** UX vision, principles, and research strategy [cite: 306].

### Decision Process
1.  **Proposal Development:** Build a business case with data, vision, and risk assessments [cite: 308].
2.  **Leadership Review:** Present to VP/Director of Product/Engineering and relevant Value Stream Leads [cite: 315, 316, 317, 320].
3.  **Communication:** Document rationale and create a communication plan [cite: 323].

* **Timeline:** 4-8 weeks (Typical); 2-3 weeks for urgent needs [cite: 326, 327].

---

## Trade-Off Decision Framework

### Common Trade-Off Types
1.  **User Needs vs. Business Goals:** Find solutions serving both; align with core principles [cite: 343, 344].
2.  **Ideal UX vs. Technical Constraints:** Seek the "80% solution" and phase the ideal approach [cite: 347, 348].
3.  **Consistency vs. Context Optimization:** Assess if optimization benefits outweigh inconsistency costs [cite: 351, 352].
4.  **Speed vs. Quality:** Determine the minimum viable experience and maintain the quality bar [cite: 360, 361].

### Trade-Off Decision Matrix
Score options (1-10) and multiply by weight [cite: 372, 373].

| Criteria | Weight (1-5) | Option A | Option B |
| :--- | :--- | :--- | :--- |
| User value / solves problem | 5 [cite: 369] | | |
| Aligns with business goals | 4 [cite: 369] | | |
| Technical feasibility | 4 [cite: 369] | | |
| Consistency with patterns | 3 [cite: 369] | | |
| Time to implement | 3 [cite: 369] | | |
| Accessibility compliance | 5 [cite: 369] | | |

---

## Special Role: Channel Product Manager
Responsible for touchpoint strategy and consistency across channels (mobile, web, notifications, chat) [cite: 383, 384].

* **Involvement Rule of Thumb:** Include them if the decision affects multiple channels, impacts channel strategy/consistency, or creates channel-specific technical constraints [cite: 421, 422, 423].
* **Red Flags:** "Needs to work across web and mobile," "Users will transition between channels," or "Affects notifications/alerts" [cite: 428, 429, 434].

---

## Escalation Paths
1.  **Step 1: Direct Resolution:** Conversation to find common ground; document agreements [cite: 455, 460, 463].
2.  **Step 2: Bring in DX Lead:** Lead facilitates discussion based on UX principles [cite: 464, 467, 468].
3.  **Step 3: Escalate to Product Leadership:** Frame as a product judgment trade-off [cite: 470, 473].
4.  **Step 4: Value Stream / Leadership:** Rare; for broader organizational impact [cite: 476, 477].

* **Escalation Timeline:** Direct (1-3 days), DX Lead (3-5 days), Product Leadership (1 week), Value Stream (2 weeks) [cite: 504, 506, 507, 508].

---

## Documentation Requirements
* **All Decisions (Level 1-4):** What, when, why (rationale/data), and constraints [cite: 513, 514, 515, 516, 517].
* **Level 1:** Figma design notes [cite: 522, 523].
* **Level 2:** Figma annotations and project documentation summary [cite: 525, 526, 527].
* **Level 3:** Formal decision log in shared space (Docspace/TheyDo) and updated journey maps [cite: 528, 529].
* **Level 4:** Executive decision document and business case [cite: 532, 533].

---

## Common Decision Scenarios

* **Scenario 1: Dropdown vs. Radio Buttons:** Level 1. Decide based on option count (2-4 = radio) and space [cite: 547, 548, 550].
* **Scenario 2: Complex Table Filtering:** Level 2. Create directions, present in critique, and check with Design System Team [cite: 555, 557, 560, 564].
* **Scenario 3: Removing Onboarding Steps:** Level 3. Analyze completion data, identify affected channels, and align with PO and Channel PMs [cite: 569, 571, 574, 578].
* **Scenario 5: Skipping User Research:** Level 3. Advocate for lean alternatives; if skipped, document the risk and escalate if significant [cite: 591, 599, 600, 601].
* **Scenario 6: Design "Impossible" to Build:** Level 2. Understand constraints and find the 80% solution; escalate to Tech Lead if no alternatives exist [cite: 603, 604, 607, 609, 610].
* **Scenario 6.5: Notification Channel Selection:** Level 3. Schedule meeting with Notifications Channel PM and align on strategy [cite: 612, 614, 620, 623].

---

## Decision-Making Principles
1.  **User Value First:** Prioritize user value over ease of build, but balance with feasibility [cite: 651, 652, 653].
2.  **Data Over Opinions:** Use research/analytics; don't be paralyzed waiting for "perfect" data [cite: 654, 659, 661].
3.  **Reversibility Guides Risk:** Reversible decisions need less process [cite: 662, 663].
4.  **Consistency Has Value:** Reduce cognitive load but avoid dogmatism [cite: 665, 666].
5.  **Communicate Decisions:** Document and share to help others stay aligned [cite: 667, 668].
6.  **Escalate Early:** Don't wait until weeks are invested in the wrong direction [cite: 670, 672].
7.  **Accept & Document:** Accept overruled decisions gracefully but document your recommendation [cite: 673, 674, 675].
8.  **Speed Within Guardrails:** Move fast within your level [cite: 676, 681, 683].

---

## Success Indicators
* **Individual:** Designers feel confident in Level 1-2 decisions; reduction in "can I decide this?" questions [cite: 723, 724, 726].
* **Team:** Clear documentation of key decisions and escalation at the right time [cite: 728, 729].
