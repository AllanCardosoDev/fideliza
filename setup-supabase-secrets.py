#!/usr/bin/env python3
"""
Script para configurar secrets do Supabase automaticamente.
Use: python3 setup-supabase-secrets.py <service_role_key>
"""

import json
import sys
import requests
from pathlib import Path

SUPABASE_URL = "https://urysprfgdhfhkgzxkpru.supabase.co"
PROJECT_ID = "urysprfgdhfhkgzxkpru"

def load_google_credentials():
    """Carrega credenciais do Google Service Account"""
    cred_path = Path(__file__).parent / "credentials" / "google-service-account.json"
    with open(cred_path, "r", encoding="utf-8") as f:
        return json.load(f)

def set_secret(service_role_key, name, value):
    """Define um secret no Supabase via Management API"""
    headers = {
        "Authorization": f"Bearer {service_role_key}",
        "Content-Type": "application/json",
        "apikey": service_role_key,
    }
    
    # Tenta via /functions/v1/secrets ou /rest/v1/secrets
    url = f"{SUPABASE_URL}/rest/v1/secrets"
    
    # Primeiro tenta buscar se já existe
    get_response = requests.get(
        f"{url}?name=eq.{name}",
        headers=headers
    )
    
    payload = {"name": name, "value": value}
    
    if get_response.status_code == 200 and get_response.json():
        # Atualiza
        response = requests.patch(
            f"{url}?name=eq.{name}",
            json=payload,
            headers=headers
        )
        action = "atualizado"
    else:
        # Insere novo
        response = requests.post(
            url,
            json=payload,
            headers=headers
        )
        action = "criado"
    
    if response.status_code in [200, 201]:
        print(f"✅ {name} foi {action} com sucesso!")
        return True
    else:
        print(f"❌ Erro ao configurar {name}")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        return False

def main():
    if len(sys.argv) < 2:
        print("❌ Uso: python3 setup-supabase-secrets.py <service_role_key>")
        print("\nComo obter a chave:")
        print("1. Vá a: https://app.supabase.com")
        print("2. Selecione seu projeto")
        print("3. Vá em: Settings → API")
        print("4. Copie o 'service_role' (chave azul)")
        print("5. Execute: python3 setup-supabase-secrets.py <cole_a_chave_aqui>")
        sys.exit(1)
    
    service_role_key = sys.argv[1].strip()
    
    if len(service_role_key) < 50:
        print("❌ Chave inválida! Deve ser uma string longa.")
        sys.exit(1)
    
    print("🔧 Carregando credenciais...")
    google_creds = load_google_credentials()
    google_json = json.dumps(google_creds)
    
    print("📤 Configurando secrets no Supabase...\n")
    
    secrets = [
        ("GOOGLE_SERVICE_ACCOUNT", google_json),
        ("GOOGLE_CLIENTES_FOLDER_ID", "1cMF0yQawpwshJlvLF30hDC1HeZiJlyNOf"),
    ]
    
    all_success = True
    for name, value in secrets:
        success = set_secret(service_role_key, name, value)
        if not success:
            all_success = False
    
    if all_success:
        print("\n✅ Todos os secrets foram configurados!")
        print("🎉 Agora teste o upload de documentos no app!\n")
    else:
        print("\n❌ Alguns secrets falharam.")
        print("Tente configurar manualmente:")
        print("1. Vá a: https://app.supabase.com")
        print("2. Selecione seu projeto")
        print("3. Vá em: Settings → Edge Functions → Environment Variables")
        print("4. Clique em 'Create variable' e adicione os 2 secrets")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"❌ Erro: {e}")
        sys.exit(1)
