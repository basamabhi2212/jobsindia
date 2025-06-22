import os
import json
import logging
from datetime import datetime
from flask import render_template, request, jsonify, session, redirect, url_for, flash
from werkzeug.security import generate_password_hash, check_password_hash
from app import app, db
from models import User, Job
from github_service import GitHubService
from excel_service import ExcelService

# Initialize services
github_service = GitHubService()
excel_service = ExcelService()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/style.css')
def serve_css():
    return app.send_static_file('style.css')

@app.route('/script.js')
def serve_js():
    return app.send_static_file('script.js')

@app.route('/api/jobs')
def get_jobs():
    try:
        category = request.args.get('category', 'all')
        search = request.args.get('search', '')
        limit = request.args.get('limit', type=int)
        
        query = Job.query.filter_by(is_active=True)
        
        if category != 'all':
            query = query.filter_by(category=category)
        
        if search:
            query = query.filter(
                db.or_(
                    Job.title.contains(search),
                    Job.company.contains(search),
                    Job.location.contains(search),
                    Job.description.contains(search)
                )
            )
        
        query = query.order_by(Job.posted_date.desc())
        
        if limit:
            query = query.limit(limit)
        
        jobs = query.all()
        return jsonify([job.to_dict() for job in jobs])
    
    except Exception as e:
        logging.error(f"Error fetching jobs: {str(e)}")
        return jsonify({'error': 'Failed to fetch jobs'}), 500

@app.route('/api/jobs/<int:job_id>')
def get_job(job_id):
    try:
        job = Job.query.get_or_404(job_id)
        return jsonify(job.to_dict())
    except Exception as e:
        logging.error(f"Error fetching job {job_id}: {str(e)}")
        return jsonify({'error': 'Job not found'}), 404

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400
        
        # Default admin credentials
        if username == 'admin' and password == 'admin123':
            session['admin_logged_in'] = True
            session['admin_username'] = username
            return jsonify({'success': True, 'message': 'Login successful'})
        
        # Check database for admin users
        user = User.query.filter_by(username=username).first()
        if user and user.is_admin and check_password_hash(user.password_hash, password):
            session['admin_logged_in'] = True
            session['admin_username'] = username
            return jsonify({'success': True, 'message': 'Login successful'})
        
        return jsonify({'error': 'Invalid credentials'}), 401
    
    except Exception as e:
        logging.error(f"Admin login error: {str(e)}")
        return jsonify({'error': 'Login failed'}), 500

@app.route('/api/admin/logout', methods=['POST'])
def admin_logout():
    session.pop('admin_logged_in', None)
    session.pop('admin_username', None)
    return jsonify({'success': True, 'message': 'Logged out successfully'})

