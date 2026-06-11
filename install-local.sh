#!/usr/bin/env bash
# TAYA — instala PostgreSQL + Redis + pgAdmin y crea la base de datos.
# Uso:  sudo bash ~/TaxiProject/install-local.sh
set -e

echo "==> apt update + instalar postgresql y redis"
apt update
apt install -y postgresql redis-server
systemctl enable --now postgresql redis-server

echo "==> crear usuario y base de datos taya"
sudo -u postgres psql -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='taya_user') THEN CREATE USER taya_user WITH PASSWORD 'password'; END IF; END \$\$;"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='taya_taxi'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE DATABASE taya_taxi OWNER taya_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE taya_taxi TO taya_user;"

echo "==> instalar pgAdmin4 (repo oficial)"
curl -fsS https://www.pgadmin.org/static/packages_pgadmin_org.pub \
  | gpg --dearmor -o /usr/share/keyrings/packages-pgadmin-org.gpg
echo "deb [signed-by=/usr/share/keyrings/packages-pgadmin-org.gpg] https://ftp.postgresql.org/pub/pgadmin/pgadmin4/apt/$(lsb_release -cs) pgadmin4 main" \
  > /etc/apt/sources.list.d/pgadmin4.list
apt update
apt install -y pgadmin4-desktop

echo ""
echo "==================================================="
echo " TODO INSTALADO OK"
echo " Postgres :5432  db=taya_taxi user=taya_user pass=password"
echo " Redis    :6379"
echo " pgAdmin4 -> menu de apps"
echo "==================================================="
pg_isready || true
redis-cli ping || true
