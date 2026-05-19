from copy import deepcopy

from flask import Flask, jsonify, render_template, url_for

app = Flask(__name__)

OPEN_ONDEMAND_TOOLS_APPS = [
    {"id": "terminal", "name": "Terminal", "kind": "icon", "icon": "fas fa-terminal", "href": "#"},
    {"id": "files", "name": "Files", "kind": "icon", "icon": "far fa-folder", "endpoint": "files"},
    {"id": "rc-documents", "name": "RC Documents", "kind": "image", "image": "assets/RC-Document.svg", "href": "#"},
    {
        "id": "partition-usage-status",
        "name": "Partition Usage Status",
        "kind": "gauge",
        "gauge_id": "nodes",
        "endpoint": "partition_usage",
    },
]


def get_cluster_usage_stats() -> dict:
    """Return current cluster usage stats (replace with live cluster API later)."""
    return CLUSTER_USAGE_STATS


def enrich_gauge_app(item: dict, stats: dict) -> dict:
    """Attach live gauge values for dashboard / nav gauge icons."""
    if item.get("kind") != "gauge":
        return item

    gauge_id = item.get("gauge_id", "nodes")
    gauge = next((g for g in stats["gauges"] if g["id"] == gauge_id), None)
    if not gauge:
        return item

    usage_pct = gauge["usage_pct"]
    item["usage_pct"] = usage_pct
    item["gauge_tier"] = "high" if usage_pct >= 75 else gauge["tier"]
    item["gauge_circumference"] = stats["gauge_circumference"]
    return item


def resolve_app_links(apps: list[dict]) -> list[dict]:
    """Resolve internal routes via url_for (respects SCRIPT_NAME on GitHub Pages)."""
    stats = get_cluster_usage_stats()
    resolved = []
    for entry in apps:
        item = enrich_gauge_app(dict(entry), stats)
        endpoint = item.get("endpoint")
        if endpoint:
            item["href"] = url_for(endpoint)
        resolved.append(item)
    return resolved

# Demo data for Partition Usage Statistics (wireframe-aligned; replace with live cluster API later).
CLUSTER_USAGE_STATS = {
    "gauge_radius": 52,
    # stroke-dasharray: arc length then gap (full circumference = 2*pi*r).
    "gauge_circumference": 326.73,
    "gauges": [
        {"id": "nodes", "title": "Node Status", "usage_pct": 40, "available": "222", "tier": "low"},
        {"id": "cores", "title": "Core Status", "usage_pct": 60, "available": "14k", "tier": "mid"},
        {"id": "gpus", "title": "GPU Status", "usage_pct": 85, "available": "132", "tier": "high"},
        {"id": "partition", "title": "Overall Partition Space", "usage_pct": 48, "full_partitions": 0, "tier": "mid"},
    ],
    # All scheduler partitions exposed in interactive apps (e.g. Jupyter); replace with live sinfo later.
    "partitions": [
        {"label": "slurm", "usage_pct": 38, "tier": "low"},
        {"label": "short", "usage_pct": 72, "tier": "mid"},
        {"label": "a100", "usage_pct": 55, "tier": "mid"},
        {"label": "a100_shared", "usage_pct": 68, "tier": "mid"},
        {"label": "h100", "usage_pct": 88, "tier": "high"},
        {"label": "h100_shared", "usage_pct": 61, "tier": "mid"},
        {"label": "fat", "usage_pct": 42, "tier": "low"},
        {"label": "fat_shared", "usage_pct": 79, "tier": "mid"},
        {"label": "custom", "usage_pct": 15, "tier": "low"},
    ],
    # Cluster-wide job totals (demo; replace with squeue/sacct-derived metrics later).
    "jobs_running": 1247,
    "jobs_queued": 14,
    "avg_queue_wait_display": "22 min",
}

# Dashboard sections; cluster/shell/status and home-directory launchers live under Open OnDemand Tools.
DASHBOARD_SECTIONS = [
    {
        "id": "open-ondemand-tools",
        "title": "Open OnDemand Tools",
        "apps": OPEN_ONDEMAND_TOOLS_APPS,
    },
    {
        "id": "interactive-apps",
        "title": "Interactive Apps",
        "apps": [
            {"id": "desktop", "name": "Desktop", "kind": "icon", "icon": "fas fa-desktop", "href": "#"},
            {
                "id": "jupyter",
                "name": "Jupyter Notebook",
                "kind": "image",
                "image": "assets/Jupyter.svg",
                "endpoint": "jupyter",
            },
            {"id": "matlab", "name": "Matlab", "kind": "image", "image": "assets/Matlab_Logo.png", "href": "#"},
            {"id": "rstudio", "name": "RStudio", "kind": "image", "image": "assets/R_logo.svg", "href": "#", "icon_img_size": "sm"},
            {"id": "vmd", "name": "VMD", "kind": "image", "image": "assets/VMD Logo.png", "href": "#"},
            {
                "id": "vscode",
                "name": "VSCode Editor",
                "kind": "image",
                "image": "assets/vscode.svg",
                "href": "#",
                "icon_img_size": "sm",
            },
        ],
    },
    {
        "id": "jobs",
        "title": "Jobs",
        "apps": [
            {"id": "active-jobs", "name": "Active Jobs", "kind": "icon", "icon": "far fa-clock", "endpoint": "job_status"},
            {"id": "job-composer", "name": "Job Composer", "kind": "icon", "icon": "fas fa-wand-magic-sparkles", "href": "#"},
        ],
    },
]

