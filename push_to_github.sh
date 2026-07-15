#!/bin/bash

# 1. Initialize git if not already
if [ ! -d ".git" ]; then
    git init
fi

# 2. Add all changes
git add .

# 3. Commit
git commit -m "Enhance NetGraph: Neo4j integration, Redis caching, EdgeRank, and Real-time notifications"

# 4. Prompt for remote
echo "Please enter your GitHub repository URL (e.g., https://github.com/username/repo.git):"
read repo_url

# 5. Add remote and push
git remote add origin $repo_url
git branch -M main
git push -u origin main
