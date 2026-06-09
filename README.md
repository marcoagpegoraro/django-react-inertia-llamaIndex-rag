# Pulseboard

Pulseboard is a demo Django + React application that uses `inertia-django` to bridge classic Django views and a React frontend. The use case is a content planning dashboard: Django owns the models, filtering, validation, and redirects; React and Material UI handle the interactive workspace.

## Stack

- Django 5.2 LTS
- React 19
- Inertia 3 with `inertia-django`
- Vite + `django-vite`
- Material UI
- SQLite

## Local setup

1. Create and activate the virtualenv:

```bash
python3.12 -m venv .venv
source .venv/bin/activate
```

2. Install Python dependencies:

```bash
pip install -r requirements.txt
```

3. Install frontend dependencies:

```bash
pnpm install
```

4. Apply migrations:

```bash
python manage.py migrate
```

5. Seed the demo data:

```bash
python manage.py seed_demo
```

6. Run both dev servers in separate terminals:

```bash
python manage.py runserver
```

```bash
pnpm dev
```

Then open `http://127.0.0.1:8000`.

## Useful commands

```bash
python manage.py test
python manage.py seed_demo --reset
pnpm build
```

## How the bridge works

- Django renders the first response and returns Inertia page payloads for subsequent visits.
- The React app lives in `frontend/src` and resolves page components by name from Inertia.
- `studio.middleware.InertiaSharedDataMiddleware` shares app metadata, flash messages, and validation errors with every page.
- Non-GET requests from Inertia 3 send JSON by default, so the Django views parse JSON request bodies before binding forms.

## Production build

For a production asset build:

```bash
pnpm build
python manage.py collectstatic --noinput
```

## Docker

Build the image:

```bash
docker build -t pulseboard .
```

Run the container:

```bash
docker run --rm -p 8000:8000 pulseboard
```

The container runs migrations and `collectstatic` at startup, then serves the app with Gunicorn.
