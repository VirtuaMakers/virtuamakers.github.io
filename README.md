# virtuamakers.github.io

The official site for **VirtuaMakers** — a small, independent studio building
games, tools, and virtual worlds.

Live at **https://www.virtuamakers.com** (custom domain; the underlying
GitHub Pages URL, https://virtuamakers.github.io, still resolves too).

## Structure

| Path/File    | Purpose                                             |
| ------------ | ---------------------------------------------------- |
| `index.html` | The single-page landing site                        |
| `style.css`  | Styles (clean & minimal theme)                       |
| `main.js`    | Tiny progressive enhancement (year stamp)            |
| `CNAME`      | Custom domain config for GitHub Pages                |
| `Agora/`     | Agora — the social/marketplace subsite               |
| `VMEx.html`, `vmex.html` | Short `/VMEx` redirect alias to Agora's VirtuaMakers Exchange |

## Development

No build step. Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server
```

Then visit http://localhost:8000.

## Deploying

This is a GitHub Pages user site with a custom domain (see `CNAME`). Any
commit pushed to the default branch is published automatically to
https://www.virtuamakers.com.
