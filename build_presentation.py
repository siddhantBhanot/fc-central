"""
Clean, grounded 6-slide Hackathon Pitch Deck for FC Central & Saathi.
Focuses simply and directly on the real problems, the solution, the live demo, and judging criteria.
No exaggerated figures or corporate fluff.
"""

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

# 16:9 Widescreen dimensions
SLIDE_WIDTH = Inches(13.333)
SLIDE_HEIGHT = Inches(7.5)

# Clean, modern styling palette
BG_DARK = RGBColor(15, 23, 42)         # Slate 900 #0F172A
CARD_BG = RGBColor(30, 41, 59)         # Slate 800 #1E293B
CARD_BORDER = RGBColor(51, 65, 85)     # Slate 700 #334155
TEXT_WHITE = RGBColor(248, 250, 252)   # Slate 50
TEXT_MUTED = RGBColor(148, 163, 184)   # Slate 400
ACCENT_ORANGE = RGBColor(249, 115, 22) # Orange 500
ACCENT_BLUE = RGBColor(56, 189, 248)   # Sky 400
ACCENT_GREEN = RGBColor(52, 211, 153)  # Emerald 400


def create_slide(prs, badge="", title="", subtitle=""):
    slide = prs.slides.add_slide(prs.slide_layouts[6])

    # Background
    bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, SLIDE_WIDTH, SLIDE_HEIGHT)
    bg.fill.solid()
    bg.fill.fore_color.rgb = BG_DARK
    bg.line.fill.background()

    # Header Box
    tb = slide.shapes.add_textbox(Inches(0.8), Inches(0.5), Inches(11.7), Inches(1.3))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0

    if badge:
        p_badge = tf.paragraphs[0]
        p_badge.text = badge.upper()
        p_badge.font.size = Pt(11)
        p_badge.font.bold = True
        p_badge.font.color.rgb = ACCENT_BLUE
        p_badge.space_after = Pt(4)

    p_title = tf.add_paragraph() if badge else tf.paragraphs[0]
    p_title.text = title
    p_title.font.size = Pt(28)
    p_title.font.bold = True
    p_title.font.color.rgb = TEXT_WHITE
    p_title.space_after = Pt(4)

    if subtitle:
        p_sub = tf.add_paragraph()
        p_sub.text = subtitle
        p_sub.font.size = Pt(13)
        p_sub.font.color.rgb = TEXT_MUTED

    return slide


def add_card(slide, left, top, width, height, title="", title_color=TEXT_WHITE):
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    card.fill.solid()
    card.fill.fore_color.rgb = CARD_BG
    card.line.color.rgb = CARD_BORDER
    card.line.width = Pt(1)

    tf = card.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.3)
    tf.margin_right = Inches(0.3)
    tf.margin_top = Inches(0.25)
    tf.margin_bottom = Inches(0.25)

    if title:
        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(16)
        p.font.bold = True
        p.font.color.rgb = title_color
        p.space_after = Pt(10)

    return card


def set_notes(slide, notes_text):
    slide.notes_slide.notes_text_frame.text = notes_text.strip()


