// Vercel serverless function backing the dev panel's Save Settings button
// (CLAUDE.md Section 12l) - commits the posted settings dump to
// data/processed/dev-panel-settings.json in this repo via GitHub's Contents
// API, so a desktop Claude Code session working on the same repo can see
// what was last saved from ANY device/browser (including mobile, which has
// no local filesystem access of its own to write through with - that's what
// the File System Access API tier in index.html can't cover).
//
// Required Vercel project environment variables (see README.md for setup):
//   GITHUB_TOKEN            - fine-grained PAT, contents:read+write on this repo
//   DEV_PANEL_SAVE_SECRET   - shared anti-abuse token; must match the client's copy
// Optional (defaulted below):
//   GITHUB_REPO             - "owner/repo", defaults to "LeisHo/DickoClicko"
//   GITHUB_BRANCH           - defaults to "main"
//   SETTINGS_FILE_PATH      - defaults to "data/processed/dev-panel-settings.json"

const DEFAULT_REPO = 'LeisHo/DickoClicko';
// This repo's actual (and only) branch is "master", not GitHub's newer
// "main" default -- confirmed via `git branch -a`/`git remote show origin`
// (HEAD branch: master). A hardcoded 'main' here targets a branch that
// doesn't exist in this repo, and GitHub's Contents API returns a plain
// 404 for "branch not found" on the commit (PUT) step -- exactly the
// "GitHub commit failed 404" error a real user hit. Override via the
// GITHUB_BRANCH env var only if this repo's default branch is ever
// actually renamed to main.
const DEFAULT_BRANCH = 'master';
const DEFAULT_PATH = 'data/processed/dev-panel-settings.json';

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).json({ ok: false, error: 'Method not allowed' });
        return;
    }

    const secret = process.env.DEV_PANEL_SAVE_SECRET;
    const token = process.env.GITHUB_TOKEN;
    // Report exactly which var is missing, not a vague "one of these" -- a
    // real, previously-hit debugging pain point (per the workspace-wide
    // §12l reference spec this function is modeled on).
    const missing = [];
    if (!secret) missing.push('DEV_PANEL_SAVE_SECRET');
    if (!token) missing.push('GITHUB_TOKEN');
    if (missing.length) {
        res.status(500).json({ ok: false, error: `Server not configured - missing: ${missing.join(', ')}` });
        return;
    }
    if (req.headers['x-dev-panel-secret'] !== secret) {
        res.status(401).json({ ok: false, error: 'Unauthorized' });
        return;
    }

    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        res.status(400).json({ ok: false, error: 'Body must be a JSON object' });
        return;
    }

    const repo = process.env.GITHUB_REPO || DEFAULT_REPO;
    const branch = process.env.GITHUB_BRANCH || DEFAULT_BRANCH;
    const path = process.env.SETTINGS_FILE_PATH || DEFAULT_PATH;
    const apiUrl = `https://api.github.com/repos/${repo}/contents/${path}`;
    const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
    };

    try {
        // Current file's sha is required to update an existing file (absent
        // entirely for a brand-new file - a 404 here just means "create").
        let sha;
        const getResp = await fetch(`${apiUrl}?ref=${encodeURIComponent(branch)}`, { headers });
        if (getResp.ok) {
            const getData = await getResp.json();
            sha = getData.sha;
        } else if (getResp.status !== 404) {
            const errText = await getResp.text();
            res.status(502).json({ ok: false, error: `GitHub lookup failed (${getResp.status}): ${errText}` });
            return;
        }

        const content = Buffer.from(JSON.stringify(body, null, 2) + '\n', 'utf-8').toString('base64');
        const putResp = await fetch(apiUrl, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                message: 'Update dev-panel-settings.json via Save Settings',
                content,
                branch,
                ...(sha ? { sha } : {}),
            }),
        });

        if (!putResp.ok) {
            const errText = await putResp.text();
            res.status(502).json({ ok: false, error: `GitHub commit failed (${putResp.status}): ${errText}` });
            return;
        }

        const putData = await putResp.json();
        res.status(200).json({ ok: true, commitSha: putData.commit && putData.commit.sha });
    } catch (err) {
        res.status(500).json({ ok: false, error: String((err && err.message) || err) });
    }
};
