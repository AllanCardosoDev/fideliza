import zipfile
import xml.etree.ElementTree as ET
import json

docx_path = r"Contrato Fideliza_ESC_0016_ Modelo.docx"

try:
    with zipfile.ZipFile(docx_path, 'r') as zip_ref:
        with zip_ref.open('word/document.xml') as xml_file:
            content = xml_file.read().decode('utf-8')
            
            # Parse XML
            root = ET.fromstring(content)
            
            # Namespace
            ns = {
                'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
                'wp': 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
                'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
                'pic': 'http://schemas.openxmlformats.org/drawingml/2006/picture'
            }
            
            # Extrair todo texto
            all_text = []
            for t in root.findall('.//w:t', ns):
                if t.text:
                    all_text.append(t.text)
            
            full_text = ''.join(all_text)
            
            # Salvar em arquivo legível
            with open('contratos_conteudo_extraido.txt', 'w', encoding='utf-8') as f:
                f.write(full_text)
            
            print("✅ Contrato extraído com sucesso!")
            print("\n" + "="*80)
            print(f"CONTEÚDO DO CONTRATO:\n")
            print("="*80)
            print(full_text)
            print("\n" + "="*80)
            
except Exception as e:
    print(f"❌ Erro: {e}")
    import traceback
    traceback.print_exc()