def build():
    prs = Presentation()
    prs.slide_width = SLIDE_WIDTH
    prs.slide_height = SLIDE_HEIGHT

    # -------------------------------------------------------------------------
    # SLIDE 1: Title
    # -------------------------------------------------------------------------
    s1 = prs.slides.add_slide(prs.slide_layouts[6])
    bg = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, SLIDE_WIDTH, SLIDE_HEIGHT)
    bg.fill.solid()
    bg.fill.fore_color.rgb = BG_DARK
    bg.line.fill.background()

    tb = s1.shapes.add_textbox(Inches(1.0), Inches(1.8), Inches(11.3), Inches(4.0))
    tf = tb.text_frame
    tf.word_wrap = True

    p0 = tf.paragraphs[0]
    p0.text = "HACKATHON 2026"
    p0.font.size = Pt(13)
    p0.font.bold = True
    p0.font.color.rgb = ACCENT_ORANGE
    p0.space_after = Pt(10)

    p1 = tf.add_paragraph()
    p1.text = "FC Central & Saathi"
    p1.font.size = Pt(46)
    p1.font.bold = True
    p1.font.color.rgb = TEXT_WHITE
    p1.space_after = Pt(12)

    p2 = tf.add_paragraph()
    p2.text = "Internal Engineering Intelligence & Banking Relationship Assistant"
    p2.font.size = Pt(22)
    p2.font.color.rgb = ACCENT_BLUE
    p2.space_after = Pt(24)

    p3 = tf.add_paragraph()
    p3.text = "Solving fragmented knowledge and lost context across technical services and frontline banking staff."
    p3.font.size = Pt(15)
    p3.font.color.rgb = TEXT_MUTED

    set_notes(s1, """[SLIDE 1 | ~1 min]
"Good morning everyone.

Today we're presenting FC Central and Saathi. 

At its core, this project tackles a very real problem we experience every day in both tech and banking: fragmented knowledge and lost context. 

We built two dedicated, role-tailored workspaces on one robust AI architecture:
1. For engineering: An intelligence hub with Dev Chat and interactive Knowledge Transfer courses.
2. For banking staff: Saathi, an assistant that keeps customer context organized, answers customer-specific questions, and preserves relationship history.

Let's look at the specific problems we set out to solve."
""")

    # -------------------------------------------------------------------------
    # SLIDE 2: The Real Problem
    # -------------------------------------------------------------------------
    s2 = create_slide(
        prs,
        badge="The Problem",
        title="Knowledge is Fragmented & Hard to Access",
        subtitle="Two different teams struggling with the exact same bottleneck: lost context."
    )

    # Left Card: Engineering Problem
    c_eng = add_card(s2, Inches(0.8), Inches(2.0), Inches(5.65), Inches(4.8), title="For Engineering Teams", title_color=ACCENT_ORANGE)
    tf_eng = c_eng.text_frame
    eng_bullets = [
        ("Tribal knowledge in senior heads", "Details about how microservices work (rules, deployment parameters, backward compatibility) aren't documented or are buried in old Slack chats."),
        ("Slow, frustrating onboarding", "New hires spend weeks asking senior engineers basic questions just to figure out how to build and deploy a service."),
        ("Senior engineer interruption", "Senior developers spend valuable sprint time answering repetitive questions instead of building core features.")
    ]
    for b_title, b_desc in eng_bullets:
        p = tf_eng.add_paragraph()
        p.text = f"• {b_title}"
        p.font.bold = True
        p.font.size = Pt(13)
        p.font.color.rgb = TEXT_WHITE
        p.space_after = Pt(2)
        p_sub = tf_eng.add_paragraph()
        p_sub.text = f"  {b_desc}"
        p_sub.font.size = Pt(11)
        p_sub.font.color.rgb = TEXT_MUTED
        p_sub.space_after = Pt(10)

    # Right Card: Banking RM Problem
    c_bank = add_card(s2, Inches(6.85), Inches(2.0), Inches(5.65), Inches(4.8), title="For Banking Staff & RMs", title_color=ACCENT_BLUE)
    tf_bank = c_bank.text_frame
    bank_bullets = [
        ("Scattered customer context", "A Relationship Manager manages dozens of clients. Important details like past discussions, specific preferences, and risk appetite are scattered across emails and notes."),
        ("Meeting preparation is tedious", "Before calling a client, the RM has to manually piece together their portfolio and recent history."),
        ("Lost context on staff transition", "When an RM changes or takes leave, the next person has no easy way to get up to speed on that customer's relationship background.")
    ]
    for b_title, b_desc in bank_bullets:
        p = tf_bank.add_paragraph()
        p.text = f"• {b_title}"
        p.font.bold = True
        p.font.size = Pt(13)
        p.font.color.rgb = TEXT_WHITE
        p.space_after = Pt(2)
        p_sub = tf_bank.add_paragraph()
        p_sub.text = f"  {b_desc}"
        p_sub.font.size = Pt(11)
        p_sub.font.color.rgb = TEXT_MUTED
        p_sub.space_after = Pt(10)

    set_notes(s2, """[SLIDE 2 | ~1.5 min]
"Here is the real problem we see daily.

On the engineering side: We have dozens of microservices. If you want to know how Income Assessment evaluates a four-wheeler loan, or what parameters Jenkins needs to cut an SIT release, good luck finding it in one place. It's in senior engineers' heads. New devs take weeks just to get oriented, and seniors get constantly interrupted.

On the banking frontline: Relationship managers are talking to clients every day. But customer context is fragmented. Before a client call, the RM has to remember: what did we talk about last month? What are their family goals? And if an RM leaves or hands over accounts, that context is practically lost.

We realized that both problems are about accessing grounded, organized knowledge when you need it."
""")

    # -------------------------------------------------------------------------
    # SLIDE 3: The Solution
    # -------------------------------------------------------------------------
    s3 = create_slide(
        prs,
        badge="Our Solution",
        title="Two Focused Workspaces, Built for How Teams Actually Work",
        subtitle="No cluttered all-in-one UI. Each role gets exactly the tools they need."
    )

    col_w = Inches(5.65)
    # Left Card: Engineering Workspace
    c_sol_eng = add_card(s3, Inches(0.8), Inches(2.0), col_w, Inches(4.8), title="1. Engineering Workspace", title_color=ACCENT_ORANGE)
    tf = c_sol_eng.text_frame
    items_eng = [
        ("Dev Chat (Code-Grounded)", "Engineers ask technical questions about our services and get verified answers with exact file paths and source citations."),
        ("Knowledge Cafe (Guided KT)", "Self-paced, structured courses (e.g. Jenkins Pipelines, Income Assessment) with clear syllabus, grounded lessons, and interactive knowledge checks."),
        ("Architecture Diagrams", "Automatically renders clear flowcharts of deployment pipelines and service flows so engineers understand the big picture visually.")
    ]
    for b_title, b_desc in items_eng:
        p = tf.add_paragraph()
        p.text = f"• {b_title}"
        p.font.bold = True
        p.font.size = Pt(13)
        p.font.color.rgb = TEXT_WHITE
        p.space_after = Pt(2)
        p_sub = tf.add_paragraph()
        p_sub.text = f"  {b_desc}"
        p_sub.font.size = Pt(11)
        p_sub.font.color.rgb = TEXT_MUTED
        p_sub.space_after = Pt(10)

    # Right Card: Banking Workspace
    c_sol_bank = add_card(s3, Inches(6.85), Inches(2.0), col_w, Inches(4.8), title="2. Saathi (Banking Workspace)", title_color=ACCENT_BLUE)
    tf = c_sol_bank.text_frame
    items_bank = [
        ("Customer AI Brief", "Instantly generates a concise profile for any selected client — portfolio summary, liquid funds, risk category, and key priorities."),
        ("Ask Saathi (Grounded Q&A)", "Ask specific questions about the client (e.g. 'What products match their liquidity needs?') with streaming, multi-model AI."),
        ("Add Live Context on the Fly", "RM can type a quick note after a call (e.g. 'Daughter going to UK in fall'). It saves to that customer's vector memory and updates future AI responses."),
        ("Banking Knowledge Cafe", "Curated modules on credit underwriting, NRI wealth, and KYC/AML compliance.")
    ]
    for b_title, b_desc in items_bank:
        p = tf.add_paragraph()
        p.text = f"• {b_title}"
        p.font.bold = True
        p.font.size = Pt(13)
        p.font.color.rgb = TEXT_WHITE
        p.space_after = Pt(2)
        p_sub = tf.add_paragraph()
        p_sub.text = f"  {b_desc}"
        p_sub.font.size = Pt(11)
        p_sub.font.color.rgb = TEXT_MUTED
        p_sub.space_after = Pt(8)

    set_notes(s3, """[SLIDE 3 | ~1.5 min]
"So here is our solution: two clean, purpose-built workspaces.

For developers:
You log in and have Dev Chat — where you can query our microservice codebases and get answers backed by real file citations, not hallucinations. And you have Knowledge Cafe, which turns runbooks into university-style self-paced courses with interactive quizzes and visual flowcharts.

For banking staff:
You log in and land directly in Saathi. You select a customer, and immediately see an AI summary of who they are and their portfolio. You can ask Saathi questions about them. And critically, you can add custom notes right from the UI — like 'Client wants to discuss foreign remittance next week' — and the AI immediately remembers it for all future queries.

Let's now jump straight into the live product demo."
""")

    # -------------------------------------------------------------------------
    # SLIDE 4: Live Demo (Walkthrough)
    # -------------------------------------------------------------------------
    s4 = create_slide(
        prs,
        badge="Product Demonstration",
        title="Live Product Walkthrough",
        subtitle="A quick 4-minute demonstration of the working system on localhost."
    )

    demo_w = Inches(3.7)
    demo_gap = Inches(0.3)

    cards = [
        ("1. Engineering Flow",
         "Login as Engineer\n\n"
         "• Open Knowledge Cafe $\\to$ 'Jenkins Deployment Pipelines'.\n"
         "• View Lesson 8 (Release Process) with live rendered flowchart.\n"
         "• Open Dev Chat $\\to$ Ask how Income Assessment works.\n"
         "• Verify source file links and citations.",
         ACCENT_ORANGE),
        ("2. Banking Staff Flow",
         "Login as Banking Staff\n\n"
         "• UI automatically presents Saathi.\n"
         "• Select customer Vikram Malhotra.\n"
         "• See instant AI Customer Brief with portfolio & liquid asset status.\n"
         "• Review clean, stream-ready interface.",
         ACCENT_BLUE),
        ("3. Dynamic Context & Q&A",
         "Memory & Ask Saathi\n\n"
         "• Click '+ Add Context': Ingest a quick note about upcoming child education.\n"
         "• Query Ask Saathi: 'What products should I pitch for UK education expenses?'\n"
         "• Watch streamed response combine portfolio + new note in real-time.",
         ACCENT_GREEN)
    ]

    l_pos = Inches(0.8)
    for title, text, col in cards:
        c = add_card(s4, l_pos, Inches(2.0), demo_w, Inches(4.8), title=title, title_color=col)
        tf = c.text_frame
        for line in text.split("\n"):
            p = tf.add_paragraph()
            p.text = line
            p.font.size = Pt(11.5)
            p.font.color.rgb = TEXT_WHITE if line.startswith("•") or line.startswith("1") or line.startswith("2") or line.startswith("3") else TEXT_MUTED
            p.space_after = Pt(3)
        l_pos += demo_w + demo_gap

    set_notes(s4, """[SLIDE 4 | ~4 min | LIVE DEMO SCREEN]
"Now let's switch to the live application running on localhost.

[DEMO PART 1: DEV WORKSPACE]
- We log in as an engineer.
- Notice Knowledge Cafe: let's open 'Jenkins Deployment Pipelines' -> Lesson 8: Release Process.
- Here is the complete lesson with key takeaways, source files, and a rendered interactive flowchart showing the exact SIT/QA/Sandbox gates.
- Next, let's open Dev Chat: ask 'What are the main endpoints and business rules for income assessment?' Notice how it cites the exact files and parameters.

[DEMO PART 2: BANKING RM & SAATHI]
- Now let's log in as Priya, a banking RM.
- The interface cleanly switches to Saathi.
- Let's select client Vikram Malhotra. Saathi immediately displays his profile: ₹4.8 Cr AUM, upcoming maturity dates, and risk profile.
- Now let's test dynamic memory: Click '+ Add Context'. I'll type: 'Client plans to send daughter to UK in Sept 2026; needs remittance advisory and tax clearance.'
- Click Save.
- Now in Ask Saathi, let's ask: 'What should I pitch Vikram for his upcoming UK education expenses?'
- Look at the streaming response powered by AWS Bedrock: it references his liquid funds and recommends LRS remittance options based on the note we just added seconds ago.

Everything you just saw is live and functional right now."
""")

    # -------------------------------------------------------------------------
    # SLIDE 5: Reliability & Technical Architecture
    # -------------------------------------------------------------------------
    s5 = create_slide(
        prs,
        badge="Reliability & Architecture",
        title="Why This Is Production-Ready, Not a Prototype",
        subtitle="Addressing judging criteria: AI Innovation (25%), Feasibility (20%), and Security (15%)."
    )

    card_w = Inches(5.65)
    card_h = Inches(2.25)

    arch_items = [
        (Inches(0.8), Inches(2.0), "Multi-Provider LLM Fallback",
         "AWS Bedrock Sonnet 4.6 is our default for top analytical reasoning. If Bedrock is throttled or times out, the system automatically falls back to Groq / OpenAI transparently so the user never gets an error.",
         ACCENT_BLUE),
        (Inches(6.85), Inches(2.0), "Customer-Isolated Vector Storage",
         "Uses Qdrant vector database with dedicated collections for Saathi customers. Notes and client history are isolated at the database level — zero risk of cross-customer data leakage.",
         ACCENT_GREEN),
        (Inches(0.8), Inches(4.55), "Data Security & Compliance Readiness",
         "Customer data is never used to train external models. All vector search and LLM calls run server-side with strict environment secret management and role-based access control.",
         ACCENT_ORANGE),
        (Inches(6.85), Inches(4.55), "Dockerized & Modular Architecture",
         "Follows clean architecture principles. FastAPI backend, React frontend, Qdrant vector DB, and SQLite storage are Dockerized and run together with a single command.",
         TEXT_WHITE)
    ]

    for x, y, title, desc, col in arch_items:
        c = add_card(s5, x, y, card_w, card_h, title=title, title_color=col)
        tf = c.text_frame
        p = tf.add_paragraph()
        p.text = desc
        p.font.size = Pt(11.5)
        p.font.color.rgb = TEXT_MUTED
        p.space_before = Pt(4)

    set_notes(s5, """[SLIDE 5 | ~1 min]
"A quick look under the hood to address the technical criteria:

1. Multi-Provider Fallback: We don't rely on a single fragile API. Bedrock Sonnet 4.6 is our primary, but if AWS throttles or errors, our adapter automatically fails over to Groq or OpenAI. The user never sees a broken screen.
2. Isolated Vector Storage: In Qdrant, each customer's data has dedicated collection and payload filtering. Customer A's notes cannot leak into Customer B's queries.
3. Security & Compliance: No client data is ever used to train models. Keys remain strictly server-side.
4. Production Feasibility: The entire system is built with clean architecture and is fully Dockerized. It can be deployed into a private bank VPC today."
""")

    # -------------------------------------------------------------------------
    # SLIDE 6: Summary & Future Potential
    # -------------------------------------------------------------------------
    s6 = create_slide(
        prs,
        badge="Summary & Value",
        title="Practical Impact Today, Greater Value Tomorrow",
        subtitle="Addressing judging criteria: Business Value (30%) and Overall Strategic Fit."
    )

    card_w = Inches(5.65)
    card_h = Inches(4.8)

    # Left: What it delivers today
    c_today = add_card(s6, Inches(0.8), Inches(2.0), card_w, card_h, title="What It Delivers Today", title_color=ACCENT_GREEN)
    tf = c_today.text_frame
    today_items = [
        ("Faster Developer Onboarding", "New engineers learn our deployment and service architectures independently using Knowledge Cafe instead of blocking seniors on Slack."),
        ("Zero Lost Customer Context", "RMs have a single place to see client summaries, ask questions, and preserve meeting notes across staff handovers."),
        ("Fast Pre-Meeting Preparation", "RMs get an instant AI synthesis of portfolio and notes before every client call in seconds instead of 30 minutes of manual searching.")
    ]
    for b_title, b_desc in today_items:
        p = tf.add_paragraph()
        p.text = f"• {b_title}"
        p.font.bold = True
        p.font.size = Pt(13)
        p.font.color.rgb = TEXT_WHITE
        p.space_after = Pt(2)
        p_sub = tf.add_paragraph()
        p_sub.text = f"  {b_desc}"
        p_sub.font.size = Pt(11)
        p_sub.font.color.rgb = TEXT_MUTED
        p_sub.space_after = Pt(12)

    # Right: Where it goes next
    c_next = add_card(s6, Inches(6.85), Inches(2.0), card_w, card_h, title="Logical Next Steps", title_color=ACCENT_BLUE)
    tf = c_next.text_frame
    next_items = [
        ("Automated Git/Jenkins Webhooks", "Auto-generate and update Knowledge Cafe lessons whenever new pipeline stages or API specs are committed to git."),
        ("Core Banking & CRM Connectors", "Direct read-sync with Finacle and internal CRM feeds to keep client vector profiles updated in real time."),
        ("Voice Call Summary Ingestion", "Allow RMs to dictate notes or record voice memos after client meetings for automatic vector storage.")
    ]
    for b_title, b_desc in next_items:
        p = tf.add_paragraph()
        p.text = f"• {b_title}"
        p.font.bold = True
        p.font.size = Pt(13)
        p.font.color.rgb = TEXT_WHITE
        p.space_after = Pt(2)
        p_sub = tf.add_paragraph()
        p_sub.text = f"  {b_desc}"
        p_sub.font.size = Pt(11)
        p_sub.font.color.rgb = TEXT_MUTED
        p_sub.space_after = Pt(12)

    set_notes(s6, """[SLIDE 6 | ~1 min | CLOSING]
"To wrap up:

FC Central & Saathi solves two genuine, high-friction problems:
- In engineering: it cuts down developer onboarding time and stops senior engineers from being overwhelmed by repetitive Slack questions.
- In banking: it equips Relationship Managers with instant client context, allows them to add notes on the fly, and preserves relationship memory across transitions.

It is built cleanly, it runs reliably with multi-provider fallback, and you can see it working end-to-end today.

Thank you, and we're ready for your questions!"
""")

    output_path = "/Users/siddhantbhanot/Developer/fc-central/FC_Central_Hackathon_Pitch_Deck.pptx"
    prs.save(output_path)
    print(f"Clean, 6-slide presentation saved to: {output_path}")


if __name__ == "__main__":
    build()
