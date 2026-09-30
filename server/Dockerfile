FROM python:3.10-slim

ENV PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install system libraries required by OpenCV (libGL), PyTorch and image processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy application source code and weights
COPY . .

# Create uploads folder
RUN mkdir -p /app/static/uploads

EXPOSE 3838

CMD ["python", "app.py"]