# Demo active jobs for the top bar (empty list shows "No active jobs present")
ACTIVE_JOBS = [
    {"name": "Jupyter Notebook - Clay", "app_id": "jupyter"},
    {"name": "Jupyter Lab - Graphical Analysis", "app_id": "jupyter"},
    {"name": "VSCode - Flask Server", "app_id": "vscode"},
]


def _interactive_apps_by_id() -> dict[str, dict]:
    by_id: dict[str, dict] = {}
    for section in DASHBOARD_SECTIONS:
        if section["id"] != "interactive-apps":
            continue
        for app in section["apps"]:
            by_id[app["id"]] = app
    return by_id


def resolve_active_jobs() -> list[dict]:
    """Attach interactive-app icon metadata to each active job."""
    apps_by_id = _interactive_apps_by_id()
    resolved = []
    for job in ACTIVE_JOBS:
        app = apps_by_id.get(job["app_id"])
        if not app:
            continue
        resolved.append({"name": job["name"], "app": app})
    return resolved

FILES_DIRECTORY = {
    "segments": ["people", "User1", "Demo"],
    "rows": [
        {"name": "marianas", "type": "folder", "icon": "fas fa-folder", "size": "-", "modified": "3 months ago", "owner": "tim", "mode": "drwxr-xr-x"},
        {"name": "alltest.json", "type": "file", "icon": "fas fa-file", "size": "1.21 kB", "modified": "2 weeks ago", "owner": "tim", "mode": "-rw-r--r--"},
        {"name": "alltest.ipynb", "type": "notebook", "icon": "fas fa-spinner", "size": "145.63 kB", "modified": "1 month ago", "owner": "tim", "mode": "-rw-r--r--"},
        {"name": "script.sh", "type": "script", "icon": "far fa-file-code", "size": "2.37 kB", "modified": "3 days ago", "owner": "tim", "mode": "-rwxr-xr-x", "selected": True},
        {"name": "run.log", "type": "log", "icon": "far fa-rectangle-list", "size": "8.14 kB", "modified": "5 days ago", "owner": "tim", "mode": "-rw-r--r--", "selected": True},
        {"name": "readme.md", "type": "file", "icon": "fas fa-file", "size": "1.02 kB", "modified": "2 weeks ago", "owner": "tim", "mode": "-rw-r--r--"},
        {"name": "config.json", "type": "config", "icon": "fas fa-code", "size": "657 B", "modified": "1 month ago", "owner": "tim", "mode": "-rw-r--r--"},
        {"name": "data.csv", "type": "data", "icon": "fas fa-file", "size": "3.22 kB", "modified": "2 months ago", "owner": "tim", "mode": "-rw-r--r--"},
        {"name": "results.tar.gz", "type": "archive", "icon": "fas fa-file-zipper", "size": "12.45 MB", "modified": "1 month ago", "owner": "tim", "mode": "-rw-r--r--"},
        {"name": "notes.txt", "type": "text", "icon": "fas fa-file", "size": "420 B", "modified": "1 week ago", "owner": "tim", "mode": "-rw-r--r--"},
        {"name": ".env", "type": "dotfile", "icon": "fas fa-file", "size": "168 B", "modified": "4 weeks ago", "owner": "tim", "mode": "-rw-------", "dotfile": True},
    ],
}

USER_SETTINGS_DEFAULTS = {
    "user_email": "User@email.com",
    "billing_accounts": [
        {"id": "Oceanography Dept.", "label": "Oceanography Dept."},
    ],
    "default_billing_account_id": "Oceanography Dept.",
}


@app.context_processor
def inject_nav():
    return {
        "active_jobs": resolve_active_jobs(),
        "tools_apps": resolve_app_links(OPEN_ONDEMAND_TOOLS_APPS),
        "user_settings_defaults": USER_SETTINGS_DEFAULTS,
    }


@app.route("/")
def dashboard():
    sections = []
    for section in DASHBOARD_SECTIONS:
        section_copy = deepcopy(section)
        section_copy["apps"] = resolve_app_links(section["apps"])
        sections.append(section_copy)
    return render_template("dashboard.html", sections=sections)


@app.route("/jupyter")
def jupyter():
    return render_template("jupyter.html")


@app.route("/files")
def files():
    return render_template("files.html", directory=FILES_DIRECTORY)


@app.route("/job-status")
def job_status():
    return render_template("job_status.html")


@app.route("/partition-usage")
def partition_usage():
    cu = get_cluster_usage_stats()
    cluster_usage = {
        **cu,
        "jobs_running_display": f"{cu['jobs_running']:,}",
        "jobs_queued_display": f"{cu['jobs_queued']:,}",
    }
    return render_template("partition_usage.html", cluster_usage=cluster_usage)


@app.route("/api/cluster-usage-stats")
def cluster_usage_stats_api():
    return jsonify(get_cluster_usage_stats())


if __name__ == "__main__":
    app.run(debug=True, port=8080)
