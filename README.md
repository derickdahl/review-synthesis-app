# Performance Review Synthesis App

An AI-powered tool that synthesizes multiple performance review inputs into professional, comprehensive review drafts for managers.

## Features

- **Multi-Input Processing**: Combines 4 key review sources
  - ITP (Ideal Team Player) Assessment scores
  - 360 Feedback documents (PDF upload)
  - Employee self-reviews
  - Manager observations/comments

- **AI Synthesis**: Intelligent analysis and synthesis into professional review format
  - Identifies strength patterns across inputs
  - Analyzes gaps between self and manager assessments  
  - Generates balanced, constructive feedback
  - Creates actionable development goals

- **Professional Output**: Structured review responses for:
  - Greatest Strengths
  - Development Feedback
  - Goals for Next Year
  - Overall Assessment

- **Export & Edit**: Generated reviews can be edited and exported for final submission

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TailwindCSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: Claude/OpenAI for synthesis
- **Deployment**: Vercel

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd review-synthesis-app
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `ANTHROPIC_API_KEY`: Your Claude API key (or OPENAI_API_KEY)

### 3. Database Setup

1. Create a new Supabase project
2. Run the SQL schema in `supabase-schema.sql` in your Supabase SQL editor
3. This creates all necessary tables, policies, and storage buckets

### 4. Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### 5. Deploy to Vercel

```bash
vercel deploy
```

Add environment variables in Vercel dashboard.

## Usage

### Creating a Review

1. **ITP Assessment**: Input numerical scores (1-10) for both employee self-assessment and manager assessment across Humble, Hungry, Smart dimensions

2. **360 Feedback**: Upload PDF document containing comprehensive 360-degree feedback

3. **Self Review**: Paste employee's self-review responses to development questions

4. **Manager Comments**: Add your observations, concerns, and additional context

5. **Generate**: Click "Generate Review" to synthesize all inputs using AI

6. **Edit & Export**: Review the generated content, make edits, and export final review

### Review Structure

The generated review follows standard performance review format:

- **Greatest Strengths**: Synthesized from all positive feedback themes
- **Development Feedback**: Constructive areas for improvement with specific examples
- **Goals for Next Year**: Actionable objectives based on development areas
- **Overall Assessment**: Balanced summary with forward-looking perspective

## Database Schema

Key tables:
- `users`: Managers using the system
- `employees`: Team members being reviewed
- `review_cycles`: Annual/quarterly review periods
- `reviews`: Main table storing all review data and AI outputs
- `review_history`: Audit trail of changes

Storage:
- `review-documents` bucket for uploaded PDFs

## API Endpoints

- `POST /api/synthesize`: Main AI synthesis endpoint
  - Accepts all 4 input types
  - Returns structured review output
  - Handles ITP analysis and gap detection

## Architecture Decisions

### AI Synthesis Strategy

1. **Input Analysis**: Extract themes and patterns from each source
2. **Gap Detection**: Compare self vs manager assessments for blind spots
3. **Theme Mapping**: Align insights to review question categories
4. **Professional Tone**: Generate balanced, constructive language
5. **Action Items**: Create specific, measurable development goals

### Security

- Row Level Security (RLS) ensures managers only see their own data
- File uploads to secure Supabase storage
- API keys stored securely in environment variables

### Scalability

- Designed for multiple managers and employees
- Review cycle management for organizational use
- Audit trail for compliance requirements

## Development Roadmap

- [ ] Enhanced PDF text extraction (OCR support)
- [ ] Multiple AI model options (GPT-4, Claude, etc.)
- [ ] Bulk review processing
- [ ] Email integration for notifications
- [ ] Advanced analytics and insights
- [ ] Custom review templates
- [ ] Integration with HR systems

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create GitHub issue for bugs
- Check documentation for common questions
- Contact team for enterprise support