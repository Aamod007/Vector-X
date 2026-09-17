# Contributing to Vector-X

Thank you for your interest in contributing to Vector-X! We welcome issues, suggestions, and pull requests from the developer community.

---

## Code of Conduct

All contributors and participants are expected to maintain a welcoming, respectful, and professional collaborative environment.

---

## Development Setup

### 1. Fork and Clone

1. Fork the repository on GitHub: [https://github.com/Aamod007/Vector-X](https://github.com/Aamod007/Vector-X)
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Vector-X.git
   cd Vector-X
   ```
3. Set the upstream remote:
   ```bash
   git remote add upstream https://github.com/Aamod007/Vector-X.git
   ```

### 2. Environment Setup

#### Python Backend
```bash
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux / macOS:
source .venv/bin/activate

pip install -r requirements.txt
pip install -e .
```

#### React Frontend
```bash
cd frontend
npm install
cd ..
```

---

## Branching & Workflow

1. Always create a descriptive topic branch off `main`:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```
2. Keep commits atomic and clearly describe what changed and why.
3. Keep your branch updated with upstream:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

---

## Coding Standards

### Python (Backend & Agents)
- Follow PEP 8 style guidelines.
- Use explicit type annotations for function signatures where possible.
- Avoid introducing circular imports across `backend` and `data_agents`.
- Ensure new agent tools properly handle exceptions and return structured dictionary responses.

### TypeScript / React (Frontend)
- Use functional components with typed props.
- Keep components modular and reusable.
- Verify that TypeScript compiles cleanly without errors:
  ```bash
  cd frontend
  npm run build
  ```

---

## Submitting Pull Requests

1. **Verify your changes**:
   - Run the frontend build: `npm run build` in `frontend/`.
   - Test backend imports: `python -c "import backend.server; print('Backend OK')"`.
   - Verify that existing routes and endpoints continue to function as expected.
2. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
3. **Open a Pull Request**:
   - Open a PR against the `main` branch of `Aamod007/Vector-X`.
   - Provide a clear summary of the changes, any associated issues, and testing steps.
   - Attach screenshots or recordings for UI updates where applicable.

---

## Reporting Issues

If you encounter bugs or have feature proposals:
1. Check the repository Issues tab to see if a discussion already exists.
2. Provide a clear title, reproduction steps, expected vs. actual behavior, and relevant logs or environment details.