@app.route('/api/admin/jobs', methods=['POST'])
def create_job():
    try:
        if not session.get('admin_logged_in'):
            return jsonify({'error': 'Admin authentication required'}), 401
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'company', 'location', 'category', 'description']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field.title()} is required'}), 400
        
        # Create new job
        job = Job(
            title=data['title'],
            company=data['company'],
            location=data['location'],
            category=data['category'],
            job_type=data.get('job_type', 'Full-time'),
            experience=data.get('experience', 'Entry Level'),
            salary=data.get('salary', ''),
            description=data['description'],
            requirements=data.get('requirements', ''),
            application_url=data.get('application_url', ''),
            contact_email=data.get('contact_email', ''),
            deadline=datetime.fromisoformat(data['deadline']) if data.get('deadline') else None
        )
        
        db.session.add(job)
        db.session.commit()
        
        # Save to GitHub Pages (if configured)
        try:
            github_service.save_job(job.to_dict())
        except Exception as e:
            logging.warning(f"GitHub save failed: {str(e)}")
        
        # Save to Excel (fallback)
        try:
            excel_service.save_job(job.to_dict())
        except Exception as e:
            logging.warning(f"Excel save failed: {str(e)}")
        
        return jsonify({
            'success': True, 
            'message': 'Job posted successfully',
            'job': job.to_dict()
        })
    
    except Exception as e:
        logging.error(f"Job creation error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to create job'}), 500

@app.route('/api/admin/jobs/<int:job_id>', methods=['PUT'])
def update_job(job_id):
    try:
        if not session.get('admin_logged_in'):
            return jsonify({'error': 'Admin authentication required'}), 401
        
        job = Job.query.get_or_404(job_id)
        data = request.get_json()
        
        # Update job fields
        for field in ['title', 'company', 'location', 'category', 'job_type', 
                     'experience', 'salary', 'description', 'requirements', 
                     'application_url', 'contact_email']:
            if field in data:
                setattr(job, field, data[field])
        
        if data.get('deadline'):
            job.deadline = datetime.fromisoformat(data['deadline'])
        
        if 'is_active' in data:
            job.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Job updated successfully',
            'job': job.to_dict()
        })
    
    except Exception as e:
        logging.error(f"Job update error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to update job'}), 500

@app.route('/api/admin/jobs/<int:job_id>', methods=['DELETE'])
def delete_job(job_id):
    try:
        if not session.get('admin_logged_in'):
            return jsonify({'error': 'Admin authentication required'}), 401
        
        job = Job.query.get_or_404(job_id)
        db.session.delete(job)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Job deleted successfully'})
    
    except Exception as e:
        logging.error(f"Job deletion error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to delete job'}), 500

@app.route('/api/export/excel')
def export_excel():
    try:
        if not session.get('admin_logged_in'):
            return jsonify({'error': 'Admin authentication required'}), 401
        
        jobs = Job.query.filter_by(is_active=True).all()
        file_path = excel_service.export_all_jobs([job.to_dict() for job in jobs])
        
        return jsonify({
            'success': True,
            'message': 'Excel file generated successfully',
            'file_path': file_path
        })
    
    except Exception as e:
        logging.error(f"Excel export error: {str(e)}")
        return jsonify({'error': 'Failed to export Excel file'}), 500

# User Management Routes
@app.route('/api/admin/users', methods=['GET'])
def get_users():
    try:
        if not session.get('admin_logged_in'):
            return jsonify({'error': 'Admin authentication required'}), 401
        
        users = User.query.all()
        return jsonify([user.to_dict() for user in users])
    
    except Exception as e:
        logging.error(f"Error fetching users: {str(e)}")
        return jsonify({'error': 'Failed to fetch users'}), 500

@app.route('/api/admin/users', methods=['POST'])
def create_user():
    try:
        if not session.get('admin_logged_in'):
            return jsonify({'error': 'Admin authentication required'}), 401
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field.title()} is required'}), 400
        
        # Check if username or email already exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 400
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        # Create new user
        user = User(
            username=data['username'],
            email=data['email'],
            password_hash=generate_password_hash(data['password']),
            is_admin=data.get('is_admin', False)
        )
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'User created successfully',
            'user': user.to_dict()
        })
    
    except Exception as e:
        logging.error(f"User creation error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to create user'}), 500

@app.route('/api/admin/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    try:
        if not session.get('admin_logged_in'):
            return jsonify({'error': 'Admin authentication required'}), 401
        
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        
        # Update user fields
        if 'username' in data and data['username'] != user.username:
            if User.query.filter_by(username=data['username']).first():
                return jsonify({'error': 'Username already exists'}), 400
            user.username = data['username']
        
        if 'email' in data and data['email'] != user.email:
            if User.query.filter_by(email=data['email']).first():
                return jsonify({'error': 'Email already exists'}), 400
            user.email = data['email']
        
        if 'password' in data and data['password']:
            user.password_hash = generate_password_hash(data['password'])
        
        if 'is_admin' in data:
            user.is_admin = data['is_admin']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'User updated successfully',
            'user': user.to_dict()
        })
    
    except Exception as e:
        logging.error(f"User update error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to update user'}), 500

@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    try:
        if not session.get('admin_logged_in'):
            return jsonify({'error': 'Admin authentication required'}), 401
        
        user = User.query.get_or_404(user_id)
        
        # Prevent deleting the last admin user
        if user.is_admin:
            admin_count = User.query.filter_by(is_admin=True).count()
            if admin_count <= 1:
                return jsonify({'error': 'Cannot delete the last admin user'}), 400
        
        # Don't allow deleting currently logged in user
        if user.username == session.get('admin_username'):
            return jsonify({'error': 'Cannot delete currently logged in user'}), 400
        
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'User deleted successfully'})
    
    except Exception as e:
        logging.error(f"User deletion error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to delete user'}), 500

@app.route('/api/admin/change-password', methods=['POST'])
def change_password():
    try:
        if not session.get('admin_logged_in'):
            return jsonify({'error': 'Admin authentication required'}), 401
        
        data = request.get_json()
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return jsonify({'error': 'Current and new passwords are required'}), 400
        
        username = session.get('admin_username')
        
        # Check if using default admin
        if username == 'admin':
            if current_password != 'admin123':
                return jsonify({'error': 'Current password is incorrect'}), 400
            
            # Create a proper admin user in database
            existing_user = User.query.filter_by(username='admin').first()
            if not existing_user:
                admin_user = User(
                    username='admin',
                    email='admin@jobsindia.com',
                    password_hash=generate_password_hash(new_password),
                    is_admin=True
                )
                db.session.add(admin_user)
                db.session.commit()
            else:
                existing_user.password_hash = generate_password_hash(new_password)
                db.session.commit()
            
            return jsonify({'success': True, 'message': 'Password changed successfully'})
        
        # For database users
        user = User.query.filter_by(username=username).first()
        if not user or not check_password_hash(user.password_hash, current_password):
            return jsonify({'error': 'Current password is incorrect'}), 400
        
        user.password_hash = generate_password_hash(new_password)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Password changed successfully'})
    
    except Exception as e:
        logging.error(f"Password change error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to change password'}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500
