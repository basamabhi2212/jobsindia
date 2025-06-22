import os
import json
import requests
import base64
import logging
from datetime import datetime

class GitHubService:
    def __init__(self):
        self.token = os.getenv('GITHUB_TOKEN', '')
        self.repo_owner = os.getenv('GITHUB_REPO_OWNER', '')
        self.repo_name = os.getenv('GITHUB_REPO_NAME', '')
        self.file_path = os.getenv('GITHUB_FILE_PATH', 'jobs.json')
        self.base_url = 'https://api.github.com'
        
    def is_configured(self):
        return bool(self.token and self.repo_owner and self.repo_name)
    
    def get_file_content(self):
        """Get current content of jobs file from GitHub"""
        if not self.is_configured():
            return []
        
        try:
            url = f"{self.base_url}/repos/{self.repo_owner}/{self.repo_name}/contents/{self.file_path}"
            headers = {
                'Authorization': f'token {self.token}',
                'Accept': 'application/vnd.github.v3+json'
            }
            
            response = requests.get(url, headers=headers)
            
            if response.status_code == 404:
                # File doesn't exist yet
                return []
            
            if response.status_code == 200:
                content_data = response.json()
                content = base64.b64decode(content_data['content']).decode('utf-8')
                return json.loads(content)
            
            logging.warning(f"GitHub API response: {response.status_code}")
            return []
        
        except Exception as e:
            logging.error(f"Error getting GitHub file content: {str(e)}")
            return []
    
    def save_job(self, job_data):
        """Save a single job to GitHub Pages"""
        if not self.is_configured():
            logging.warning("GitHub not configured, skipping save")
            return False
        
        try:
            # Get current jobs
            current_jobs = self.get_file_content()
            
            # Add new job
            job_data['id'] = len(current_jobs) + 1
            job_data['posted_date'] = datetime.utcnow().isoformat()
            current_jobs.append(job_data)
            
            # Update file
            return self.update_jobs_file(current_jobs)
        
        except Exception as e:
            logging.error(f"Error saving job to GitHub: {str(e)}")
            return False
    
    def update_jobs_file(self, jobs_data):
        """Update the jobs file in GitHub"""
        if not self.is_configured():
            return False
        
        try:
            url = f"{self.base_url}/repos/{self.repo_owner}/{self.repo_name}/contents/{self.file_path}"
            headers = {
                'Authorization': f'token {self.token}',
                'Accept': 'application/vnd.github.v3+json'
            }
            
            # Get current file SHA if it exists
            sha = None
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                sha = response.json()['sha']
            
            # Prepare new content
            new_content = json.dumps(jobs_data, indent=2, ensure_ascii=False)
            encoded_content = base64.b64encode(new_content.encode('utf-8')).decode('utf-8')
            
            # Prepare update data
            update_data = {
                'message': f'Update jobs data - {datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")}',
                'content': encoded_content,
                'branch': 'main'
            }
            
            if sha:
                update_data['sha'] = sha
            
            # Update file
            response = requests.put(url, headers=headers, json=update_data)
            
            if response.status_code in [200, 201]:
                logging.info("Jobs data successfully saved to GitHub")
                return True
            else:
                logging.error(f"GitHub update failed: {response.status_code} - {response.text}")
                return False
        
        except Exception as e:
            logging.error(f"Error updating GitHub file: {str(e)}")
            return False
    
    def get_all_jobs(self):
        """Get all jobs from GitHub Pages"""
        return self.get_file_content()
