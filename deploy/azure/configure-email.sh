#!/bin/sh
set -eu

file=/opt/provaplus/.env.production
sender=donotreply@29246725-1717-479d-a420-5249b3101a51.azurecomm.net

test -f "$file"
connection=$(printf %s "$1" | base64 -d)
case "$connection" in
  endpoint=https://*\;accesskey=*) ;;
  *) echo 'String de conexão inválida.' >&2; exit 1 ;;
esac

umask 077
temp=$(mktemp "${file}.XXXXXX")
trap 'rm -f "$temp"' EXIT
grep -v -e '^AZURE_EMAIL_CONNECTION_STRING=' -e '^AZURE_EMAIL_FROM=' "$file" > "$temp" || true
printf 'AZURE_EMAIL_CONNECTION_STRING=%s\nAZURE_EMAIL_FROM=%s\n' "$connection" "$sender" >> "$temp"
chown --reference="$file" "$temp"
chmod 600 "$temp"
mv -f "$temp" "$file"
trap - EXIT
echo 'CONFIG_OK'
