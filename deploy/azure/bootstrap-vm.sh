#!/usr/bin/env bash
set -euo pipefail

APP_DIR=/opt/provaplus
BRANCH=chore/deploy-backend
REPOSITORY=https://github.com/LuanaMelchioretto/Projeto-de-Software.git
API_DOMAIN=${API_DOMAIN:-provaplus-api-gm-2026.canadacentral.cloudapp.azure.com}

if [[ $(id -u) -ne 0 ]]; then
  echo 'Execute como root (por exemplo, via Azure Run Command).' >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq ca-certificates curl git gnupg openssl

if ! docker compose version >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  . /etc/os-release
  printf 'deb [arch=%s signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu %s stable\n' \
    "$(dpkg --print-architecture)" "${UBUNTU_CODENAME:-$VERSION_CODENAME}" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
systemctl enable --now docker

if [[ -d "$APP_DIR/.git" ]]; then
  git -C "$APP_DIR" fetch origin "$BRANCH:refs/remotes/origin/$BRANCH"
  git -C "$APP_DIR" checkout -B "$BRANCH" "refs/remotes/origin/$BRANCH"
  git -C "$APP_DIR" branch --set-upstream-to="origin/$BRANCH" "$BRANCH"
else
  git clone --depth 1 --branch "$BRANCH" "$REPOSITORY" "$APP_DIR"
fi

umask 077
if [[ ! -s "$APP_DIR/.env.production" ]]; then
  db_password=$(openssl rand -hex 24)
  mysql_root_password=$(openssl rand -hex 24)
  jwt_secret=$(openssl rand -hex 48)
  printf 'DB_PASSWORD=%s\nMYSQL_ROOT_PASSWORD=%s\nJWT_SECRET=%s\nAPI_DOMAIN=%s\n' \
    "$db_password" "$mysql_root_password" "$jwt_secret" "$API_DOMAIN" \
    > "$APP_DIR/.env.production"
fi
chmod 600 "$APP_DIR/.env.production"

cd "$APP_DIR"
docker compose --env-file .env.production -f compose.production.yaml up -d --build
docker compose --env-file .env.production -f compose.production.yaml ps
