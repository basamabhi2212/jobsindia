from app import db
from flask_login import UserMixin
from datetime import datetime
import json

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'is_admin': self.is_admin,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Job(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    company = db.Column(db.String(200), nullable=False)
    location = db.Column(db.String(200), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    job_type = db.Column(db.String(50), nullable=False, default='Full-time')
    experience = db.Column(db.String(50), nullable=False, default='Entry Level')
    salary = db.Column(db.String(100))
    description = db.Column(db.Text, nullable=False)
    requirements = db.Column(db.Text)
    application_url = db.Column(db.String(500))
    contact_email = db.Column(db.String(120))
    posted_date = db.Column(db.DateTime, default=datetime.utcnow)
    deadline = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'))

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'company': self.company,
            'location': self.location,
            'category': self.category,
            'job_type': self.job_type,
            'experience': self.experience,
            'salary': self.salary,
            'description': self.description,
            'requirements': self.requirements,
            'application_url': self.application_url,
            'contact_email': self.contact_email,
            'posted_date': self.posted_date.isoformat() if self.posted_date else None,
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'is_active': self.is_active
        }
