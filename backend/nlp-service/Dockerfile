# Step 1 — Start with Python 3.11 on lightweight Linux
# "slim" = smaller version of Python image — faster to download
FROM python:3.11-slim

# Step 2 — Create /app folder inside the container
WORKDIR /app

# Step 3 — Copy requirements file first
# Same reason as Node.js — Docker caches this step
# If requirements haven't changed, it won't reinstall everything
COPY requirements.txt .

# Step 4 — Install all Python packages
# Same as running pip install in your terminal
# --no-cache-dir = don't store cache — keeps container small
RUN pip install --no-cache-dir -r requirements.txt

# Step 5 — Copy all the Python code into the container
COPY . .

# Step 6 — Tell Docker this container uses port 8000
EXPOSE 8000

# Step 7 — Start the FastAPI server
# Same as typing "uvicorn main:app --port 8000" in your terminal
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]