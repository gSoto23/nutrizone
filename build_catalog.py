import json
import re
import os
import urllib.request
import subprocess

BASE_URL = "https://senda.nutrizonecr.com"
ASSETS_DIR = "assets/products"

def clean_description(desc):
    if not desc:
        return ""
        
    def extract_section(header):
        pattern = rf'(?:^|\n){header}:\n(.*?)(?=\n[A-Z0-9 ÁÉÍÓÚÑ]+:\n|\Z)'
        match = re.search(pattern, desc, re.DOTALL)
        if match:
            return match.group(1).strip()
        return None

    final_desc = []
    
    main_desc = extract_section("TEXTO COMERCIAL CORTO")
    if not main_desc:
        main_desc = extract_section("DESCRIPCIÓN DEL PRODUCTO")
        
    if main_desc:
        main_desc = re.sub(r'Según la información del catálogo.*?,', '', main_desc, flags=re.IGNORECASE)
        final_desc.append(main_desc)
        
    sections = [
        ("BENEFICIOS PRINCIPALES", "Beneficios Principales"), 
        ("INGREDIENTES ACTIVOS", "Ingredientes Activos"), 
        ("MODO DE USO SUGERIDO", "Modo de Uso"), 
        ("PRESENTACIÓN", "Presentación")
    ]
    
    for header, title in sections:
        content = extract_section(header)
        if content:
            content = re.sub(r'Nota:.*?(?:\n|$)', '', content, flags=re.IGNORECASE).strip()
            content = re.sub(r'Para mejores resultados comerciales.*?(?:\n|$)', '', content, flags=re.IGNORECASE).strip()
            content = re.sub(r'Para una recomendación responsable.*?(?:\n|$)', '', content, flags=re.IGNORECASE).strip()
            content = re.sub(r'Su mayor ventaja comercial.*?(?:\n|$)', '', content, flags=re.IGNORECASE).strip()
            if content:
                final_desc.append(f"\n<strong>{title}</strong>\n{content}")
            
    result = "\n".join(final_desc).strip()
    return result if result else desc

def optimize_image(img_path):
    try:
        from PIL import Image
        webp_path = img_path.rsplit('.', 1)[0] + '.webp'
        with Image.open(img_path) as img:
            max_width = 800
            if img.width > max_width:
                ratio = max_width / float(img.width)
                new_height = int((float(img.height) * float(ratio)))
                img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
            img.save(webp_path, 'webp', quality=80, method=6)
        if img_path != webp_path:
            os.remove(img_path)
        return webp_path
    except Exception as e:
        print(f"Warning: Could not convert {img_path} to WebP using Pillow. Kept original. ({e})")
        return img_path

def download_and_optimize_image(image_url):
    if not image_url:
        return None
        
    # If the image is already a local asset, skip downloading
    if image_url.startswith('assets/'):
        return image_url
        
    # Construct full URL if it's a relative path from the old system
    if image_url.startswith('/static/'):
        full_url = BASE_URL + image_url
    elif image_url.startswith('http'):
        full_url = image_url
    else:
        return image_url # Unrecognized format, leave as is
        
    # Create local assets directory if it doesn't exist
    os.makedirs(ASSETS_DIR, exist_ok=True)
    
    # Extract filename from URL
    filename = full_url.split('/')[-1]
    
    # Sometimes urls have query params, strip them for the filename
    filename = filename.split('?')[0]
    
    local_path = os.path.join(ASSETS_DIR, filename)
    
    # Download the image
    print(f"Downloading {full_url}...")
    try:
        urllib.request.urlretrieve(full_url, local_path)
    except Exception as e:
        print(f"Error downloading {full_url}: {e}")
        return image_url # Fallback to original url on failure
        
    # Optimize the image
    print(f"Optimizing {local_path}...")
    final_path = optimize_image(local_path)
    
    return final_path

def main():
    filepath = 'config/json-config.json'
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"Procesando {len(data)} productos...")
    
    for item in data:
        print(f"-> Analizando {item.get('sku', 'Unknown SKU')}...")
        
        # 1. Update Description
        if 'description' in item and item['description']:
            item['description'] = clean_description(item['description'])
            
        # 2. Update Image
        if 'image_url' in item:
            new_url = download_and_optimize_image(item['image_url'])
            if new_url:
                # Ensure forward slashes for web paths
                item['image_url'] = new_url.replace('\\', '/')

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
        
    print("\n¡Catálogo construido con éxito! Descripciones limpias e imágenes locales en WebP.")

if __name__ == "__main__":
    main()
