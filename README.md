# Reikai

A free, open-source hub of browser hardening and privacy tools, hosted on GitHub Pages.

**Live site:** https://apauruseya-stack.github.io/

## Adding a project

All projects live in `data/projects.json`. To add one, append an object to the `projects` array:

```json
{
  "id": "my-project",
  "name": "my-project",
  "tagline": "Short tagline",
  "description": "Longer description.",
  "category": "browser-hardening",
  "tags": ["privacy", "firefox"],
  "status": "stable",
  "version": "v1.0.0",
  "highlights": ["Feature A", "Feature B"],
  "links": {
    "github": "https://github.com/...",
    "docs": "https://...",
    "release": "https://github.com/.../releases/latest"
  }
}
```

Categories are defined in the `categories` array. Status can be `stable`, `beta` or `planned`.

The site is fully data-driven: no build step, no framework. Edit the JSON, commit, push - GitHub Pages updates automatically.

## Local preview

```bash
cd reikai
python3 -m http.server 8000
# open http://localhost:8000
```

## License

MIT.