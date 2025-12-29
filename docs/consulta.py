import requests
from urllib.parse import quote
import re
import json

CNPJ = "80213705000126"
LOJA = "LJ DAL POZZO CIDADE DOS LAGOS"
CATEGORIA = "ACHOCOLATADOS"

def get_token():
    url_auth = f"https://api.webjasper.com.br/auth/{CNPJ}"
    payload = {
        "usuario": "WJDALPOZZO",
        "senha": "12345678"
    }
    response = requests.post(url_auth, json=payload)
    if response.status_code == 200:
        try:
            return response.json().get("token")
        except Exception:
            print("Erro ao decodificar JSON na autenticação:", response.text)
    else:
        print("Erro na autenticação:", response.status_code, response.text)
    return None

TOKEN = get_token()

# codifica o nome da loja e categoria para URL
loja_encoded = quote(LOJA)
categoria_encoded = quote(CATEGORIA)

url = f"https://api.webjasper.com.br/parametrizacao/{CNPJ}/{loja_encoded}/{categoria_encoded}"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/json"
}

response = requests.get(url, headers=headers)
print("Status code:", response.status_code)

try:
    data = response.json()
    formatted = json.dumps(data, indent=2, ensure_ascii=False)
    print(formatted)
    with open("resultado.json.txt", "w", encoding="utf-8") as f:
        f.write(formatted)
except Exception:
    text = response.text
    try:
        # Detect two JSON objects concatenated without separator using regex
        matches = re.findall(r'(\{.*?\})(?=\{)', text, re.DOTALL)
        if matches:
            # Extract the first JSON object
            first_json_str = matches[0]
            # The second JSON object starts immediately after the first ends
            second_json_start = text.find(first_json_str) + len(first_json_str)
            second_json_str = text[second_json_start:].strip()
            # Attempt to parse both JSON objects
            first_json = json.loads(first_json_str)
            second_json = json.loads(second_json_str)
            # Combine them into a list or dict as needed
            combined = [first_json, second_json]
            formatted = json.dumps(combined, indent=2, ensure_ascii=False)
            print(formatted)
            with open("resultado.json.txt", "w", encoding="utf-8") as f:
                f.write(formatted)
        else:
            # If regex didn't find two JSON objects, try to load as is
            data = json.loads(text)
            formatted = json.dumps(data, indent=2, ensure_ascii=False)
            print(formatted)
            with open("resultado.json.txt", "w", encoding="utf-8") as f:
                f.write(formatted)
    except Exception:
        print("Erro ao decodificar JSON e não foi possível corrigir. Resposta crua:")
        print(text)