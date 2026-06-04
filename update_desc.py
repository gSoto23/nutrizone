import json
import re

def clean_description(desc):
    if not desc:
        return ""
        
    def extract_section(header):
        # Matches header exactly at the start of a line, then captures everything until the next all-caps header or end of string
        pattern = rf'(?:^|\n){header}:\n(.*?)(?=\n[A-Z0-9 ÁÉÍÓÚÑ]+:\n|\Z)'
        match = re.search(pattern, desc, re.DOTALL)
        if match:
            return match.group(1).strip()
        return None

    final_desc = []
    
    # Extract main description
    main_desc = extract_section("TEXTO COMERCIAL CORTO")
    if not main_desc:
        main_desc = extract_section("DESCRIPCIÓN DEL PRODUCTO")
        
    if main_desc:
        # Clean up any internal references if present
        main_desc = re.sub(r'Según la información del catálogo.*?,', '', main_desc, flags=re.IGNORECASE)
        final_desc.append(main_desc)
        
    # Extract and format other useful sections
    sections = [
        ("BENEFICIOS PRINCIPALES", "Beneficios Principales"), 
        ("INGREDIENTES ACTIVOS", "Ingredientes Activos"), 
        ("MODO DE USO SUGERIDO", "Modo de Uso"), 
        ("PRESENTACIÓN", "Presentación")
    ]
    
    for header, title in sections:
        content = extract_section(header)
        if content:
            # Clean up internal seller notes
            content = re.sub(r'Nota:.*?(?:\n|$)', '', content, flags=re.IGNORECASE).strip()
            content = re.sub(r'Para mejores resultados comerciales.*?(?:\n|$)', '', content, flags=re.IGNORECASE).strip()
            content = re.sub(r'Para una recomendación responsable.*?(?:\n|$)', '', content, flags=re.IGNORECASE).strip()
            content = re.sub(r'Su mayor ventaja comercial.*?(?:\n|$)', '', content, flags=re.IGNORECASE).strip()
            if content:
                final_desc.append(f"\n<strong>{title}</strong>\n{content}")
            
    # If parsing failed to find sections but there is text, fallback to keeping the original (unlikely based on format)
    result = "\n".join(final_desc).strip()
    return result if result else desc

def main():
    filepath = 'config/json-config.json'
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    for item in data:
        if 'description' in item and item['description']:
            item['description'] = clean_description(item['description'])

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
        
    print("Descriptions updated successfully.")

if __name__ == "__main__":
    main()
