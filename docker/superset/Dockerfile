FROM apache/superset:latest
USER root
RUN apt-get update && apt-get install -y gcc python3-dev && pip install psycopg2-binary Pillow
USER superset