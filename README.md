# JobsIndia - Job Portal Website

A comprehensive job portal application for finding opportunities across India in Government, IT, Banking, Healthcare and other sectors.

## Features

- **Job Browsing**: Browse jobs by category with advanced search and filtering
- **Admin Panel**: Post, manage, and delete job listings
- **User Management**: Add admin and regular users with role-based access
- **Google Ads Integration**: Monetized with Google AdSense
- **Data Export**: Export job data to Excel format
- **GitHub Integration**: Sync job data with GitHub Pages

## Admin Access

- **Username**: `admin`
- **Password**: `admin123` (can be changed via admin panel)

## Technologies Used

- **Backend**: Python Flask with SQLAlchemy
- **Database**: PostgreSQL
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Styling**: Custom CSS with Font Awesome icons
- **Deployment**: Replit with Gunicorn

## Live Demo

Visit the live application: [JobsIndia Portal](https://basamabhi2212.github.io/jobsindia/)

## Categories

- Government Jobs
- IT Jobs  
- Banking Jobs
- Healthcare Jobs
- Other Sectors

## Setup

1. Clone this repository
2. Install dependencies: `pip install -r requirements.txt`
3. Set environment variables for database and GitHub integration
4. Run: `python main.py`

## API Endpoints

- `GET /api/jobs` - Get all jobs with optional filtering
- `POST /api/admin/jobs` - Create new job (admin only)
- `DELETE /api/admin/jobs/{id}` - Delete job (admin only)
- `GET /api/admin/users` - Get all users (admin only)
- `POST /api/admin/users` - Create new user (admin only)

## Google Ads

Integrated with Google AdSense for revenue generation with responsive ad placements throughout the site.

## Contact

For any queries or support, please contact through the website's contact form.