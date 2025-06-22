# JobsIndia - Job Portal Application

## Overview

JobsIndia is a web-based job portal application built with Flask that allows users to browse job listings and administrators to post new job opportunities. The application serves job seekers in India with opportunities across various sectors including Government, IT, Banking, and more.

## System Architecture

### Backend Architecture
- **Framework**: Flask (Python 3.11)
- **ORM**: SQLAlchemy with Flask-SQLAlchemy extension
- **Database**: PostgreSQL (production) / SQLite (development fallback)
- **Web Server**: Gunicorn for production deployment
- **Session Management**: Flask sessions with secret key authentication

### Frontend Architecture
- **Template Engine**: Jinja2 (Flask's default)
- **Styling**: Custom CSS with responsive design
- **JavaScript**: Vanilla JavaScript for dynamic interactions
- **UI Components**: Font Awesome icons, Google Fonts (Poppins)
- **Layout**: Single-page application with section-based navigation

### Data Storage Solutions
- **Primary Database**: PostgreSQL for production with connection pooling
- **Fallback Database**: SQLite for development (jobs.db)
- **File Storage**: JSON and Excel file exports for data backup
- **External Integration**: GitHub Pages for data synchronization

## Key Components

### Models (models.py)
- **User Model**: Authentication system with admin privileges
  - Fields: username, email, password_hash, is_admin, created_at
  - Implements Flask-Login UserMixin for session management
- **Job Model**: Core job listing entity
  - Fields: title, company, location, category, job_type, experience, salary, description, requirements, application_url, contact_email, posted_date, deadline, is_active
  - Includes to_dict() method for JSON serialization

### Services
- **GitHubService**: Handles synchronization with GitHub Pages repository
  - Manages GitHub API integration for data backup
  - Supports file content retrieval and updates
- **ExcelService**: Manages Excel file operations
  - Exports job data to Excel format
  - Maintains JSON backup files

### Routes (routes.py)
- **API Endpoints**: RESTful job listing API with filtering and search
- **Web Routes**: Template rendering for different sections
- **Admin Routes**: Job posting and management functionality

## Data Flow

1. **Job Browsing**: Users access job listings through API endpoints with optional filtering by category, search terms, or limits
2. **Job Posting**: Administrators submit job data through forms, which get saved to database and optionally exported to Excel/GitHub
3. **Data Synchronization**: Job data can be synchronized with external services (GitHub Pages) for backup and public access
4. **Search & Filter**: Real-time filtering and search functionality on the frontend with backend API support

## External Dependencies

### Python Packages
- **Core**: Flask, SQLAlchemy, Gunicorn
- **Authentication**: Flask-Login, Werkzeug (password hashing)
- **Database**: psycopg2-binary (PostgreSQL), SQLAlchemy
- **HTTP/API**: requests, Flask-CORS
- **File Processing**: openpyxl (Excel), json (built-in)
- **Validation**: email-validator

### External Services
- **GitHub API**: For data backup and synchronization
- **Font Awesome**: Icon library
- **Google Fonts**: Typography (Poppins font family)

### Environment Variables
- `DATABASE_URL`: Database connection string
- `SESSION_SECRET`: Flask session encryption key
- `GITHUB_TOKEN`: GitHub API authentication
- `GITHUB_REPO_OWNER`: Repository owner for GitHub integration
- `GITHUB_REPO_NAME`: Repository name for data storage
- `GITHUB_FILE_PATH`: Path for job data file in repository

## Deployment Strategy

### Production Configuration
- **Platform**: Replit with autoscale deployment
- **Web Server**: Gunicorn with bind configuration (0.0.0.0:5000)
- **Process Management**: Replit workflow system
- **Database**: PostgreSQL with connection pooling and pre-ping health checks
- **Static Files**: Served through Flask with ProxyFix middleware for proper headers

### Development Configuration
- **Local Server**: Flask development server with debug mode
- **Database**: SQLite fallback for local development
- **Auto-reload**: Gunicorn with --reload flag for development

### Key Configuration Decisions
- **Connection Pooling**: Implemented to handle database connections efficiently with 300-second recycle time
- **CORS**: Enabled for all routes to support API access from different origins
- **Proxy Headers**: ProxyFix middleware handles reverse proxy headers correctly
- **Session Security**: Configurable secret key with environment variable fallback

## Changelog
```
Changelog:
- June 22, 2025. Initial setup
- June 22, 2025. Added Google Ads integration with client ID ca-pub-8086421927457124
- June 22, 2025. Implemented user management system with password change and user creation
- June 22, 2025. Added job deletion functionality for admins
- June 22, 2025. Reorganized file structure - moved all code files to root directory, removed folders
- June 22, 2025. Created GitHub Pages deployment files with static version of website
- June 22, 2025. Fixed GitHub Pages 404 error with proper file references and Jekyll configuration
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
```