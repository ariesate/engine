#!/usr/bin/env sh

# abort on errors
set -e

# build
npm run build

# cname
cp ./CNAME ./site/CNAME

# navigate into the build output directory
cd site

# if you are deploying to a custom domain
# echo 'www.example.com' > CNAME

git init
git add -A
git commit -m 'deploy'

# if you are deploying to https://<USERNAME>.github.io
git push -f git@github.com:ariesate/axii-site.git master

# if you are deploying to https://<USERNAME>.github.io/<REPO>
# git push -f git@github.com:<USERNAME>/<REPO>.git master:gh-pages

cd -