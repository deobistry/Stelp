// RapidAPI Job Search Integration
const RAPID_API_KEY = "ff75c8d018mshf82e8890c63b33ep130186jsn5f2fd6c71386"; // Replace with your actual RapidAPI key
const JOBS_ENDPOINT = "https://jsearch.p.rapidapi.com/search";

// Function to fetch jobs from RapidAPI
async function fetchJobs(query, experience) {
    try {
        const params = new URLSearchParams({
            query: query,
            page: "1",
            num_pages: "1",
            date_posted: "all",
            remote_jobs_only: "false"
        });

        const response = await fetch(`${JOBS_ENDPOINT}?${params}`, {
            method: "GET",
            headers: {
                "X-RapidAPI-Key": RAPID_API_KEY,
                "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
            }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        // Filter by experience if specified
        let results = data.data || [];
        
        if (experience && experience !== "") {
            // Simple experience filter logic
            results = filterJobsByExperience(results, experience);
        }
        
        return results;
    } catch (error) {
        console.error("Error fetching jobs:", error);
        return [];
    }
}

// Function to filter jobs by experience level
function filterJobsByExperience(jobs, experienceRange) {
    // Simple rule-based filtering based on job description and title
    return jobs.filter(job => {
        const description = (job.job_description || '').toLowerCase();
        const title = (job.job_title || '').toLowerCase();
        const combinedText = description + ' ' + title;
        
        switch (experienceRange) {
            case '0-1':
                return combinedText.includes('entry') || 
                       combinedText.includes('junior') || 
                       combinedText.includes('intern') ||
                       combinedText.includes('no experience') ||
                       combinedText.includes('0-1') ||
                       combinedText.includes('0 - 1');
            case '1-3':
                return combinedText.includes('junior') ||
                       combinedText.includes('1-3') ||
                       combinedText.includes('1 - 3') ||
                       combinedText.includes('1+ year') ||
                       combinedText.includes('2+ year');
            case '3-5':
                return combinedText.includes('mid-level') ||
                       combinedText.includes('mid level') ||
                       combinedText.includes('3-5') ||
                       combinedText.includes('3 - 5') ||
                       combinedText.includes('3+ year') ||
                       combinedText.includes('4+ year');
            case '5-10':
                return combinedText.includes('senior') ||
                       combinedText.includes('5-10') ||
                       combinedText.includes('5 - 10') ||
                       combinedText.includes('5+ year') ||
                       combinedText.includes('7+ year');
            case '10+':
                return combinedText.includes('senior') ||
                       combinedText.includes('lead') ||
                       combinedText.includes('principal') ||
                       combinedText.includes('10+') ||
                       combinedText.includes('10 +') ||
                       combinedText.includes('10 year');
            default:
                return true; // No filtering if no experience selected
        }
    });
}

// Function to display fetched jobs in the results container
function displayJobs(jobs) {
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.innerHTML = '';
    
    if (jobs.length === 0) {
        resultsContainer.innerHTML = '<p style="text-align: center;">No job matches found. Try adjusting your search criteria.</p>';
        return;
    }
    
    jobs.forEach(job => {
        const resultCard = document.createElement('div');
        resultCard.className = 'result-card';
        
        // Extract required details from job object
        const title = job.job_title || 'Job Title Not Available';
        const company = job.employer_name || 'Company Not Available';
        const jobType = job.job_employment_type || 'Not Specified';
        const isRemote = job.job_is_remote ? 'Remote' : 'On-site';
        const jobUrl = job.job_apply_link || '#';
        const jobDescription = job.job_description || 'No description available';
        const jobSkills = extractSkills(jobDescription);
        
        resultCard.innerHTML = `
            <h3>${title}</h3>
            <div class="result-details">
                <strong>${company}</strong> • ${isRemote} • ${jobType}
            </div>
            <p>${truncateText(jobDescription, 150)}</p>
            <div class="result-skills">
                ${jobSkills.map(skill => `<span class="result-skill">${skill}</span>`).join('')}
            </div>
            <div class="result-actions">
                <div class="result-platform">
                    <i class="fas fa-globe"></i> via JSearch API
                </div>
                <a href="${jobUrl}" target="_blank" class="btn">Apply Now</a>
            </div>
        `;
        
        resultsContainer.appendChild(resultCard);
    });
}

// Extract likely skills from job description
function extractSkills(description) {
    // Common tech skills to look for
    const commonSkills = [
        "JavaScript", "Python", "Java", "C++", "Ruby", "PHP", "SQL", "HTML", "CSS",
        "React", "Angular", "Vue", "Node.js", "Express", "Django", "Flask",
        "AWS", "Azure", "GCP", "Docker", "Kubernetes", "DevOps",
        "Machine Learning", "AI", "Data Analysis", "Data Science",
        "Communication", "Leadership", "Project Management", "Agile", "Scrum"
    ];
    
    // Find skills mentioned in the description
    const foundSkills = commonSkills.filter(skill => 
        description.toLowerCase().includes(skill.toLowerCase())
    );
    
    // Return up to 5 skills, or default skills if none found
    return foundSkills.length > 0 ? 
        foundSkills.slice(0, 5) : 
        ["Communication", "Problem Solving", "Teamwork"];
}

// Helper function to truncate text
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}

// Function to get only skills for the search query
function getSkillsForQuery() {
    // Get skills from skill tags
    const skills = Array.from(document.querySelectorAll('.skill-tag'))
        .map(tag => tag.textContent.trim().replace(/×/g, '').trim());
    
    return skills.join(' ');
}

// Update search button click event
document.addEventListener('DOMContentLoaded', function() {
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', async function() {
            // Show results section
            document.getElementById('results-section').style.display = 'block';
            
            // Show loader
            document.getElementById('loader').style.display = 'flex';
            document.getElementById('results-container').style.display = 'none';
            
            // Scroll to results
            document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
            
            // Only use skills for the query
            const skillsQuery = getSkillsForQuery();
            const experience = document.getElementById('experience').value;
            
            try {
                // Fetch jobs using only skills query and experience
                const jobs = await fetchJobs(skillsQuery, experience);
                
                // Hide loader and show results
                document.getElementById('loader').style.display = 'none';
                document.getElementById('results-container').style.display = 'block';
                
                // Display jobs
                displayJobs(jobs);
            } catch (error) {
                console.error("Error in job search:", error);
                document.getElementById('loader').style.display = 'none';
                document.getElementById('results-container').style.display = 'block';
                document.getElementById('results-container').innerHTML = 
                    '<p style="text-align: center;">Error fetching job data. Please try again later.</p>';
            }
        });
    }
    
    // Update platform buttons to use only skills
    document.querySelectorAll('.platform-card .btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const platform = this.parentElement.querySelector('h3').textContent;
            const skills = getSkillsForQuery();
            
            // For demo, we'll just open the original URLs with only skills
            let url = '';
            switch (platform) {
                case 'LinkedIn':
                    url = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(skills)}`;
                    break;
                case 'Indeed':
                    url = `https://www.indeed.com/jobs?q=${encodeURIComponent(skills)}`;
                    break;
                case 'Unstop':
                    url = `https://unstop.com/search-opportunities?keyword=${encodeURIComponent(skills)}`;
                    break;
            }
            
            if (url) {
                window.open(url, '_blank');
            }
        });
    });
});