# To-Do App (Local Storage)

A simple, fast to-do list that saves automatically to your browser using `localStorage`. Built with plain HTML/CSS/JS so it works great on GitHub Pages.

## Features

- Add tasks with optional notes
- Mark complete/incomplete, edit, delete
- Search and filter (All / Active / Completed)
- Data is saved automatically to `localStorage`

## Run locally

Just open `index.html` in a browser:

```bash
xdg-open index.html
```

Or serve the folder with any static server.

## Deploy to GitHub Pages

1. Create a new repository on GitHub (e.g. `todo-app`).
2. Initialize git and push:

```bash
git init
git add .
git commit -m "Initial commit: To-Do app with localStorage"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git
git push -u origin main
```

3. Enable Pages: on GitHub → your repo → Settings → Pages → Source: `Deploy from a branch` → Branch: `main` and Folder: `/ (root)`.
4. Your site will be available at `https://<YOUR_USERNAME>.github.io/<YOUR_REPO>/` after it builds.

## Notes

- GitHub Pages is case-sensitive with paths; keep file names consistent.
- Data persists per origin. Your tasks on `localhost` are separate from tasks on the GitHub Pages URL. 